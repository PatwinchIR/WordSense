import pandas as pd
import nltk
from nltk.corpus import wordnet
from nltk.stem import WordNetLemmatizer 
import postgres_config
import numpy as np
import mysql_config
import copy
from sqlalchemy import create_engine

lemmatizer = WordNetLemmatizer()

def getTokensForCorpus(corpus_name, cdb_engine):
    '''get all tokens from a corpus using childes-db'''
    # use `corpus_id` reather than `corpus_name` because it is faster
    corpus_id = pd.read_sql_query('SELECT id from corpus where name = "'+corpus_name+'"', 
        cdb_engine).iloc[0]['id']
    tokens = pd.read_sql_query('SELECT * from token where corpus_id = '+str(corpus_id), cdb_engine)
    return tokens

def downsample_pos(full_pos, childes_to_wordnet_pos):
    '''return a simple part of speech for a more complex one'''
    if full_pos in childes_to_wordnet_pos.keys():
        return(full_pos)
    elif full_pos.split(':')[0] in childes_to_wordnet_pos.keys():
        return(full_pos.split(':')[0])    
    elif ' ' in full_pos.split():
        print('POS contains space: '+full_pos)
        return(None)
    else:
        print('Not recognized! '+full_pos)        
        return(None)

def get_lemma_for_token_and_pos(token, childes_pos, lemmatizer, childes_to_wordnet_pos, verbose=False):
    '''get the lemma for a given word token + pos'''
    if childes_pos in childes_to_wordnet_pos:
        return(lemmatizer.lemmatize(token, childes_to_wordnet_pos[childes_pos]))
    else:
        if verbose:
            print('Unrecognized part of speech!')
            print(token)
            print(childes_pos)
        return(None)
    
def get_time_interval(ages_in_days, interval_in_months):
    '''relabel a vector of times following an interval_in_months'''
    
    def get_interval(age, start_times_in_months, labels):
        return(labels[np.max(np.argwhere(start_times_in_days < age))])
    
    start_times_in_months = np.arange(start=0, stop=4*12, step=interval_in_months)
    end_times_in_months = start_times_in_months + interval_in_months 
    labels = [str(np.char.zfill(str(start_times_in_months[x]), 2)) + '-'+ str(np.char.zfill(str(end_times_in_months[x]), 2)) for x in range(len(start_times_in_months))]
    start_times_in_days = start_times_in_months * 30.5
    
    return([get_interval(age_in_days, start_times_in_months, labels) for age_in_days in \
        ages_in_days])

def get_speaker_group(speaker_codes, stratify_by_speakers):
    '''relabel a vector of speaker codes following stratify_by_speakers'''
    speaker_dict = {}
    for speaker_group in stratify_by_speakers:
        #print('speaker_group: '+' '.join(speaker_group))
        if len(speaker_group) > 1:
            label = '-'.join(speaker_group)
        else:
            label = speaker_group[0]        
        for speaker in speaker_group:
            #print('speaker: '+speaker)
            if speaker in speaker_dict:
                raise ValueError('A speaker cannot be assigned to multiple speaker groups')
            speaker_dict[speaker] = label
    return([speaker_dict[x] if x in speaker_dict else None for x in speaker_codes])    

def prep_derived_table(tokens):
    '''apply the same manipulations and the populate_derived_tokens script used to populate Django'''
    rdicts = []
    for record in tokens.to_dict('records'):
        record['token_id'] = record['id']
        record['gloss_with_replacement'] = "_" if record['gloss'] in {'xxxxx', 'xxxx', 'xxx', 
            'yyy', 'zzz'} \
            else record['gloss'] if not record['replacement'] \
                else record['replacement']
        record['part_of_speech'] = record['part_of_speech'] if \
            record['part_of_speech'] else "_"
        record['requires_tags'] = False
        rdicts.append(record)
    rdf = pd.DataFrame(rdicts)
    return(rdf)

def subsampleCorpus(tokens, word_filter_list, interval, stratify_by_speakers, 
    max_tokens_per_interval, pos_map, childes_to_wordnet_pos):
    '''subsample a corpus using the following parameters'''

    # `tokens`: a dataframe of tokens to determine if `requires_tags` is true or false
    # `word_filter_list`: a list of lemmas to include (e.g. CDI). If None, no filter applied
    # `interval`: duration in months of the interval used for strarified sampling
    # `stratify_by_speaker`: list of lists, eg [['CHI'], ['MOT','FAT']] statifies by 
    #         child vs. parents; if none, does not stratify by speaker
    # `max_tokens_per_interval`: set a ceiling of this number of tokens per type 
    # `visualize_full_corpus`: plot the corpus statistics (# of types and number
    #of tokens per month)
    
    agg_by = []        
    #0. Apply the same set of exlcusions and manipulations that are in populate_derived_tokens
    print("Adding columns necessary for derived_tokens...")
    tokens = prep_derived_table(tokens)
    
    #1. Add the roots  and filter to the word filter list
    if word_filter_list is not None:       
        print("Filtering words....")
        tokens['root'] = [get_lemma_for_token_and_pos(
            record['gloss_with_replacement'],
            record['part_of_speech'], lemmatizer, childes_to_wordnet_pos) for
            record in tokens.to_dict('records')]
        filtered_tokens = tokens.loc[tokens.root.isin(word_filter_list)]
    else:
        filtered_tokens = tokens
        
    #2. Add time information
    if interval is not None:
        if not interval in (1,2,3,4,6,12):
            raise ValueError('Interval must be one of: 1, 2, 3, 4, 6, or 12')                        
        else:
            print('Specified interval of '+str(interval)+' months....')
            filtered_tokens['time_interval'] = get_time_interval(filtered_tokens['target_child_age'], interval)
            agg_by.append('time_interval')
    else:
        print('No interval specified, not stratifying by time period...')
    
    #3. add the speaker information
    if stratify_by_speakers is not None:
        print('Stratifying by speaker_group....')
        filtered_tokens['speaker_group'] = get_speaker_group(
            filtered_tokens['speaker_code'], stratify_by_speakers)
        agg_by.append('speaker_group')
    else:
        print('No speaker stratification...')
    
    #4. get aggregate counts before downsampling
    print('Getting aggregate counts (`max_tokens_per_interval` will not be used)')
    # return the counts for each of the partitions
    #agg_by.append('root') # the contents of the aggregation depend on wheter stratifty_by_speakers
    # and interval were specified
    print('Aggregating by:')
    print(agg_by)
    agg_count = filtered_tokens.groupby(agg_by)['token_id'].aggregate(np.size).reset_index()
    agg_count['type'] = 'cdi filtered, no subsampling' 
        
    #5. do the downsampling
    # split into m * n partitions, where m is the number of speaker groups
    # and  n is the number of time intervals
    # if more than k tokens in partitions, sample k tokens            
    agg_by_with_root = copy.deepcopy(agg_by) 
    agg_by_with_root.append('root')
    gb = filtered_tokens.groupby(agg_by_with_root)    
    partitions  = [get_group(gb, x) for x in gb.groups]
    subsampled_records = pd.concat([downsample_if_necessary(df, max_tokens_per_interval) for df in partitions])
    subsampled_records = subsampled_records.sort_values(by='token_id')
    agg_count_subsampled = subsampled_records.groupby(agg_by)['token_id'].aggregate(np.size).reset_index()
    agg_count_subsampled['type'] = 'cdi filtered, with subsampling' 

    counts = pd.concat([agg_count, agg_count_subsampled])
    subsample_ids = subsampled_records['token_id'].tolist()
    return(counts, subsample_ids)

def get_group(g, key):
    try:
        return g.get_group(key)
    except:
        return pd.DataFrame()

def downsample_if_necessary(df, max_tokens_per_interval):
    if df.shape[0] <= max_tokens_per_interval: 
        # return whatever items we have -- not at threshold
        return(df)
    else:
        # return up to `max_tokens_per_interval` items
        return(df.iloc[np.random.choice(range(df.shape[0]), size=max_tokens_per_interval, replace=False)])




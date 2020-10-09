from nltk.corpus import wordnet as wn

import string
import os
from itertools import *
import codecs

TOTAL_UTTERANCES = 10
POS_MAP = {
    'v': wn.VERB,
    'n': wn.NOUN,
    'adj': wn.ADJ,
    'adv': wn.ADV
}

USER_TYPES = {
    "1": "mechanical_turk",
    "2": "in_lab_staff",
    "3": "subject_pool",
    "4": "berkeley_ra_pool",
    "5": "berkeley_rpp",
    "6": "princeton_rpp",
    "7": "edinburgh_two_hour_rpp",
    "8": "berkeley_two_hour_rpp",
}
#are we both storing as an environment var and creating it here?
USER_TYPE_TAGGING_THRESHOLD = {
    "mechanical_turk": int(os.environ.get("WORDSENSE_MECHANICAL_TURK_TAGS_THRESHOLD", 30)),
    "in_lab_staff": int(os.environ.get("WORDSENSE_IN_LAB_STAFF_TAGS_THRESHOLD", 0)), # Not used
    "subject_pool": int(os.environ.get("WORDSENSE_SUBJECT_POOL_TAGS_THRESHOLD", 24 * 9)), # 24 * 9 in production
    "berkeley_ra_pool": int(os.environ.get('WORDSENSE_RA_POOL_TAGS_THRESHOLD',1000000)),
    "berkeley_rpp": int(os.environ.get("WORDSENSE_RPP_TAGS_THRESHOLD", 24 * 4)), #96
    "princeton_rpp": int(os.environ.get("WORDSENSE_PRINCETON_TAGS_THRESHOLD", 24 * 8)) # 192
}

# os.environ['WORDSENSE_CYPHER_INVENTORY'] = "list(string.ascii_letters + string.digits)[::-1]"
# os.environ['WORDSENSE_CYPHER_OFFSET'] = "56"
# os.environ['WORDSENSE_CYPHER_KEY'] = "test"


# cypher_inventory = eval(os.environ['WORDSENSE_CYPHER_INVENTORY'])
# offset = int(os.environ['WORDSENSE_CYPHER_OFFSET'])
cypher_key = os.environ['WORDSENSE_CYPHER_KEY']


# def encode_user_identifier(user_identifier, char_inventory, offset):
#     return (''.join([
#         cypher_inventory[(cypher_inventory.index(x) + offset) %
#                          len(cypher_inventory)] for x in list(user_identifier)]))
#
#
# def decode_user_identifier(encoded_user_identifier, char_inventory, offset):
#     return (''.join([
#         cypher_inventory[(cypher_inventory.index(x) - offset) %
#                          len(cypher_inventory)] for x in list(encoded_user_identifier)]))


def xor_encrypt_string(plaintext, key):
    ciphertext = ''.join(chr(ord(x) ^ ord(y)) for (x,y) in zip(plaintext, cycle(key)))
    return codecs.encode(ciphertext.encode(), 'hex').decode('ascii')


def xor_decrypt_string(cyphertext, key):
    cyphertext = codecs.decode(cyphertext.encode(), 'hex')
    return ''.join(chr(ord(x) ^ ord(y)) for (x,y) in zip(cyphertext.decode(), cycle(key)))


# original_uid = "smeylan"
# print('Original uid: ' + original_uid)
#
# encoded_uid = xor_encrypt_string(original_uid, cypher_key)
# print('Encoded uid: ' + encoded_uid)
#
# decoded_uid = xor_decrypt_string(encoded_uid, cypher_key)
# print('Decoded uid: ' + decoded_uid)


def id_generator(worker_id):
    return xor_encrypt_string(worker_id, cypher_key)

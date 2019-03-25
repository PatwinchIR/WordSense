import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
    constructor(props) {
    super(props);

    this.state = {
        collections: [],
        corpora: [],
        transcripts: [],
        utterances: [],
        selected_collection: '',
        selected_corpus: '',
        selected_transcript: ''
    };

    this.handleCollectionChange = this.handleCollectionChange.bind(this);
    this.loadCorporaForSelectedCollection = this.loadCorporaForSelectedCollection.bind(this);

    this.handleCorpusChange = this.handleCorpusChange.bind(this);
    this.loadTranscriptsForSelectedCorpus = this.loadTranscriptsForSelectedCorpus.bind(this);

    this.handleTranscriptChange = this.handleTranscriptChange.bind(this);
    this.loadUtterancesForSelectedTranscript = this.loadUtterancesForSelectedTranscript.bind(this);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async componentDidMount() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/get_collection/');
      const collections = await res.json();
      this.setState({
        collections: collections,
      });
    } catch (e) {
      console.log(e);
    }
  }

  async loadCorporaForSelectedCollection(collection_id) {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/get_corpora?collection_id=${collection_id}`);
        const corpora = await res.json();
        this.setState({
            corpora: corpora
        });
    } catch (e) {
        console.log(e);
    }
  }

  async loadTranscriptsForSelectedCorpus(corpus_id) {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/get_transcripts?corpus_id=${corpus_id}`);
        const transcripts = await res.json();
        this.setState({
            transcripts: transcripts
        });
    } catch (e) {
        console.log(e);
    }
  }

  async loadUtterancesForSelectedTranscript(transcript_id) {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/get_utterances?transcript_id=${transcript_id}`);
        const utterances = await res.json();
        this.setState({
            utterances: utterances
        });
    } catch (e) {
        console.log(e);
    }
  }

  handleCollectionChange(event) {
      const collection_id = event.target.value;
      this.loadCorporaForSelectedCollection(collection_id);
      this.setState({selected_collection: collection_id});
  }

  handleCorpusChange(event) {
      const corpus_id = event.target.value;
      this.loadTranscriptsForSelectedCorpus(corpus_id);
      this.setState({selected_corpus: corpus_id});
  }

  handleTranscriptChange(event) {
      const transcript_id = event.target.value;
      this.loadUtterancesForSelectedTranscript(transcript_id);
      this.setState({selected_transcript: transcript_id});
  }

  handleSubmit(event) {
    alert('Your favorite flavor is: ' + this.state.sc);
  }

  render() {
    return (
        <div>

        <form onSubmit={this.handleSubmit}>
        <label>

          Pick your collection:
          <select value={this.state.selected_collection} onChange={this.handleCollectionChange}>
              {this.state.collections.map(item => (
            <option value={item.id}>
            {item.id}: {item.name}
            </option>
        ))}
          </select>
        </label>
            <br />

            <label>

          Pick your corpus:
          <select value={this.state.selected_corpus} onChange={this.handleCorpusChange}>
              {this.state.corpora.map(item => (
            <option value={item.id}>
            {item.id}: {item.name}
            </option>
        ))}
          </select>
        </label>
            <br />

            <label>

          Pick your transcript:
          <select value={this.state.selected_transcripts} onChange={this.handleTranscriptChange}>
              {this.state.transcripts.map(item => (
            <option value={item.id}>
            {item.id}: {item.filename}
            </option>
        ))}
          </select>
        </label>
        <input type="submit" value="Submit" />
      </form>
            <br />
        <div>
            {this.state.utterances.map(
                item => ([<span>
                    {item.speaker_role}:
                        {item.gloss_pos.map(
                            word_pos => (<span> {word_pos.word}</span>)
                        )}
                    </span>, <br />]
                )
            )}
        </div>
      </div>
    );
  }
}

export default App;

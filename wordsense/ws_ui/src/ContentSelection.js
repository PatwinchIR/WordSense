import React, { Component } from "react";
import Select from "react-select";

class ContentSelection extends Component {
    constructor(props) {
        super(props);

        this.state = {
            collections: [],
            corpora: [],
            transcripts: [],
            selectedCollectionID: "",
          selectedCorpusID: "",
            selectedTranscriptID: "",
        };

        this.handleCollectionChange = this.handleCollectionChange.bind(this);
        this.loadCorporaForSelectedCollection = this.loadCorporaForSelectedCollection.bind(this);

        this.handleCorpusChange = this.handleCorpusChange.bind(this);
        this.loadTranscriptsForSelectedCorpus = this.loadTranscriptsForSelectedCorpus.bind(this);
    }

    async componentDidMount() {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/get_collection/");
      const collections = await res.json();
      this.setState({
        collections: collections
      });
    } catch (e) {
      console.log(e);
    }
  }

  async loadCorporaForSelectedCollection(collectionID) {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/get_corpora?collection_id=${collectionID}`
      );
      const corpora = await res.json();
      this.setState({
        corpora: corpora
      });
    } catch (e) {
      console.log(e);
    }
  }

  async loadTranscriptsForSelectedCorpus(corpusID) {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/get_transcripts?corpus_id=${corpusID}`
      );
      const transcripts = await res.json();
      this.setState({
        transcripts: transcripts
      });
    } catch (e) {
      console.log(e);
    }
  }

  handleCollectionChange(selectedCollectionID) {
    this.loadCorporaForSelectedCollection(selectedCollectionID.value);
    this.setState({ selectedCollectionID: selectedCollectionID });
  }

  handleCorpusChange(selectedCorpusID) {
    console.log(selectedCorpusID);
    this.loadTranscriptsForSelectedCorpus(selectedCorpusID.value);
    this.setState({ selectedCorpusID: selectedCorpusID });
  }

  render () {
    return <form id='content-selection' onSubmit={this.handleSubmit}>
      <label>
        Pick your collection:
        <Select
          value={this.state.selectedCollectionID}
          onChange={this.handleCollectionChange}
          placeholder="Select Collection..."
          isSearchable={true}
          options={this.state.collections.map(item => {
            return { value: item.id, label: item.name };
          })}
        />
      </label>
      <br />

      <label>
        Pick your corpus:
        <Select
          value={this.state.selectedCorpusID}
          onChange={this.handleCorpusChange}
          placeholder="Select Corpus..."
          options={this.state.corpora.map(item => {
            return { value: item.id, label: item.name };
          })}
        />
      </label>
      <br />

      <label>
        Pick your transcript:
        <Select
          value={this.props.selectedTranscriptID}
          onChange={this.props.handleTranscriptChange}
          placeholder="Select Transcript..."
          options={this.state.transcripts.map(item => {
            return { value: item.id, label: item.filename };
          })}
        />
      </label>
    </form>
  }
}

export default ContentSelection;

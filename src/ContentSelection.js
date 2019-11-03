import React, { Component } from "react";
import { Icon, NumericInput, Button } from "@blueprintjs/core";
import Select from "react-select";
import { BASE_URL } from "./Constants";
import cookie from "react-cookie";

class ContentSelection extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collections: [],
      corpora: [],
      transcripts: [],
      selectedCollectionID: "",
      selectedCorpusID: "",
      selectedTranscriptID: ""
    };

    this.loadCollection = this.loadCollection.bind(this);
    this.handleCollectionChange = this.handleCollectionChange.bind(this);
    this.loadCorporaForSelectedCollection = this.loadCorporaForSelectedCollection.bind(
      this
    );

    this.handleCorpusChange = this.handleCorpusChange.bind(this);
    this.loadTranscriptsForSelectedCorpus = this.loadTranscriptsForSelectedCorpus.bind(
      this
    );
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async loadCollection() {
    try {
      const res = await fetch(`${BASE_URL}/api/get_collection/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("word_sense_token")}`,
          "X-CSRFToken": cookie.load("csrftoken")
        }
      });
      const collections = await res.json();
      this.setState({
        collections: collections
      });
    } catch (e) {
      console.log(e);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isLoggedIn !== nextProps.isLoggedIn) {
      if (nextProps.isLoggedIn) {
        this.loadCollection();
      } else {
        this.setState({
          collections: [],
          corpora: [],
          transcripts: [],
          selectedCollectionID: "",
          selectedCorpusID: "",
          selectedTranscriptID: ""
        });
      }
    } else if (this.props.isLoggedIn) {
      this.loadCollection();
    }
  }

  async loadCorporaForSelectedCollection(collectionID) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/get_corpora/?collection_id=${collectionID}`,
        {
          headers: {
            Authorization: `JWT ${localStorage.getItem("word_sense_token")}`,
            "X-CSRFToken": cookie.load("csrftoken")
          }
        }
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
        `${BASE_URL}/api/get_transcripts/?corpus_id=${corpusID}`,
        {
          headers: {
            Authorization: `JWT ${localStorage.getItem("word_sense_token")}`,
            "X-CSRFToken": cookie.load("csrftoken")
          }
        }
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
    this.setState({
      selectedCollectionID: selectedCollectionID,
      selectedCorpusID: "",
      selectedTranscriptID: ""
    });
  }

  handleCorpusChange(selectedCorpusID) {
    console.log(selectedCorpusID);
    this.loadTranscriptsForSelectedCorpus(selectedCorpusID.value);
    this.setState({
      selectedCorpusID: selectedCorpusID,
      selectedTranscriptID: ""
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.handleTranscriptIdInput(event.target[0], event.target[1].value);
  }

  render() {
    return (
      <form
        id="content-selection"
        onSubmit={this.props.handleTranscriptIdInput}
      >
        <div id="selections">
          <label>
            <Select
              value={this.state.selectedCollectionID}
              onChange={this.handleCollectionChange}
              placeholder="Select Collection"
              isSearchable={true}
              options={this.state.collections.map(item => {
                return { value: item.id, label: item.name };
              })}
            />
          </label>
          <Icon intent="primary" icon="arrow-right" iconSize={20} />
          <label>
            <Select
              value={this.state.selectedCorpusID}
              onChange={this.handleCorpusChange}
              placeholder="Select Corpus..."
              options={this.state.corpora.map(item => {
                return { value: item.id, label: item.name };
              })}
            />
          </label>
          <Icon intent="primary" icon="arrow-right" iconSize={20} />
          <label>
            <Select
              value={this.props.selectedTranscriptID}
              onChange={this.props.handleTranscriptChange}
              placeholder="Select Transcript"
              options={this.state.transcripts.map(item => {
                return {
                  value: item.id,
                  label: `${item.id}: ${item.filename}`
                };
              })}
            />
          </label>
        </div>
        <div id="separator">or</div>
        <div id="inputs">
          <NumericInput
            name="inputTranscriptId"
            buttonPosition="none"
            placeholder="Enter Transcript ID"
            value={this.props.inputTranscriptId}
          />
          <NumericInput
            name="inputUtteranceIndex"
            buttonPosition="none"
            placeholder="Enter Utterance Index"
            value={this.props.inputUtteranceIndex}
            min={0}
          />
          <Button type="submit">GO</Button>
        </div>
      </form>
    );
  }
}

export default ContentSelection;

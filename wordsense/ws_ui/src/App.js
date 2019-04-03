import React, { Component } from "react";
import Select from "react-select";
import { Formik } from "formik";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collections: [],
      corpora: [],
      transcripts: [],
      utterances: [],
      senses: [],
      selectedCollectionID: "",
      selectedCorpusID: "",
      selectedTranscriptID: ""
    };

    this.handleCollectionChange = this.handleCollectionChange.bind(this);
    this.loadCorporaForSelectedCollection = this.loadCorporaForSelectedCollection.bind(
      this
    );

    this.handleCorpusChange = this.handleCorpusChange.bind(this);
    this.loadTranscriptsForSelectedCorpus = this.loadTranscriptsForSelectedCorpus.bind(
      this
    );

    this.handleTranscriptChange = this.handleTranscriptChange.bind(this);
    this.loadUtterancesForSelectedTranscript = this.loadUtterancesForSelectedTranscript.bind(
      this
    );
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

  renderUtterances(rawUtterances) {
    const utterances = rawUtterances.reduce(
        (utterances, item) => {
          if (!utterances[item.utterance_id]) {
              utterances[item.utterance_id] = {
                  'speaker_role': item.speaker_role,
                  'gloss_pos': []
              }
          }
          utterances[item.utterance_id].gloss_pos.push({'gloss': item.gloss, 'pos': item.part_of_speech});
          return utterances;
        }, {}
    );
    const results = [];
    Object.keys(utterances)
        .sort((a, b) => (a - b))
        .forEach((v, i) => {
          results.push(utterances[v]);
    });
    return results;
  }

  async loadUtterancesForSelectedTranscript(transcriptID) {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/get_utterances?transcript_id=${transcriptID}`
      );
      const utterances = await res.json();
      this.setState({
        utterances: this.renderUtterances(utterances)
      });
    } catch (e) {
      console.log(e);
    }
  }

  async loadSensesExamplesForWord(word, pos) {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/get_senses?word=${word}&pos=${pos}`
      );
      const senses = await res.json();
      this.setState({
        senses: senses
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

  handleTranscriptChange(selectedTranscriptID) {
    this.loadUtterancesForSelectedTranscript(selectedTranscriptID.value);
    this.setState({ selectedTranscriptID: selectedTranscriptID });
  }

  handleWordClick(word_pos) {
    this.loadSensesExamplesForWord(word_pos.word, word_pos.pos);
  }

  render() {
    const isSenses = this.state.senses && this.state.senses.length > 0;

    return [
      <div>{isSenses && <HiddenBox senses={this.state.senses} />}</div>,
      <div>
        <form onSubmit={this.handleSubmit}>
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
              value={this.state.selectedTranscriptID}
              onChange={this.handleTranscriptChange}
              placeholder="Select Transcript..."
              options={this.state.transcripts.map(item => {
                return { value: item.id, label: item.filename };
              })}
            />
          </label>
        </form>
        <br />
        <div>
          {this.state.utterances.map(
                item => (
                    [
                        <span> {item.speaker_role}:

                            {item.gloss_pos.map(
                                word_pos => {
                                    return word_pos.pos === 'n' ||
                                        word_pos.pos === 'v' ||
                                        word_pos.pos === 'adv' ||
                                        word_pos.pos === 'adj' ?
                                        (
                                            <span onClick={() => this.handleWordClick(word_pos)} style={{cursor:'pointer', color:'red'}}>{word_pos.gloss} </span>
                                        ) :
                                        (
                                            <span>{word_pos.gloss} </span>
                                        )
                                }
                                )}
                        </span>, <br/>
                    ]
                )
            )
        }
        </div>
      </div>
    ];
  }
}

class HiddenBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedSenses: []
    };

    this.handleSensesChange = this.handleSensesChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  handleSensesChange(event) {
    const selectedSenses = this.state.selectedSenses;
    let index;
    if (event.target.checked) {
      this.state.selectedSenses.push(+event.target.value);
    } else {
      index = selectedSenses.indexOf(+event.target.value);
      selectedSenses.splice(index, 1);
    }

    this.setState({ selectedSenses: selectedSenses });
  }

  handleFormSubmit(event) {
    event.preventDefault();
    fetch("http://127.0.0.1:8000/api/save", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.state.selectedSenses)
    });
    console.log(
      "Your favorite flavor is: " + JSON.stringify(this.state.selectedSenses)
    );
  }

  render() {
    return (
      <div className="senses">
        <form onSubmit={this.handleFormSubmit}>
          {this.props.senses.map(sense_example => [
            <label>
              <input
                style={{ color: "blue" }}
                type="checkbox"
                value={sense_example.offset}
                onChange={this.handleSensesChange}
              />
              {sense_example.sense}
            </label>,
            <br />,
            <div>
              {sense_example.examples.map(example => [
                <span style={{ backgroundColor: "yellow" }}>{example}</span>,
                <br />
              ])}
            </div>
          ])}
          <input type="submit" />
        </form>
      </div>
    );
  }
}

export default App;

import React, { Component } from "react";
import "./App.css";
import ContentSelection from "./ContentSelection";
import UtteranceDisplay from "./UtteranceDisplay";
import SenseDisplay from "./SenseDisplay";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTranscriptID: "",
        idGlossPos: ""
    };

    this.handleTranscriptChange = this.handleTranscriptChange.bind(this);
    this.handleGlossClick = this.handleGlossClick.bind(this);
  }

  handleTranscriptChange(selectedTranscriptID) {
    this.setState({ selectedTranscriptID: selectedTranscriptID });
  }


  handleGlossClick(idGlossPos) {
    this.setState({
        idGlossPos: idGlossPos
    });
  }

  render() {
    return [
      <div>
          <SenseDisplay idGlossPos={this.state.idGlossPos} />
      </div>,
      <div>
        <ContentSelection handleTranscriptChange={this.handleTranscriptChange} selectedTranscriptID={this.state.selectedTranscriptID}/>
        <br />
        <UtteranceDisplay selectedTranscriptID={this.state.selectedTranscriptID.value} handleGlossClick={this.handleGlossClick}/>
      </div>
    ];
  }
}

export default App;

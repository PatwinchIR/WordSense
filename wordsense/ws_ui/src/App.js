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
        idGlossPos: "",
        newCurrentIndex: 0
    };

    this.handleTranscriptChange = this.handleTranscriptChange.bind(this);
    this.handleGlossClick = this.handleGlossClick.bind(this);
  }

  handleTranscriptChange(selectedTranscriptID) {
    this.setState({ selectedTranscriptID: selectedTranscriptID });
  }


  handleGlossClick(idGlossPos, newCurrentIndex) {
    this.setState({
        idGlossPos: idGlossPos,
        newCurrentIndex: newCurrentIndex
    });
  }

  render() {
    return [
        <div id='upper-container'>
        <ContentSelection handleTranscriptChange={this.handleTranscriptChange}
                          selectedTranscriptID={this.state.selectedTranscriptID}/>
        <UtteranceDisplay selectedTranscriptID={this.state.selectedTranscriptID.value}
                          handleGlossClick={this.handleGlossClick}
                          newCurrentIndex={this.state.newCurrentIndex}/>
      </div>,
        <div id='lower-container'>

        <SenseDisplay idGlossPos={this.state.idGlossPos} />
          </div>

    ];
  }
}

export default App;

import React, { Component } from "react";
import "./App.css";
import ContentSelection from "./ContentSelection";
import UtteranceDisplay from "./UtteranceDisplay";
import SenseDisplay from "./SenseDisplay";
import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTranscriptID: "",
      idGlossPos: "",
      activeWord: -1,
      utteranceIndexForTagStatusChange: -1,
      utteranceIndex: -1,
      tokenIndex: -1
    };

    this.handleTranscriptChange = this.handleTranscriptChange.bind(this);
    this.handleGlossClick = this.handleGlossClick.bind(this);
    this.changeTagStatus = this.changeTagStatus.bind(this);
  }

  handleTranscriptChange(selectedTranscriptID) {
    this.setState({ selectedTranscriptID: selectedTranscriptID });
  }

  handleGlossClick(idGlossPos, utteranceIndex, tokenIndex) {
    this.setState({
      activeWord: idGlossPos.token_id,
      idGlossPos: idGlossPos,
      utteranceIndex: utteranceIndex,
      tokenIndex: tokenIndex
    });
  }

  changeTagStatus(utteranceIndexForTagStatusChange) {
    this.setState({
      utteranceIndexForTagStatusChange: utteranceIndexForTagStatusChange
    });
  }

  render() {
    return [
      <div id="upper-container">
        <ContentSelection
          handleTranscriptChange={this.handleTranscriptChange}
          selectedTranscriptID={this.state.selectedTranscriptID}
        />
        <UtteranceDisplay
          selectedTranscriptID={this.state.selectedTranscriptID.value}
          handleGlossClick={this.handleGlossClick}
          activeWord={this.state.activeWord}
          utteranceIndexForTagStatusChange={
            this.state.utteranceIndexForTagStatusChange
          }
          tokenIndex={this.state.tokenIndex}
        />
      </div>,
      <div id="lower-container">
        <SenseDisplay
          idGlossPos={this.state.idGlossPos}
          changeTagStatus={this.changeTagStatus}
          utteranceIndex={this.state.utteranceIndex}
        />
      </div>
    ];
  }
}

export default App;

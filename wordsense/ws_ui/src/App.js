import React, { Component } from "react";
import "./App.css";
import ContentSelection from "./ContentSelection";
import UtteranceDisplay from "./UtteranceDisplay";
import SenseDisplay from "./SenseDisplay";
import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import { H1 } from "@blueprintjs/core";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTranscriptID: "-1",
      prevSelectedTranscriptID: "-1",
      inputUtteranceIndex: "",
      prevInputUtteranceIndex: "",
      idGlossPos: "",
      activeWord: -1,
      utteranceIndexForTagStatusChange: -1,
      utteranceIndex: -1,
      tokenIndex: -1
    };

    this.handleTranscriptChange = this.handleTranscriptChange.bind(this);
    this.handleTranscriptIdInput = this.handleTranscriptIdInput.bind(this);
    this.handleGlossClick = this.handleGlossClick.bind(this);
    this.changeTagStatus = this.changeTagStatus.bind(this);
  }

  handleTranscriptChange(selectedTranscriptID) {
    this.setState({
      prevSelectedTranscriptID: this.state.selectedTranscriptID
    });
    this.setState({ selectedTranscriptID: selectedTranscriptID });
  }

  handleTranscriptIdInput(event) {
    event.preventDefault();
    const inputTranscriptId = event.target.inputTranscriptId;
    const inputUtteranceIndex = event.target.inputUtteranceIndex.value;
    if (inputUtteranceIndex !== "" && inputTranscriptId.value !== "") {
      if (
        inputUtteranceIndex !== this.state.prevInputUtteranceIndex &&
        inputTranscriptId.value !== this.state.prevSelectedTranscriptID.value
      ) {
        this.setState({
          prevSelectedTranscriptID: this.state.selectedTranscriptID,
          prevInputUtteranceIndex: this.state.inputUtteranceIndex
        });
        this.setState({
          selectedTranscriptID: inputTranscriptId,
          inputUtteranceIndex: inputUtteranceIndex
        });
      } else if (
        inputUtteranceIndex !== this.state.prevInputUtteranceIndex &&
        inputTranscriptId.value === this.state.prevSelectedTranscriptID.value
      ) {
        this.setState({
          prevInputUtteranceIndex: this.state.inputUtteranceIndex
        });
        this.setState({
          inputUtteranceIndex: inputUtteranceIndex
        });
      } else if (
        inputUtteranceIndex === this.state.prevInputUtteranceIndex &&
        inputTranscriptId.value !== this.state.prevSelectedTranscriptID.value
      ) {
        this.setState({
          prevSelectedTranscriptID: this.state.selectedTranscriptID
        });
        this.setState({
          selectedTranscriptID: inputTranscriptId
        });
      }
    } else if (inputUtteranceIndex !== "" && inputTranscriptId.value === "") {
      if (inputUtteranceIndex !== this.state.prevInputUtteranceIndex) {
        this.setState({
          prevInputUtteranceIndex: this.state.inputUtteranceIndex
        });
        this.setState({
          inputUtteranceIndex: inputUtteranceIndex
        });
      }
    } else if (inputUtteranceIndex === "" && inputTranscriptId.value !== "") {
      if (
        inputTranscriptId.value !== this.state.prevSelectedTranscriptID.value
      ) {
        this.setState({
          prevSelectedTranscriptID: this.state.selectedTranscriptID,
          prevInputUtteranceIndex: this.state.inputUtteranceIndex
        });
        this.setState({
          selectedTranscriptID: inputTranscriptId,
          inputUtteranceIndex: 0
        });
      }
    }
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
      <div id="banner">
        <H1>WordSense</H1>
      </div>,
      <div id="upper-container">
        <ContentSelection
          handleTranscriptChange={this.handleTranscriptChange}
          handleTranscriptIdInput={this.handleTranscriptIdInput}
          selectedTranscriptID={this.state.selectedTranscriptID}
          inputTranscriptId={
            this.state.selectedTranscriptID !== ""
              ? this.state.selectedTranscriptID.value
              : ""
          }
          inputUtteranceIndex={this.state.inputUtteranceIndex}
        />
        <UtteranceDisplay
          selectedTranscriptID={this.state.selectedTranscriptID.value}
          inputUtteranceIndex={this.state.inputUtteranceIndex}
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
          transcriptId={this.state.selectedTranscriptID.value}
        />
      </div>
    ];
  }
}

export default App;

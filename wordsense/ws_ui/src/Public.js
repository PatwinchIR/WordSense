import React, { Component } from "react";
import "./App.css";
import UtteranceDisplay from "./UtteranceDisplay";
import { Link } from "react-router-dom";
import SenseDisplay from "./SenseDisplay";

class Public extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeWord: -1,
      idGlossPos: "",
      utteranceIndexForTagStatusChange: -1,
      utteranceIndex: -1,
      tokenIndex: -1
    };

    this.handleGlossClick = this.handleGlossClick.bind(this);
    this.changeTagStatus = this.changeTagStatus.bind(this);
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
      <div>Public</div>,
      <Link to="/">Home</Link>,
      <div id="upper-container">
        <UtteranceDisplay
          isPublic={true}
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
          isPublic={true}
          idGlossPos={this.state.idGlossPos}
          changeTagStatus={this.changeTagStatus}
          utteranceIndex={this.state.utteranceIndex}
        />
      </div>
    ];
  }
}

export default Public;

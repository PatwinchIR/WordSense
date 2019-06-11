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
      tokenIndexForTagStatusChange: -1,
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

  changeTagStatus(
    utteranceIndexForTagStatusChange,
    tokenIndexForTagStatusChange
  ) {
    this.setState({
      utteranceIndexForTagStatusChange: utteranceIndexForTagStatusChange,
      tokenIndexForTagStatusChange: tokenIndexForTagStatusChange
    });
  }

  render() {
    return [
      <div id="banner">
        <span>
          <b>WordSense</b>
        </span>
        <Link to="/">Home</Link>
      </div>,
      <div id="container">
        <div id="upper-container">
          <UtteranceDisplay
            isPublic={true}
            handleGlossClick={this.handleGlossClick}
            activeWord={this.state.activeWord}
            utteranceIndexForTagStatusChange={
              this.state.utteranceIndexForTagStatusChange
            }
            tokenIndexForTagStatusChange={
              this.state.tokenIndexForTagStatusChange
            }
          />
        </div>
        <div id="lower-container">
          <SenseDisplay
            isPublic={true}
            idGlossPos={this.state.idGlossPos}
            changeTagStatus={this.changeTagStatus}
            utteranceIndex={this.state.utteranceIndex}
            tokenIndex={this.state.tokenIndex}
          />
        </div>
      </div>
    ];
  }
}

export default Public;

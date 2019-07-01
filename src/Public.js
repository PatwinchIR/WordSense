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
      tokenIndex: -1,
      workerId: this.getParameterByName("workerId"),
      workUnitId: -1,
      participantId: "undefined"
    };

    this.handleGlossClick = this.handleGlossClick.bind(this);
    this.changeTagStatus = this.changeTagStatus.bind(this);
    this.setWorkerId = this.setWorkerId.bind(this);
    this.getParameterByName = this.getParameterByName.bind(this);
  }

  handleGlossClick(idGlossPos, utteranceIndex, tokenIndex, workUnitId, participantId) {
    this.setState({
      activeWord: idGlossPos.token_id,
      idGlossPos: idGlossPos,
      utteranceIndex: utteranceIndex,
      tokenIndex: tokenIndex,
      workUnitId: workUnitId,
      participantId: participantId
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

  componentDidMount() {
    this.setWorkerId();
  }

  getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  setWorkerId() {
    this.setState({workerId: this.getParameterByName("workerId")});
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
            workerId={this.state.workerId}
          />
        </div>
        <div id="lower-container">
          <SenseDisplay
            isPublic={true}
            idGlossPos={this.state.idGlossPos}
            changeTagStatus={this.changeTagStatus}
            utteranceIndex={this.state.utteranceIndex}
            tokenIndex={this.state.tokenIndex}
            workerId={this.state.workerId}
            workUnitId={this.state.workUnitId}
            participantId={this.state.participantId}
          />
        </div>
      </div>
    ];
  }
}

export default Public;

import React, { Component } from "react";
import "./App.css";
import UtteranceDisplay from "./UtteranceDisplay";
import { Link } from "react-router-dom";
import SenseDisplay from "./SenseDisplay";
import {
  Intent,
  Toaster,
  Checkbox,
  Text,
  Button,
  HTMLTable,
  Overlay,
  Alert
} from "@blueprintjs/core";
import {BASE_URL, PUBLIC_URL} from "./Constants";
import cookie from "react-cookie";

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
      participantId: "undefined",
      finishToken: undefined,
      alertIsOpen: false
    };

    this.handleGlossClick = this.handleGlossClick.bind(this);
    this.changeTagStatus = this.changeTagStatus.bind(this);
    this.setWorkerId = this.setWorkerId.bind(this);
    this.getParameterByName = this.getParameterByName.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.handleAlertConfirm = this.handleAlertConfirm.bind(this);
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

  async handleFinish() {
    if (this.state.finishToken !== undefined) {
      this.setState({alertIsOpen: true});
      return;
    }
    try {
      await fetch(
        `${BASE_URL}/api/${PUBLIC_URL
        }get_finish_token/?workerId=${
          this.state.workerId
        }&workUnitId=${
          this.state.workUnitId
        }&participantId=${
          this.state.participantId
        }`,
        {
          headers: {
            Authorization: "",
            "X-CSRFToken": cookie.load("csrftoken")
          }
        }
      )
        .then(res => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error(
              res.statusText
            );
          }
        })
        .then(finishToken => {
          this.setState({
              finishToken: finishToken,
              alertIsOpen: true
          });
        })
        .catch(error => {
          const toaster = Toaster.create(this.props);
          toaster.show({
            intent: Intent.DANGER,
            message: (
              <>
                <em>Oops! </em> {error.toString()}
              </>
            )
          });
        })
    } catch (e) {
      console.log(e);
    }
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

  handleAlertConfirm() {
    this.setState({ alertIsOpen: false });
  }

  render() {
    return [
      <div id="banner">
        <span>
          <b>WordSense</b>
        </span>
        <Button
            intent={"success"}
          text={"FINISHED ? "}
          onClick={this.handleFinish}
        />
        <Link to="/">Home</Link>
      </div>,
      <Alert
        icon="endorsed"
        intent={Intent.SUCCESS}
        confirmButtonText="Okay"
        isOpen={this.state.alertIsOpen}
        onConfirm={this.handleAlertConfirm}
      >
        <p>
            Your token is : {this.state.finishToken}
        </p>
      </Alert>,
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

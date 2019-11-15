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
      alertIsOpen: false,
      userType: this.getParameterByName("userType"),
      continueOnNextUnit: true,
      numTagsProvided: -1,
      totalTagsNeeded: -1,
      numTagsProvidedNext: -1
    };

    this.handleGlossClick = this.handleGlossClick.bind(this);
    this.changeTagStatus = this.changeTagStatus.bind(this);
    this.setWorkerId = this.setWorkerId.bind(this);
    this.getParameterByName = this.getParameterByName.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.handleAlertConfirm = this.handleAlertConfirm.bind(this);
    this.setUserType = this.setUserType.bind(this);
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
    try {
      await fetch(
        `${BASE_URL}/api/${PUBLIC_URL
        }get_finish_token/?workerId=${
          this.state.workerId
        }&workUnitId=${
          this.state.workUnitId
        }&userType=${
          this.state.userType
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
            return res.json()
          } else if (res.status === 400) {
            throw new Error(
              "Not Valid !"
            )
          } else {
            throw new Error(
              "You haven't reached the finish threshold. (> 90%)"
            )
          }
        })
        .then(finishData => {
          this.setState({
              finishToken: finishData.finishToken,
              alertIsOpen: true,
              continueOnNextUnit: finishData.finishToken === "continue",
              numTagsProvided: finishData.numTagsProvided,
              totalTagsNeeded: finishData.totalTagsNeeded
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
    this.setUserType();
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
    this.setState({
      workerId: this.getParameterByName("workerId")
    });
  }

  setUserType() {
    this.setState({userType: this.getParameterByName("userType")});
  }

  handleAlertConfirm() {
    this.setState({
      alertIsOpen: false,
      numTagsProvidedNext: this.state.numTagsProvided
    });
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
        confirmButtonText={this.state.continueOnNextUnit ? "Next Transcript" : "Okay"}
        isOpen={this.state.alertIsOpen}
        onConfirm={this.handleAlertConfirm}
      >
        {!this.state.continueOnNextUnit ?
        <p>
            Your token is : {this.state.finishToken}
        </p>
          :
        <p>
            Good job! Let's work on the next one!
        </p>}
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
            userType={this.state.userType}
            numTagsProvidedNext={this.state.numTagsProvidedNext}
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
            userType={this.state.userType}
          />
        </div>
      </div>
    ];
  }
}

export default Public;

import React, { Component } from "react";
import "./App.css";
import ContentSelection from "./ContentSelection";
import UtteranceDisplay from "./UtteranceDisplay";
import SenseDisplay from "./SenseDisplay";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import {
  Overlay,
  Tabs,
  Tab,
  Classes,
  Toaster,
  Intent
} from "@blueprintjs/core";
import classNames from "classnames";
import Fingerprint2 from "fingerprintjs2";
import { BASE_URL } from "./Constants";
import cookie from "react-cookie";

const OVERLAY_CLASS = "docs-overlay-example-transition";

class Staff extends Component {
  initialState = {
    isLoggedIn: !!localStorage.getItem("word_sense_token"),
    username: "",
    participantId: null,
    tabId: "login",

    selectedTranscriptID: "-1",
    prevSelectedTranscriptID: "-1",
    inputUtteranceIndex: "",
    prevInputUtteranceIndex: "",
    idGlossPos: "",
    activeWord: -1,
    utteranceIndexForTagStatusChange: -1,
    tokenIndexForTagStatusChange: -1,
    utteranceIndex: -1,
    tokenIndex: -1,
    fingerprint: {},
    workUnitId: -1
  };

  constructor(props) {
    super(props);

    this.state = this.initialState;

    const thisapp = this;
    Fingerprint2.get({}, function(components) {
      thisapp.setState({
        fingerprint: components
          .filter(component => {
            return (
              component.key === "userAgent" ||
              component.key === "language" ||
              component.key === "platform"
            );
          })
          .reduce((accum, item) => {
            accum[item.key] = item.value;
            return accum;
          }, {})
      });
    });

    this.handleTranscriptChange = this.handleTranscriptChange.bind(this);
    this.handleTranscriptIdInput = this.handleTranscriptIdInput.bind(this);
    this.handleGlossClick = this.handleGlossClick.bind(this);
    this.changeTagStatus = this.changeTagStatus.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleSignup = this.handleSignup.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  componentDidMount() {
    if (this.state.isLoggedIn) {
      fetch(`${BASE_URL}/api/current_user/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem("word_sense_token")}`,
          "X-CSRFToken": cookie.load("csrftoken")
        }
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          } else if (res.status === 401) {
            const toaster = Toaster.create(this.props);
            toaster.show({
              intent: Intent.DANGER,
              message: (
                <>
                  <em>Oops! </em> Session Expired!
                </>
              )
            });
            this.setState({
              isLoggedIn: false,
              username: "",
              participantId: null
            });
          } else {
            throw new Error("Unknown Error");
          }
        })
        .then(json => {
          this.setState({
            isLoggedIn: true,
            username: json.username,
            participantId: json.participant_id
          });
        })
        .catch(error => {
          this.setState({
            isLoggedIn: false,
            username: "",
            participantId: null
          });
          console.log(error.toString());
        });
    }
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

  handleGlossClick(idGlossPos, utteranceIndex, tokenIndex, workUnitId, participantId) {
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

  handleLogin(e, data) {
    e.preventDefault();
    fetch(`${BASE_URL}/token-auth/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": cookie.load("csrftoken")
      },
      body: JSON.stringify(data)
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Wrong username/password!");
        }
      })
      .then(json => {
        localStorage.setItem("word_sense_token", json.token);
        this.setState({
          isLoggedIn: true,
          username: json.user.username,
          participantId: json.user.participant_id
        });
      })
      .catch(error => {
        const toaster = Toaster.create(this.props);
        toaster.show({
          intent: Intent.DANGER,
          message: (
            <>
              <em>{error.toString()} </em>
            </>
          )
        });
      });
  }

  handleSignup(e, data) {
    e.preventDefault();
    fetch(`${BASE_URL}/api/signup/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": cookie.load("csrftoken")
      },
      body: JSON.stringify({
        userdata: data,
        fingerprint: this.state.fingerprint
      })
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error(res.json());
        }
      })
      .then(json => {
        localStorage.setItem("word_sense_token", json.token);
        this.setState({
          isLoggedIn: true,
          username: json.username,
          participantId: json.participant_id
        });
      })
      .catch(error => {
        const toaster = Toaster.create(this.props);
        toaster.show({
          intent: Intent.DANGER,
          message: (
            <>
              <em> {error.detail} </em>
            </>
          )
        });
      });
  }

  handleLogout() {
    localStorage.removeItem("word_sense_token");
    this.setState({ isLoggedIn: false, username: "", participantId: null });
  }

  handleTabChange = tabId => {
    this.setState({ tabId: tabId });
  };

  render() {
    const classes = classNames(
      Classes.CARD,
      Classes.ELEVATION_4,
      OVERLAY_CLASS,
      "auth-portal-card"
    );

    return [
      <div id="banner">
        <span>
          <b>WordSense</b>
        </span>
        <div class="user-profile">
          <span>Welcome, {this.state.username}</span>
          <a onClick={this.handleLogout}>Log Out</a>
        </div>
      </div>,
      <Overlay
        isOpen={!this.state.isLoggedIn}
        className={Classes.OVERLAY_CONTAINER}
      >
        <div className={classes}>
          <Tabs
            onChange={this.handleTabChange}
            selectedTabId={this.state.tabId}
          >
            <Tab
              id="login"
              title="Log In"
              panel={<LoginForm handleLogin={this.handleLogin} />}
            />
            <Tab
              id="signup"
              title="Sign Up"
              panel={<SignupForm handleSignup={this.handleSignup} />}
            />
          </Tabs>
        </div>
      </Overlay>,
      <ContentSelection
        isLoggedIn={this.state.isLoggedIn}
        handleTranscriptChange={this.handleTranscriptChange}
        handleTranscriptIdInput={this.handleTranscriptIdInput}
        selectedTranscriptID={this.state.selectedTranscriptID}
        inputTranscriptId={
          this.state.selectedTranscriptID !== "-1"
            ? this.state.selectedTranscriptID.value
            : ""
        }
        inputUtteranceIndex={this.state.inputUtteranceIndex}
      />,
      <div id="container">
        <div id="upper-container">
          <UtteranceDisplay
            isPublic={false}
            isLoggedIn={this.state.isLoggedIn}
            participantId={this.state.participantId}
            selectedTranscriptID={this.state.selectedTranscriptID.value}
            inputUtteranceIndex={this.state.inputUtteranceIndex}
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
            isPublic={false}
            isLoggedIn={this.state.isLoggedIn}
            participantId={this.state.participantId}
            idGlossPos={this.state.idGlossPos}
            changeTagStatus={this.changeTagStatus}
            utteranceIndex={this.state.utteranceIndex}
            tokenIndex={this.state.tokenIndex}
            transcriptId={this.state.selectedTranscriptID.value}
            workUnitId={this.state.workUnitId}
          />
        </div>
      </div>
    ];
  }
}

export default Staff;

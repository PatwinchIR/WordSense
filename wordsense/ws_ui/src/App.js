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
import {H1, H4, Overlay, Tabs, Tab, Classes, Toaster, Intent} from "@blueprintjs/core";
import classNames from "classnames";

const OVERLAY_CLASS = "docs-overlay-example-transition";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedIn: !!localStorage.getItem('word_sense_token'),
        username: "",
      tabId: "login",

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
    this.handleLogin = this.handleLogin.bind(this);
    this.handleSignup = this.handleSignup.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  componentDidMount() {
    if (this.state.isLoggedIn) {
      fetch('http://localhost:8000/api/current_user/', {
        headers: {
          Authorization: `JWT ${localStorage.getItem('word_sense_token')}`
        }
      })
        .then(res => res.json())
        .then(json => {
          this.setState({ username: json.username });
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

  handleLogin(e, data) {
    e.preventDefault();
    fetch('http://127.0.0.1:8000/token-auth/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(res => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error("Wrong username/password!");
          }
        })
        .then(json => {
            localStorage.setItem('word_sense_token', json.token);
            this.setState({
                isLoggedIn: true,
                username: json.user.username
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
    fetch('http://127.0.0.1:8000/api/signup/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(res => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error("Username already exists!");
          }
        })
        .then(json => {
            localStorage.setItem('word_sense_token', json.token);
        this.setState({
          isLoggedIn: true,
          username: json.username
        });
        })
        .catch(error => {
          const toaster = Toaster.create(this.props);
          toaster.show({
            intent: Intent.DANGER,
            message: (
              <>
                <em> {error.toString()} </em>
              </>
            )
          });
        });
  }

  handleLogout() {
    localStorage.removeItem('word_sense_token');
    this.setState({ isLoggedIn: false, username: '' });
  };

  handleTabChange = tabId => {
    this.setState({tabId: tabId});
  };

  render() {
    const classes = classNames(
            Classes.CARD,
            Classes.ELEVATION_4,
            OVERLAY_CLASS
        );

    return [
      <div id="banner">
        <H1>WordSense</H1>
          <H4>Welcome, {this.state.username}</H4>
          <div onClick={this.handleLogout}>Log Out</div>
      </div>,
        <Overlay isOpen={!this.state.isLoggedIn} className={Classes.OVERLAY_CONTAINER}>
          <div className={classes}>
          <Tabs onChange={this.handleTabChange} selectedTabId={this.state.tabId}>
              <Tab id="login" title="Log In" panel={<LoginForm handleLogin={this.handleLogin}/>}/>
            <Tab id="signup" title="Sign Up" panel={<SignupForm handleSignup={this.handleSignup} />} />
          </Tabs>
            </div>
        </Overlay>,
      <div id="upper-container">
        <ContentSelection
          isLoggedIn={this.state.isLoggedIn}
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
            isLoggedIn={this.state.isLoggedIn}
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
            isLoggedIn={this.state.isLoggedIn}
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

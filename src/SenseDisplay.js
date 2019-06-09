import React, { Component } from "react";
import {
  Intent,
  Toaster,
  Checkbox,
  Text,
  Button,
  HTMLTable,
  Overlay
} from "@blueprintjs/core";
import {
  CarouselProvider,
  Slider,
  Slide,
  ButtonBack,
  ButtonNext,
  ButtonFirst,
  ButtonLast
} from "pure-react-carousel";
import {
  CONTEXT_LENGTH,
  BASE_URL,
  PUBLIC_URL,
  POS_DEFINITION
} from "./Constants";
import Fingerprint2 from "fingerprintjs2";
import cookie from "react-cookie";
import * as Classes from "@blueprintjs/core/lib/esm/common/classes";
import WrongPosForm from "./WrongPosForm";
import classNames from "classnames";

const OVERLAY_CLASS = "docs-overlay-example-transition";

class SenseDisplay extends Component {
  constructor(props) {
    super(props);

    this.state = {
      senses: [],
      selectedSenses: [],
      saveStatus: "",
      saveDisabled: false,
      originalSenses: [],
      fingerprint: {},
      participantId: undefined,
      isWrongPosAlertOpen: false,
      disabledSenseSelection: false
    };

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

    this.handleSensesChange = this.handleSensesChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleWrongPosOpen = this.handleWrongPosOpen.bind(this);
    this.handleWrongPosClose = this.handleWrongPosClose.bind(this);
    this.disableSenseSelection = this.disableSenseSelection.bind(this);
  }

  async loadSensesExamplesForGloss(token_id, gloss, pos) {
    try {
      var finalParticipantId = this.props.isPublic
        ? this.state.participantId
        : this.props.participantId;
      const sensesRes = await fetch(
        `${BASE_URL}/api/${
          this.props.isPublic ? PUBLIC_URL : ""
        }get_senses/?gloss=${gloss}&pos=${pos}&token_id=${token_id}`,
        {
          headers: {
            Authorization: this.props.isPublic
              ? ""
              : `JWT ${localStorage.getItem("word_sense_token")}`,
            "X-CSRFToken": cookie.load("csrftoken")
          }
        }
      );
      const tagsRes = await fetch(
        `${BASE_URL}/api/${
          this.props.isPublic ? PUBLIC_URL : ""
        }get_tags/?gloss_with_replacement=${gloss}&token_id=${token_id}&participant_id=${finalParticipantId}`,
        {
          headers: {
            Authorization: this.props.isPublic
              ? ""
              : `JWT ${localStorage.getItem("word_sense_token")}`,
            "X-CSRFToken": cookie.load("csrftoken")
          }
        }
      );
      const senses = await sensesRes.json();
      const tags = await tagsRes.json();
      if (
        senses.detail === "Signature has expired." ||
        tags.detail === "Signature has expired."
      ) {
        const toaster = Toaster.create(this.props);
        toaster.show({
          intent: Intent.DANGER,
          message: (
            <>
              <em>Oops! </em>Session Expired.
            </>
          )
        });
      }
      this.setState({
        senses: senses,
        originalSenses: JSON.parse(JSON.stringify(tags)),
        selectedSenses: tags,
        saveStatus: tags.length > 0 ? "SAVED" : "SAVE",
        saveDisabled: tags.length === 0
      });
    } catch (e) {
      console.log(e);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isLoggedIn !== nextProps.isLoggedIn) {
      if (!nextProps.isLoggedIn) {
        this.setState({
          senses: [],
          selectedSenses: [],
          saveStatus: "",
          saveDisabled: false,
          originalSenses: [],
          fingerprint: {},
          participantId: undefined,
          isWrongPosAlertOpen: false,
          disabledSenseSelection: false
        });
      }
    }
    if (this.props.transcriptId !== nextProps.transcriptId) {
      this.setState({
        senses: []
      });
    }
    if (
      this.props.idGlossPos.token_id !== nextProps.idGlossPos.token_id &&
      nextProps.idGlossPos.token_id !== undefined
    ) {
      this.setState({
          isWrongPosAlertOpen: false,
          disabledSenseSelection: false
      });
      this.loadSensesExamplesForGloss(
        nextProps.idGlossPos.token_id,
        nextProps.idGlossPos.gloss,
        nextProps.idGlossPos.pos
      );
    }
  }

  handleSensesChange(event) {
    const selectedSenses = this.state.selectedSenses;
    let index;
    if (event.target.checked) {
      this.state.selectedSenses.push(+event.target.value);
    } else {
      index = selectedSenses.indexOf(+event.target.value);
      selectedSenses.splice(index, 1);
    }

    this.setState({
      selectedSenses: selectedSenses,
      saveStatus: arraysEqual(selectedSenses, this.state.originalSenses)
        ? "SAVED"
        : "SAVE",
      saveDisabled: selectedSenses.length === 0
    });
  }

  loadTags(offset) {
    if (this.state.selectedSenses.length === 0) {
      return false;
    } else {
      return this.state.selectedSenses.some(item => item === offset);
    }
  }

  handleFormSubmit(event) {
    event.preventDefault();
    fetch(`${BASE_URL}/api/${this.props.isPublic ? PUBLIC_URL : ""}save/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: this.props.isPublic
          ? ""
          : `JWT ${localStorage.getItem("word_sense_token")}`,
        "X-CSRFToken": cookie.load("csrftoken")
      },
      body: JSON.stringify({
        gloss_with_replacement: this.props.idGlossPos.gloss,
        token: this.props.idGlossPos.token_id,
        transcript_id: this.props.transcriptId,
        sense_offsets: this.state.selectedSenses,
        participant: this.props.isPublic
          ? this.state.participantId
          : this.props.participantId,
        fingerprint: this.state.fingerprint
      })
    })
      .then(response => {
        const toaster = Toaster.create(this.props);
        if (response.status === 202) {
          toaster.show({
            icon: "saved",
            intent: Intent.SUCCESS,
            message: (
              <>
                Sense offsets saved. <em>Yay!</em>
              </>
            )
          });
          return response.json();
        } else if (response.status === 302) {
          toaster.show({
            icon: "warning-sign",
            intent: Intent.WARNING,
            message: <>Sense offsets already saved.</>
          });
          throw new Error("302");
        } else if (response.status === 401) {
          toaster.show({
            intent: Intent.DANGER,
            message: (
              <>
                <em>Oops! </em>Session Expired.
              </>
            )
          });
          throw new Error("Session Expired");
        } else {
          toaster.show({
            intent: Intent.DANGER,
            message: (
              <>
                <em>Oops! </em>Failed to save sense offsets.
              </>
            )
          });
          throw new Error("Unknown Error");
        }
      })
      .then(resData => {
        this.setState({
          originalSenses: JSON.parse(JSON.stringify(this.state.selectedSenses)),
          saveStatus: "SAVED",
          participantId: resData["participant_id"]
        });
        this.props.changeTagStatus(this.props.utteranceIndex);
      })
      .catch(error => console.log(error));
  }

  handleReset() {
    this.setState({
      selectedSenses: JSON.parse(JSON.stringify(this.state.originalSenses)),
      saveStatus: this.state.originalSenses.length === 0 ? "SAVE" : "SAVED"
    });
  }

  handleWrongPosOpen() {
    console.log(this.state.isWrongPosAlertOpen);
    this.setState({ isWrongPosAlertOpen: true });
  }

  handleWrongPosClose() {
    this.setState({ isWrongPosAlertOpen: false });
  }

  disableSenseSelection() {
    this.setState({
      isWrongPosAlertOpen: false,
      disabledSenseSelection: true
    });
  }

  render() {
    const classes = classNames(
      Classes.CARD,
      Classes.ELEVATION_4,
      OVERLAY_CLASS,
      "auth-portal-card"
    );
    const isSenses = this.state.senses && this.state.senses.length > 0;

    if (isSenses) {
      return (
        ((!this.props.isPublic && this.props.isLoggedIn) ||
          this.props.isPublic) && (
          <div id="senses">
            <div class="header">
              <Text className="currentWord">
                {this.props.idGlossPos.gloss}, {this.props.idGlossPos.pos}{" "}
              </Text>
              <Text>
                (Transcript ID: {this.props.transcriptId}, Utterance Index:{" "}
                {this.props.utteranceIndex - CONTEXT_LENGTH})
              </Text>
              <Button
                className="wrongPos"
                onClick={this.handleWrongPosOpen}
                text={
                  this.state.disabledSenseSelection
                    ? "You marked this token having wrong part of speech"
                    : "Wrong Part of Speech ?"
                }
                intent={
                  this.state.disabledSenseSelection ? "danger" : "warning"
                }
                disabled={this.state.disabledSenseSelection}
              />
            </div>
            <Overlay
              isOpen={this.state.isWrongPosAlertOpen}
              className={Classes.OVERLAY_CONTAINER}
            >
              <div className={classes}>
                <WrongPosForm
                  isPublic={this.props.isPublic}
                  idGlossPos={this.props.idGlossPos}
                  handleWrongPosClose={this.handleWrongPosClose}
                  participantId={
                    this.props.isPublic
                      ? this.state.participantId
                      : this.props.participantId
                  }
                  disableSenseSelection={this.disableSenseSelection}
                  fingerprint={this.state.fingerprint}
                />
              </div>
            </Overlay>
            <form onSubmit={this.handleFormSubmit}>
              <div className="bp3-card bp3-elevation-1">
                <HTMLTable
                  id="senses-table"
                  className="bp3-html-table bp3-interactive bp3-html-table-striped"
                >
                  <thead>
                    <tr>
                      <th>Senses</th>
                      <th>Examples</th>
                      {!this.props.isPublic && <th># of Tags</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.senses.map(sense_example => [
                      <tr>
                        <td>
                          <Checkbox
                            style={{ color: "blue" }}
                            type="checkbox"
                            value={sense_example.offset}
                            onChange={this.handleSensesChange}
                            checked={this.loadTags(sense_example.offset)}
                            label={sense_example.sense}
                            disabled={this.state.disabledSenseSelection}
                          />
                        </td>
                        <td>
                          <CarouselProvider
                            naturalSlideWidth={6}
                            naturalSlideHeight={1}
                            totalSlides={sense_example.examples.length}
                            currentSlide={0}
                            lockOnWindowScroll={false}
                            dragEnabled={false}
                            touchEnabled={false}
                          >
                            <Slider className="example-slider">
                              {sense_example.examples.map(example => (
                                <Slide>
                                  <Text>{example}</Text>
                                </Slide>
                              ))}
                            </Slider>
                            <ButtonFirst>{"<<"}</ButtonFirst>
                            <ButtonBack>{"<"}</ButtonBack>
                            <ButtonNext>{">"}</ButtonNext>
                            <ButtonLast>{">>"}</ButtonLast>
                          </CarouselProvider>
                        </td>
                        {!this.props.isPublic && (
                          <td>{sense_example.number_of_tags}</td>
                        )}
                      </tr>
                    ])}
                  </tbody>
                </HTMLTable>
              </div>
              <div id="control-buttons">
                <Button
                  type="submit"
                  intent={
                    this.state.saveStatus === "SAVED" ? "success" : "primary"
                  }
                  text={this.state.saveStatus}
                  disabled={
                    this.state.saveDisabled ||
                    this.state.saveStatus === "SAVED" ||
                    this.state.selectedSenses.length === 0
                  }
                />
                <Button
                  intent={"warning"}
                  text={"RESET"}
                  onClick={this.handleReset}
                  disabled={arraysEqual(
                    this.state.selectedSenses,
                    this.state.originalSenses
                  )}
                />
              </div>
            </form>
          </div>
        )
      );
    }
    return null;
  }
}

function arraysEqual(_arr1, _arr2) {
  if (
    !Array.isArray(_arr1) ||
    !Array.isArray(_arr2) ||
    _arr1.length !== _arr2.length
  )
    return false;

  var arr1 = _arr1.concat().sort();
  var arr2 = _arr2.concat().sort();

  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
}

export default SenseDisplay;

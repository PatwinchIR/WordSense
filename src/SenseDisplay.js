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
import { CONTEXT_LENGTH, BASE_URL, PUBLIC_URL } from "./Constants";
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
      disabledSenseSelection: false,
      highlightSenses: [],
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
    this.loadHighlight = this.loadHighlight.bind(this);
  }

  async loadSensesExamplesForGloss(token_id, gloss, pos) {
    try {
      var finalParticipantId = this.props.isPublic
        ? this.state.participantId
        : this.props.participantId;
      const sensesRes = await fetch(
        `${BASE_URL}/api/${
          this.props.isPublic ? PUBLIC_URL : ""
        }get_senses/?gloss=${gloss}&pos=${pos}&token_id=${token_id}&workerId=${this.props.workerId}&userType=${this.props.userType}`,
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
        }get_tags/?gloss_with_replacement=${gloss}&token_id=${token_id}&participant_id=${finalParticipantId}&workerId=${this.props.workerId}&userType=${this.props.userType}`,
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
      const idkOption = {
        id: 117666,
        definition: "I don't know",
        examples: [],
        number_of_tags: 0
      };
      const otherMeaningOption = {
        id: 117667,
        definition: "Other meanings (None of the below)",
        examples: [],
        number_of_tags: 0
      };
      if (senses[0].id > 0) senses.unshift(idkOption, otherMeaningOption);
      this.setState({
        senses: senses,
        originalSenses: JSON.parse(JSON.stringify(tags)),
        selectedSenses: tags.data,
        highlightSenses: tags.highlight,
        saveStatus: tags.data.length > 0 ? "SAVED" : "SAVE",
        saveDisabled: tags.data.length === 0,
        disabledSenseSelection: tags.data[0] === null
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

  loadTags(id) {
    if (this.state.selectedSenses.length === 0) {
      return false;
    } else {
      return this.state.selectedSenses.some(item => item === id);
    }
  }

  loadHighlight(id) {
    if (this.state.highlightSenses.length === 0) {
      return undefined;
    } else {
      return this.state.highlightSenses.some(item => item === id) ? "cornsilk" : "white";
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
        sense_ids: this.state.selectedSenses,
        participant: this.props.isPublic
          ? this.state.participantId
          : this.props.participantId,
        fingerprint: this.state.fingerprint,
        workerId: this.props.workerId,
        workUnitId: this.props.workUnitId,
        userType: this.props.userType
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
        this.props.changeTagStatus(
          this.props.utteranceIndex,
          this.props.tokenIndex
        );
      })
      .catch(error => console.log(error));
  }

  handleReset() {
    var selectedSenses = JSON.parse(JSON.stringify(this.state.originalSenses));
    if (selectedSenses.data !== undefined) {
      selectedSenses = selectedSenses.data;
    }
    this.setState({
      selectedSenses: selectedSenses,
      saveStatus: this.state.originalSenses.length === 0 ? "SAVE" : "SAVED"
    });
  }

  handleWrongPosOpen() {
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
                  transcriptId={this.props.transcriptId}
                  changeTagStatus={this.props.changeTagStatus}
                  utteranceIndex={this.props.utteranceIndex}
                  tokenIndex={this.props.tokenIndex}
                  workerId={this.props.workerId}
                  workUnitId={this.props.workUnitId}
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
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.senses.map(sense_example => {
                      if (sense_example.id > 0) {
                        return (
                          <tr bgcolor={this.loadHighlight(sense_example.id)}>
                            <td>
                              <Checkbox
                                style={{
                                  color:
                                    sense_example.id === 117666 ||
                                    sense_example.id === 117667
                                      ? "red"
                                      : "blue"
                                }}
                                type="checkbox"
                                value={sense_example.id}
                                onChange={this.handleSensesChange}
                                checked={this.loadTags(sense_example.id)}
                                label={sense_example.definition}
                                disabled={
                                  this.state.disabledSenseSelection
                                    ? true
                                    : this.state.selectedSenses.includes(117666)
                                    ? sense_example.id !== 117666
                                    : false
                                }
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
                          </tr>
                        );
                      } else
                        return (
                          <label>
                            No senses found for the current token and its part
                            of speech.
                          </label>
                        );
                    })}
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

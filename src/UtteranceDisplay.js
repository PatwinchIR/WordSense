import React, { Component } from "react";
import Utterance from "./Utterance";
import { CarouselProvider, Slider, Slide } from "pure-react-carousel";
import ButtonDiv from "./ButtonDiv";
import Restart from "./Restart";
import "pure-react-carousel/dist/react-carousel.es.css";
import { Spinner, Button, Toaster, Intent } from "@blueprintjs/core";
import {
  CONTEXT_LENGTH,
  UTTERANCE_TO_DISPLAY,
  BASE_URL,
  PUBLIC_URL
} from "./Constants";
import cookie from "react-cookie";

class UtteranceDisplay extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clickedTokenId: "",
      clickedGloss: "",
      utterances: [],
      displayFocusIndex: 0,
      displayFocusUtterance: [],
      loading: false,
      confirmed: false,
      inputUtteranceIndex: 0,
      workerId: "unset",
      workUnitId: -1,
      userType: undefined
    };

    this.loadUtterancesForSelectedTranscript = this.loadUtterancesForSelectedTranscript.bind(
      this
    );
    this.setDisplayFocus = this.setDisplayFocus.bind(this);
    this.handleConfirmation = this.handleConfirmation.bind(this);
    this.keyHandling = this.keyHandling.bind(this);
  }

  processUtterances(rawUtterances) {
    const tags_set = new Set(rawUtterances.tags_set);
    const utterances = rawUtterances.data.reduce((utterances, item) => {
      if (!utterances[item.utterance_id]) {
        utterances[item.utterance_id] = {
          speaker_role: item.speaker_role,
          id_gloss_pos: [],
          tagable: false,
          forwardStep: 1,
          backwardStep: 1
        };
      }
      utterances[item.utterance_id].id_gloss_pos.push({
        gloss: item.gloss_with_replacement,
        pos: item.part_of_speech,
        token_id: item.id,
        requires_tags: item.requires_tags,
        tag_status: tags_set.has(item.id)
          ? "TAGGED"
          : item.requires_tags
          ? "TAGGABLE"
          : "UNTAGGABLE"
      });
      return utterances;
    }, {});
    const results = [];
    const emptyUtterance = {
      speaker_role: "",
      id_gloss_pos: [],
      tagable: false,
      forwardStep: 0,
      backwardStep: 0
    };

    for (let i = 0; i < CONTEXT_LENGTH; i++) results.push(emptyUtterance);

    Object.keys(utterances)
      .sort((a, b) => a - b)
      .forEach((v, i) => {
        const utterance = utterances[v];
        utterances[v].tagable = utterance.id_gloss_pos.reduce(
          (accum, item) =>
            accum ||
            (item.requires_tags),
          false
        );
        results.push(utterances[v]);
      });
    results.forEach((utterance, index) => {
      for (let i = index + 1; i < results.length; i++) {
        if (results[i].tagable) {
          utterance.forwardStep = i - index;
          break;
        }
      }
      for (let i = index - 1; i > 0; i--) {
        if (results[i].tagable) {
          utterance.backwardStep = index - i;
          break;
        }
      }
    });
    return results;
  }

  async loadUtterancesForSelectedTranscript(transcriptID) {
    if (transcriptID === null) {
      return;
    }
    try {
      await fetch(
        `${BASE_URL}/api/${
          this.props.isPublic ? PUBLIC_URL : ""
        }get_utterances/?transcript_id=${transcriptID}&participant_id=${
          this.props.participantId
        }&workerId=${this.props.workerId}&userType=${this.props.userType}`,
        {
          headers: {
            Authorization: this.props.isPublic
              ? ""
              : `JWT ${localStorage.getItem("word_sense_token")}`,
            "X-CSRFToken": cookie.load("csrftoken")
          }
        }
      )
        .then(res => {
          if (res.status === 200) {
            return res.json()
          } else if (res.status === 204) {
            throw new Error(
              "You've finished everything !"
            )
          } else {
            throw new Error(
              res.statusText
            )
          }
        })
        .then(utterances => {
                this.setState({
                    participantId: utterances.participant_id,
                    workUnitId: utterances.work_unit_id,
                    utterances: this.processUtterances(utterances),
                    loading: false,
                    displayFocusUtterance: [],
                    displayFocusIndex: 0,
                    inputUtteranceIndex: 0,
                    confirmed: this.props.isPublic
                });
            }
        )
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
          this.setState({
            loading: false,
            displayFocusUtterance: [],
            displayFocusIndex: 0,
            inputUtteranceIndex: 0,
            confirmed: false
          });
        });
    } catch (e) {
      console.log(e);
    }
  }

  keyHandling(e) {
    var nextWord = undefined;
    var currentUtteranceIndex = this.state.displayFocusIndex;
    var currentTokenIndex = this.props.tokenIndex;
    if (this.state.utterances[currentUtteranceIndex] !== undefined) {
      while(nextWord === undefined) {
        var currentUtterance = this.state.utterances[currentUtteranceIndex];

        if (e.keyCode === 40) { // down arrow key
          currentTokenIndex++;
          if (currentTokenIndex > (currentUtterance.id_gloss_pos.length - 1)) {
            currentUtteranceIndex += currentUtterance.forwardStep;
            currentUtterance = this.state.utterances[currentUtteranceIndex];
            currentTokenIndex = 0;
          }
        } else if (e.keyCode === 38) { // up arrow key
          currentTokenIndex--;
          if (currentTokenIndex < 0) {
            currentUtteranceIndex -= currentUtterance.backwardStep;
            currentUtterance = this.state.utterances[currentUtteranceIndex];
            currentTokenIndex = currentUtterance.id_gloss_pos.length - 1;
          }
        }

        if (currentUtterance.id_gloss_pos[currentTokenIndex].tag_status === "TAGGABLE") {
          nextWord = currentUtterance.id_gloss_pos[currentTokenIndex];
        }
      }

      this.props.handleGlossClick(
        nextWord,
        currentUtteranceIndex,
        currentTokenIndex,
        this.state.workUnitId,
        this.props.isPublic ? this.state.participantId : this.props.participantId
      );

      this.setDisplayFocus(
        this.state.utterances[currentUtteranceIndex],
        currentUtteranceIndex,
      );
      this.setState({inputUtteranceIndex: currentUtteranceIndex - CONTEXT_LENGTH});
    }
  }

  componentDidMount() {
    if (this.props.isPublic) {
      this.setState({
        loading: true,
        confirmed: true
      });
      this.loadUtterancesForSelectedTranscript(-1);
    }

    // window.addEventListener("keydown", this.keyHandling);
  }

  componentWillUnmount() {
    // Remove event listener on compenent unmount
    // window.removeEventListener("keydown", this.keyHandling);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isLoggedIn !== nextProps.isLoggedIn) {
      if (!nextProps.isLoggedIn) {
        this.setState({
          clickedTokenId: "",
          clickedGloss: "",
          utterances: [],
          displayFocusIndex: 0,
          displayFocusUtterance: [],
          loading: false,
          confirmed: false,
          inputUtteranceIndex: 0
        });
      }
    }
    if (
      this.props.selectedTranscriptID !== nextProps.selectedTranscriptID &&
      nextProps.selectedTranscriptID !== undefined
    ) {
      this.setState({
        loading: true,
        confirmed: false
      });
      this.loadUtterancesForSelectedTranscript(nextProps.selectedTranscriptID);
    }
    if (this.props.numTagsProvidedNext !== nextProps.numTagsProvidedNext) {
      this.setState({
        inputUtteranceIndex: 0,
        confirmed: false
      });
      this.loadUtterancesForSelectedTranscript(-1);
    }
    if (
      (this.props.utteranceIndexForTagStatusChange !==
        nextProps.utteranceIndexForTagStatusChange &&
        nextProps.utteranceIndexForTagStatusChange !== -1) ||
      (this.props.utteranceIndexForTagStatusChange ===
        nextProps.utteranceIndexForTagStatusChange &&
        this.props.tokenIndexForTagStatusChange !==
          nextProps.tokenIndexForTagStatusChange &&
        nextProps.tokenIndexForTagStatusChange !== -1)
    ) {
      let utterances = [...this.state.utterances];
      let utterance = {
        ...utterances[nextProps.utteranceIndexForTagStatusChange]
      };
      let token = {
        ...utterance.id_gloss_pos[nextProps.tokenIndexForTagStatusChange]
      };
      token.tag_status = "TAGGED";
      utterance.id_gloss_pos[nextProps.tokenIndexForTagStatusChange] = token;
      utterances[nextProps.utteranceIndexForTagStatusChange] = utterance;
      this.setState({ utterances: utterances });
    }
    if (
      this.props.inputUtteranceIndex !== nextProps.inputUtteranceIndex &&
      nextProps.inputUtteranceIndex !== ""
    ) {
      this.setState({
        inputUtteranceIndex: Math.max(
          0,
          Math.min(
            parseInt(nextProps.inputUtteranceIndex),
            this.state.utterances.length - 1
          )
        )
      });
    }
  }

  setDisplayFocus(utterance, index) {
    this.setState({
      displayFocusUtterance: utterance,
      displayFocusIndex: index
    });
  }

  handleConfirmation() {
    this.setState({ confirmed: true });
  }

  render() {
    return (
      ((!this.props.isPublic && this.props.isLoggedIn) ||
        this.props.isPublic) && (
        <div id="utterances">
          {this.state.loading && (
            <Spinner
              className="spinner"
              intent={"primary"}
              size={50}
              value={null}
            />
          )}
          {this.props.selectedTranscriptID !== "-1" &&
            !this.state.loading &&
            !this.state.confirmed &&
            !this.props.isPublic && [
              <Button
                className="button-work-on-this"
                onClick={this.handleConfirmation}
                disabled={this.state.utterances.length <= 0}
              >
                Okay, Work on this!
              </Button>,
              <div className="preview-box bp3-card bp3-elevation-1">
                {this.state.utterances.map(utterance => (
                  <div>
                    {utterance.speaker_role}
                    {utterance.speaker_role === "" ? "" : ": "}
                    {utterance.id_gloss_pos.map(idGlossPos => (
                      <span>{idGlossPos.gloss} </span>
                    ))}
                  </div>
                ))}
              </div>
            ]}
          {(this.props.isPublic
            ? !this.state.loading && this.state.confirmed
            : this.state.confirmed) && (
            <CarouselProvider
              naturalSlideWidth={25}
              naturalSlideHeight={1.6}
              totalSlides={this.state.utterances.length}
              orientation="vertical"
              visibleSlides={UTTERANCE_TO_DISPLAY}
              currentSlide={this.state.inputUtteranceIndex}
              lockOnWindowScroll={false}
              dragEnabled={false}
              touchEnabled={false}
            >
              <Slider id="content-slider" className="bp3-card bp3-elevation-1">
                {this.state.utterances.map((utterance, index) => (
                  <Slide index={index}>
                    <Utterance
                      utterance={utterance}
                      index={index}
                      setDisplayFocus={this.setDisplayFocus}
                      handleGlossClick={this.props.handleGlossClick}
                      activeWord={this.props.activeWord}
                      workUnitId={this.state.workUnitId}
                      participantId={this.props.isPublic
                                      ? this.state.participantId
                                      : this.props.participantId}
                    />
                  </Slide>
                ))}
              </Slider>

              <Restart loading={this.state.loading} />
              <div id="control-buttons">
                <ButtonDiv
                  value="backward"
                  displayFocusUtterance={this.state.displayFocusUtterance}
                  displayFocusIndex={this.state.displayFocusIndex}
                />

                <ButtonDiv
                  value="forward"
                  displayFocusUtterance={this.state.displayFocusUtterance}
                  displayFocusIndex={this.state.displayFocusIndex}
                />
              </div>
            </CarouselProvider>
          )}
        </div>
      )
    );
  }
}

export default UtteranceDisplay;

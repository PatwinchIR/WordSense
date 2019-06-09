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
      inputUtteranceIndex: 0
    };

    this.loadUtterancesForSelectedTranscript = this.loadUtterancesForSelectedTranscript.bind(
      this
    );
    this.setDisplayFocus = this.setDisplayFocus.bind(this);
    this.handleConfirmation = this.handleConfirmation.bind(this);
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
        tag_status: tags_set.has(item.id) ?
            "TAGGED" :
            (item.part_of_speech === "n"
                || item.part_of_speech === "v"
                || item.part_of_speech === "adj"
                || item.part_of_speech === "adv" ?
                    "TAGGABLE" : "UNTAGGABLE"
            )
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
            (item.pos === "n" ||
              item.pos === "v" ||
              item.pos === "adj" ||
              item.pos === "adv"),
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
        }`,
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
          if (res.ok) {
            return res.json();
          } else {
            throw new Error(
              this.props.isPublic ? "Fetching Error" : res.statusText
            );
          }
        })
        .then(utterances =>
          this.setState({
            utterances: this.processUtterances(utterances),
            loading: false,
            displayFocusUtterance: [],
            displayFocusIndex: 0,
            confirmed: this.props.isPublic
          })
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
            confirmed: false
          });
        });
    } catch (e) {
      console.log(e);
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
    if (
      this.props.utteranceIndexForTagStatusChange !==
        nextProps.utteranceIndexForTagStatusChange &&
      nextProps.utteranceIndexForTagStatusChange !== -1
    ) {
      let utterances = [...this.state.utterances];
      let utterance = {
        ...utterances[nextProps.utteranceIndexForTagStatusChange]
      };
      let token = { ...utterance.id_gloss_pos[nextProps.tokenIndex] };
      token.tag_status = "TAGGED";
      utterance.id_gloss_pos[nextProps.tokenIndex] = token;
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

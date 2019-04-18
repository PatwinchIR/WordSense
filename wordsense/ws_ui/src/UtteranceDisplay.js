import React, { Component } from "react";
import Utterance from "./Utterance";
import { CarouselProvider, Slider, Slide } from "pure-react-carousel";
import ButtonDiv from "./ButtonDiv";
import Restart from "./Restart";
import "pure-react-carousel/dist/react-carousel.es.css";
import { Spinner } from "@blueprintjs/core";

class UtteranceDisplay extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clickedTokenId: "",
      clickedGloss: "",
      utterances: [],
      displayFocusIndex: 0,
      displayFocusUtterance: [],
      loading: false
    };

    const rowsDisplaying = 9;

    this.loadUtterancesForSelectedTranscript = this.loadUtterancesForSelectedTranscript.bind(
      this
    );
    this.setDisplayFocus = this.setDisplayFocus.bind(this);
  }

  processUtterances(rawUtterances) {
    const utterances = rawUtterances.reduce((utterances, item) => {
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
        tag_status: item.tag_status
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

    for (let i = 0; i < 4; i++) results.push(emptyUtterance);

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
    console.log(results);
    return results;
  }

  async loadUtterancesForSelectedTranscript(transcriptID) {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/get_utterances?transcript_id=${transcriptID}`
      );
      const utterances = await res.json();
      this.setState({
        utterances: this.processUtterances(utterances),
        loading: false,
        displayFocusUtterance: [],
        displayFocusIndex: 0
      });
    } catch (e) {
      console.log(e);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.selectedTranscriptID !== nextProps.selectedTranscriptID) {
      this.setState({ loading: true });
      this.loadUtterancesForSelectedTranscript(nextProps.selectedTranscriptID);
    }
    if (
      this.props.utteranceIndexForTagStatusChange !==
      nextProps.utteranceIndexForTagStatusChange
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
  }

  setDisplayFocus(utterance, index) {
    this.setState({
      displayFocusUtterance: utterance,
      displayFocusIndex: index
    });
  }

  render() {
    return (
      <div id="utterances">
        <CarouselProvider
          id="utterances"
          naturalSlideWidth={50}
          naturalSlideHeight={2}
          totalSlides={this.state.utterances.length}
          orientation="vertical"
          visibleSlides={9}
          currentSlide={0}
          lockOnWindowScroll={false}
          dragEnabled={false}
          touchEnabled={false}
        >
          {this.state.loading && (
            <Spinner intent={"primary"} size={50} value={null} />
          )}
          <Slider>
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
        </CarouselProvider>
      </div>
    );
  }
}

export default UtteranceDisplay;

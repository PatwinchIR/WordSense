import React, { Component } from "react";
import { WithStore } from "pure-react-carousel";
import { Button } from "@blueprintjs/core";
import { Drawer } from "@blueprintjs/core";
import { Position } from "@blueprintjs/core";


// import {
//   CONTEXT_LENGTH,
//   UTTERANCE_TO_DISPLAY,
//   BASE_URL,
//   PUBLIC_URL
// } from "./Constants";


class ButtonDiv extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      position: Position.LEFT,
      style: {overflowY: 'auto'},
    };
    this.handleOnMouseDown = this.handleOnMouseDown.bind(this);
    this.handleDrawer = this.handleDrawer.bind(this);
  }

  handleDrawer() {
    const utterances = this.props.utterances;
    var fontstyle = {fontSize: '18px'};
    var backgroundc = {backgroundColor: '#FFFF00'}
    var bolding = {fontWeight: 'bold'};
    const full_trans =
    <div style={fontstyle}>
      {utterances.map((utterance, index) => {
        if (this.props.currentUtteranceIndex === index)
          return <div style={backgroundc}>
                    {utterance.speaker_role}
                    {utterance.speaker_role === "" ? "" : ": "}
                    {utterance.id_gloss_pos.map((idGlossPos, gloss_index) => {
                      if (this.props.currentTokenIndex === gloss_index)
                        return <span id="test" style={bolding}>{idGlossPos.gloss} </span>
                      return <span>{idGlossPos.gloss} </span>
                    })}
                  </div>
        return <div>
                  {utterance.speaker_role}
                  {utterance.speaker_role === "" ? "" : ": "}
                  {utterance.id_gloss_pos.map(idGlossPos => (
                    <span>{idGlossPos.gloss} </span>
                  ))}
                </div>
      })}
    </div>;

    if (this.props.currentUtteranceIndex) {
      return full_trans;
    } else {
      return <p>"Error"</p>;
    }
  }


  handleOnMouseDown() {
    var nextUtterance = undefined;
    var nextWord = undefined;
    var nextUtteranceIndex = undefined;
    var nextTokenIndex = undefined;
    var currentUtteranceIndex = this.props.currentUtteranceIndex;
    var currentTokenIndex = this.props.currentTokenIndex;
    var currentUtterance = this.props.utterances[currentUtteranceIndex];

    if (this.props.value === "forward") {

      if (currentUtterance !== undefined) {

        if (currentTokenIndex < 0 || currentTokenIndex >= currentUtterance.id_gloss_pos.length || currentTokenIndex === undefined) {
          currentTokenIndex = 0;
        }

        if (currentUtterance.id_gloss_pos.length > 0 && currentUtterance.id_gloss_pos[currentTokenIndex].forwardToken !== undefined) {
          nextUtteranceIndex = currentUtterance.id_gloss_pos[currentTokenIndex].forwardToken[0];
          nextTokenIndex = currentUtterance.id_gloss_pos[currentTokenIndex].forwardToken[1];
          nextUtterance = this.props.utterances[nextUtteranceIndex];
          nextWord = nextUtterance.id_gloss_pos[nextTokenIndex];
        } else {
          return;
        }

        this.props.handleGlossClick(
          nextWord,
          nextUtteranceIndex,
          nextTokenIndex,
          this.props.workUnitId,
          this.props.participantId,
        );

        this.props.setDisplayFocus(
          this.props.utterances[nextUtteranceIndex],
          nextUtteranceIndex,
        );
        // this.props.setState({inputUtteranceIndex: nextUtteranceIndex - CONTEXT_LENGTH});

        const maxSlide = this.props.totalSlides - this.props.visibleSlides;
        const change = nextUtteranceIndex - currentUtteranceIndex;
        const newCurrentSlide = Math.min(
          this.props.currentSlide + change,
          maxSlide
        );
        this.props.carouselStore.setStoreState({ currentSlide: newCurrentSlide });

      }

    } else if (this.props.value === "backward"){

      if (currentUtterance !== undefined) {

        if (currentTokenIndex < 0 || currentTokenIndex >= currentUtterance.id_gloss_pos.length || currentTokenIndex === undefined) {
          currentTokenIndex = 0;
        }

        if (currentUtterance.id_gloss_pos.length > 0 && currentUtterance.id_gloss_pos[currentTokenIndex].backwardToken !== undefined) {
          nextUtteranceIndex = currentUtterance.id_gloss_pos[currentTokenIndex].backwardToken[0];
          nextTokenIndex = currentUtterance.id_gloss_pos[currentTokenIndex].backwardToken[1];
          nextUtterance = this.props.utterances[nextUtteranceIndex];
          nextWord = nextUtterance.id_gloss_pos[nextTokenIndex];
        } else {
          return;
        }

        this.props.handleGlossClick(
          nextWord,
          nextUtteranceIndex,
          nextTokenIndex,
          this.props.workUnitId,
          this.props.participantId,
        );

        this.props.setDisplayFocus(
          this.props.utterances[nextUtteranceIndex],
          nextUtteranceIndex,
        );
        // this.props.setState({inputUtteranceIndex: nextUtteranceIndex - CONTEXT_LENGTH});

        const change = nextUtteranceIndex - currentUtteranceIndex;
        const newCurrentSlide = Math.max(
          this.props.currentSlide + change,
          0
        );
        this.props.carouselStore.setStoreState({ currentSlide: newCurrentSlide });

      }
    }


  }

  render() {


    if (this.props.value === "forward") {
      return (
        <Button
          onClick={this.handleOnMouseDown}
          rightIcon="arrow-right"
          intent="success"
          text="Next Utterance"
        >
          {this.props.children}
        </Button>
      );
    } else if (this.props.value === "backward") {
      return (
        <Button
          onClick={this.handleOnMouseDown}
          icon="arrow-left"
          intent="warning"
          text="Previous Utterance"
        >
          {this.props.children}
        </Button>
      );
    } else if (this.props.value === "transcript") {
      return (
        <div>
          <Button
            onClick={this.handleOpen}
            icon="document-open"
            intent="primary"
            text="Full Transcript"
          >
          </Button>
          <Drawer
              icon="document-open"
              onClose={this.handleClose}
              title="Full Transcript"
              size="48%"
              {...this.state}
          >
          {this.handleDrawer()}

          </Drawer>
        </div>
      );
    }

  }
  handleOpen = () => this.setState({ isOpen: true });
  handleClose = () => this.setState({ isOpen: false });
}

export default WithStore(ButtonDiv, state => ({
  currentSlide: state.currentSlide,
  totalSlides: state.totalSlides,
  visibleSlides: state.visibleSlides
}));

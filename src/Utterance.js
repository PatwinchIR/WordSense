import React, { Component } from "react";
import { WithStore } from "pure-react-carousel";
import { CONTEXT_LENGTH } from "./Constants";

class Utterance extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeWord: ""
    };
  }

  changeUtteranceStyle() {
    if (this.props.index === this.props.currentSlide + CONTEXT_LENGTH) {
      return "currentFocus";
    } else {
      return null;
    }
  }

  componentDidUpdate() {
    if (this.props.index === this.props.currentSlide + CONTEXT_LENGTH) {
      this.props.setDisplayFocus(this.props.utterance, this.props.index);
    } else {
    }
  }

  componentDidMount() {
    if (this.props.index === this.props.currentSlide + CONTEXT_LENGTH) {
      this.props.setDisplayFocus(this.props.utterance, this.props.index);
    } else {
    }
  }

  render() {
    const utterance = this.props.utterance;

    return [
      <div id="utterance" className={this.changeUtteranceStyle()}>
        {" "}
        <span id="utterance-index-column">
          {this.props.index - CONTEXT_LENGTH >= 0
            ? `${this.props.index - CONTEXT_LENGTH}:`
            : ""}
        </span>
        {utterance.speaker_role}
        {utterance.speaker_role === "" ? "" : ": "}
        {utterance.id_gloss_pos.map((idGlossPos, tokenIndex) => {
          return idGlossPos.tag_status !== "UNTAGGABLE" ? (
            <span
              className="keyword"
              onClick={() => {
                this.props.handleGlossClick(
                  idGlossPos,
                  this.props.index,
                  tokenIndex
                );
                if (
                  this.props.index !==
                  this.props.currentSlide + CONTEXT_LENGTH
                ) {
                  this.props.setDisplayFocus(
                    this.props.utterance,
                    this.props.index
                  );
                  this.props.carouselStore.setStoreState({
                    currentSlide: this.props.index - CONTEXT_LENGTH
                  });
                }
              }}
              style={{
                cursor: "pointer",
                color:
                  this.props.activeWord === idGlossPos.token_id
                    ? "blue"
                    : idGlossPos.tag_status === "TAGGABLE"
                    ? "red"
                    : "limegreen"
              }}
            >
              {idGlossPos.gloss}{" "}
            </span>
          ) : (
            <span>{idGlossPos.gloss} </span>
          );
        })}
      </div>,
      <br />
    ];
  }
}

// export default Utterance;

export default WithStore(Utterance, state => ({
  currentSlide: state.currentSlide,
  step: state.step
}));

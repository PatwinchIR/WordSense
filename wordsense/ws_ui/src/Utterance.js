import React, { Component } from "react";
import { WithStore } from "pure-react-carousel";

class Utterance extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeWord: ""
    };
  }

  changeUtteranceStyle() {
    if (this.props.index === this.props.currentSlide + 4) {
      return "currentFocus";
    } else {
      return null;
    }
  }

  componentDidUpdate() {
    if (this.props.index === this.props.currentSlide + 4) {
      this.props.setDisplayFocus(this.props.utterance, this.props.index);
    } else {
    }
  }

  componentDidMount() {
    if (this.props.index === this.props.currentSlide + 4) {
      this.props.setDisplayFocus(this.props.utterance, this.props.index);
    } else {
    }
  }

  render() {
    const utterance = this.props.utterance;

    return [
      <div id="utterance" className={this.changeUtteranceStyle()}>
        {" "}
        {utterance.speaker_role}
        {utterance.speaker_role === "" ? "" : ": "}
        {utterance.id_gloss_pos.map((idGlossPos, tokenIndex) => {
          return idGlossPos.tag_status !== "UNTAGGABLE" ? (
            <span
              onClick={() => {
                this.props.handleGlossClick(
                  idGlossPos,
                  this.props.index,
                  tokenIndex
                );
                if (this.props.index !== this.props.currentSlide + 4) {
                  this.props.setDisplayFocus(
                    this.props.utterance,
                    this.props.index
                  );
                  this.props.carouselStore.setStoreState({
                    currentSlide: this.props.index - 4
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
                    : "green"
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

import React, { Component } from "react";
import { WithStore } from "pure-react-carousel";
import { Button } from "@blueprintjs/core";

class ButtonDiv extends Component {
  constructor(props) {
    super(props);

    this.handleOnMouseDown = this.handleOnMouseDown.bind(this);
  }

  handleOnMouseDown() {
    if (this.props.value === "forward") {
      const maxSlide = this.props.totalSlides - this.props.visibleSlides;
      const newCurrentSlide = Math.min(
        this.props.currentSlide + this.props.displayFocusUtterance.forwardStep,
        maxSlide
      );
      this.props.carouselStore.setStoreState({ currentSlide: newCurrentSlide });
    } else {
      const newCurrentSlide = Math.max(
        this.props.currentSlide - this.props.displayFocusUtterance.backwardStep,
        0
      );
      this.props.carouselStore.setStoreState({ currentSlide: newCurrentSlide });
    }
  }

  render() {
    return this.props.value === "forward" ? (
      <Button
        onClick={this.handleOnMouseDown}
        rightIcon="arrow-right"
        intent="success"
        text="Next Utterance"
      >
        {this.props.children}
      </Button>
    ) : (
      <Button
        onClick={this.handleOnMouseDown}
        icon="arrow-left"
        intent="warning"
        text="Previous Utterance"
      >
        {this.props.children}
      </Button>
    );
  }
}

export default WithStore(ButtonDiv, state => ({
  currentSlide: state.currentSlide,
  totalSlides: state.totalSlides,
  visibleSlides: state.visibleSlides
}));

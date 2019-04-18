import React, { Component } from "react";
import { WithStore } from "pure-react-carousel";

class Restart extends Component {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.loading && !nextProps.loading) {
      this.props.carouselStore.setStoreState({ currentSlide: 0 });
    }
  }

  render() {
    return null;
  }
}

export default WithStore(Restart, state => ({
  currentSlide: state.currentSlide,
  totalSlides: state.totalSlides,
  visibleSlides: state.visibleSlides
}));

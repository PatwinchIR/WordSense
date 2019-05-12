import React, { Component } from "react";
import "./App.css";
import { Link } from "react-router-dom";
import {H1, Icon} from "@blueprintjs/core";

class About extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return [
        <div id="banner">
        <span>
          <b>WordSense</b>
        </span>
          <Link to="/"><Icon icon="home" />  Home</Link>
        </div>,
        <H1> About</H1>
    ]
  }
}

export default About;

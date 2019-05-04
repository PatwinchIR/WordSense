import React, { Component } from "react";
import "./App.css";
import { Link } from "react-router-dom";

class About extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return [<div>About WordSense</div>, <Link to="/">Home</Link>];
  }
}

export default About;

import React, { Component } from "react";
import "./App.css";
import { H1 } from "@blueprintjs/core";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

class Welcome extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return [
      <div id="welcomebanner">
        <H1>WordSense</H1>
      </div>,
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/staff">Staff Login</Link>
        </li>
        <li>
          <Link to="/public">Public</Link>
        </li>
      </ul>
    ];
  }
}

export default Welcome;

import React, { Component } from "react";
import "./App.css";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Staff from "./Staff";
import About from "./About";
import Welcome from "./Welcome";
import Public from "./Public";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    document.title = "WordSense Project";
  }

  render() {
    return (
      <Router>
        <Route exact path="/" component={Welcome} />
        <Route path="/about" component={About} />
        <Route path="/staff" component={Staff} />
        <Route path="/public" component={Public} />
      </Router>
    );
  }
}

export default App;

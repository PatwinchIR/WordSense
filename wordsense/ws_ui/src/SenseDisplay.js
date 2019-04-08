import React, { Component } from "react";

class SenseDisplay extends Component {
    constructor(props) {
    super(props);

    this.state = {
        senses: [],
      selectedSenses: []
    };

    this.handleSensesChange = this.handleSensesChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  async loadSensesExamplesForGloss(token_id, gloss, pos) {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/get_senses?gloss=${gloss}&pos=${pos}`
      );
      const senses = await res.json();
      this.setState({
        senses: senses,
      });
    } catch (e) {
      console.log(e);
    }
  }

    componentWillReceiveProps(nextProps) {
        if (this.props.idGlossPos.token_id !== nextProps.idGlossPos.token_id) {
            this.loadSensesExamplesForGloss(nextProps.idGlossPos.token_id, nextProps.idGlossPos.gloss, nextProps.idGlossPos.pos);
        }
    }

  handleSensesChange(event) {
    const selectedSenses = this.state.selectedSenses;
    let index;
    if (event.target.checked) {
      this.state.selectedSenses.push(+event.target.value);
    } else {
      index = selectedSenses.indexOf(+event.target.value);
      selectedSenses.splice(index, 1);
    }

    this.setState({ selectedSenses: selectedSenses });
  }

  handleFormSubmit(event) {
    event.preventDefault();
    fetch("http://127.0.0.1:8000/api/save/", {
      method: "POST",
      headers: {
        'Accept': "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
          {
              "gloss_with_replacement": this.props.idGlossPos.gloss,
              "token": this.props.idGlossPos.token_id,
              "sense_offsets": this.state.selectedSenses,
              "participant": 1
          }
      )
    });
    console.log(
      "Your favorite flavor is: " + JSON.stringify(this.state.selectedSenses)
    );
  }

  render() {
        const isSenses = this.state.senses && this.state.senses.length > 0;

        if (isSenses) {

    return  (
      <div className="senses">
        <form onSubmit={this.handleFormSubmit}>
          {this.state.senses.map(sense_example => [
            <label>
              <input
                style={{ color: "blue" }}
                type="checkbox"
                value={sense_example.offset}
                onChange={this.handleSensesChange}
              />
              {sense_example.sense}
            </label>,
            <br />,
            <div>
              {sense_example.examples.map(example => [
                <span style={{ backgroundColor: "yellow" }}>{example}</span>,
                <br />
              ])}
            </div>
          ])}
          <input type="submit" />
        </form>
      </div>
    );
  }
  return null;
    }

}

export default SenseDisplay;

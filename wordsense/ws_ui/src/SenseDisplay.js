import React, { Component } from "react";
import {
  Intent,
  Toaster,
  Checkbox,
  Text,
  Button,
  HTMLTable
} from "@blueprintjs/core";
import {
  CarouselProvider,
  Slider,
  Slide,
  ButtonBack,
  ButtonNext,
  ButtonFirst,
  ButtonLast
} from "pure-react-carousel";

class SenseDisplay extends Component {
  constructor(props) {
    super(props);

    this.state = {
      senses: [],
      selectedSenses: [],
      saveStatus: "",
      saveDisabled: false,
      originalSenses: []
    };

    this.handleSensesChange = this.handleSensesChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  async loadSensesExamplesForGloss(token_id, gloss, pos) {
    try {
      const sensesRes = await fetch(
        `http://127.0.0.1:8000/api/get_senses?gloss=${gloss}&pos=${pos}`,
           {
        headers: {
          Authorization: `JWT ${localStorage.getItem('word_sense_token')}`
        }
      }
      );
      const tagsRes = await fetch(
        `http://127.0.0.1:8000/api/get_tags?gloss_with_replacement=${gloss}&token_id=${token_id}`,
           {
        headers: {
          Authorization: `JWT ${localStorage.getItem('word_sense_token')}`
        }
      }
      );
      const senses = await sensesRes.json();
      const tags = await tagsRes.json();
      this.setState({
        senses: senses,
        originalSenses: JSON.parse(JSON.stringify(tags)),
        selectedSenses: tags,
        saveStatus: tags.length > 0 ? "SAVED" : "SAVE",
        saveDisabled: tags.length === 0
      });
    } catch (e) {
      console.log(e);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.transcriptId !== nextProps.transcriptId) {
      this.setState({
        senses: []
      });
    }
    if (this.props.idGlossPos.token_id !== nextProps.idGlossPos.token_id) {
      this.loadSensesExamplesForGloss(
        nextProps.idGlossPos.token_id,
        nextProps.idGlossPos.gloss,
        nextProps.idGlossPos.pos
      );
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

    this.setState({
      selectedSenses: selectedSenses,
      saveStatus: arraysEqual(selectedSenses, this.state.originalSenses)
        ? "SAVED"
        : "SAVE",
      saveDisabled: selectedSenses.length === 0
    });
  }

  loadTags(offset) {
    if (this.state.selectedSenses.length === 0) {
      return false;
    } else {
      return this.state.selectedSenses.some(item => item === offset);
    }
  }

  handleFormSubmit(event) {
    event.preventDefault();
    fetch("http://127.0.0.1:8000/api/save/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
          Authorization: `JWT ${localStorage.getItem('word_sense_token')}`
      },
      body: JSON.stringify({
        gloss_with_replacement: this.props.idGlossPos.gloss,
        token: this.props.idGlossPos.token_id,
        sense_offsets: this.state.selectedSenses,
        participant: 1
      })
    }).then(response => {
      const toaster = Toaster.create(this.props);
      if (response.status === 202) {
        toaster.show({
          icon: "saved",
          intent: Intent.SUCCESS,
          message: (
            <>
              Sense offsets saved. <em>Yay!</em>
            </>
          )
        });
        this.setState({
          originalSenses: JSON.parse(JSON.stringify(this.state.selectedSenses)),
          saveStatus: "SAVED"
        });
        this.props.changeTagStatus(this.props.utteranceIndex);
      } else if (response.status === 302) {
        toaster.show({
          icon: "warning-sign",
          intent: Intent.WARNING,
          message: <>Sense offsets already saved.</>
        });
      } else {
        toaster.show({
          intent: Intent.DANGER,
          message: (
            <>
              <em>Oops! </em>Failed to save sense offsets.
            </>
          )
        });
      }
    });

    console.log(
      "Your favorite flavor is: " + JSON.stringify(this.state.selectedSenses)
    );
  }

  handleReset() {
    this.setState({
      selectedSenses: JSON.parse(JSON.stringify(this.state.originalSenses)),
      saveStatus: this.state.originalSenses.length === 0 ? "SAVE" : "SAVED"
    });
  }

  render() {
    const isSenses = this.state.senses && this.state.senses.length > 0;

    if (isSenses) {
      return (this.props.isLoggedIn &&
        <div id="senses">
          <Text className="currentWord">
            {this.props.idGlossPos.gloss}, {this.props.idGlossPos.pos}{" "}
          </Text>
          <Text>
            (Transcript ID: {this.props.transcriptId}, Utterance Index:{" "}
            {this.props.utteranceIndex - 4})
          </Text>
          <form onSubmit={this.handleFormSubmit}>
            <div className="bp3-card bp3-elevation-1">
              <HTMLTable
                id="senses-table"
                className="bp3-html-table bp3-interactive bp3-html-table-striped"
              >
                <thead>
                  <tr>
                    <th>Senses</th>
                    <th>Examples</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.senses.map(sense_example => [
                    <tr>
                      <td>
                        <Checkbox
                          style={{ color: "blue" }}
                          type="checkbox"
                          value={sense_example.offset}
                          onChange={this.handleSensesChange}
                          checked={this.loadTags(sense_example.offset)}
                          label={sense_example.sense}
                        />
                      </td>
                      <td>
                        <CarouselProvider
                          naturalSlideWidth={12}
                          naturalSlideHeight={1}
                          totalSlides={sense_example.examples.length}
                          currentSlide={0}
                          lockOnWindowScroll={false}
                          dragEnabled={false}
                          touchEnabled={false}
                        >
                          <Slider className="example-slider">
                            {sense_example.examples.map(example => (
                              <Slide>
                                <Text>{example}</Text>
                              </Slide>
                            ))}
                          </Slider>
                          <ButtonFirst>{"<<"}</ButtonFirst>
                          <ButtonBack>{"<"}</ButtonBack>
                          <ButtonNext>{">"}</ButtonNext>
                          <ButtonLast>{">>"}</ButtonLast>
                        </CarouselProvider>
                      </td>
                    </tr>
                  ])}
                </tbody>
              </HTMLTable>
            </div>
            <div id="control-buttons">
              <Button
                type="submit"
                intent={
                  this.state.saveStatus === "SAVED" ? "success" : "primary"
                }
                text={this.state.saveStatus}
                disabled={
                  this.state.saveDisabled ||
                  this.state.saveStatus === "SAVED" ||
                  this.state.selectedSenses.length === 0
                }
              />
              <Button
                intent={"warning"}
                text={"RESET"}
                onClick={this.handleReset}
                disabled={arraysEqual(
                  this.state.selectedSenses,
                  this.state.originalSenses
                )}
              />
            </div>
          </form>
        </div>
      );
    }
    return null;
  }
}

function arraysEqual(_arr1, _arr2) {
  if (
    !Array.isArray(_arr1) ||
    !Array.isArray(_arr2) ||
    _arr1.length !== _arr2.length
  )
    return false;

  var arr1 = _arr1.concat().sort();
  var arr2 = _arr2.concat().sort();

  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
}

export default SenseDisplay;

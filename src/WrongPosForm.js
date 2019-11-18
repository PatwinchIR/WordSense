import React from "react";
import {
  Button,
  Text,
  RadioGroup,
  Radio,
  Intent,
  Toaster
} from "@blueprintjs/core";
import { BASE_URL, PUBLIC_URL } from "./Constants";
import cookie from "react-cookie";

class WrongPosForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedPos: ""
    };

    this.handleWrongPos = this.handleWrongPos.bind(this);
    this.handlePosChange = this.handlePosChange.bind(this);
  }

  handleWrongPos(event) {
    event.preventDefault();
    fetch(`${BASE_URL}/api/${this.props.isPublic ? PUBLIC_URL : ""}save/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: this.props.isPublic
          ? ""
          : `JWT ${localStorage.getItem("word_sense_token")}`,
        "X-CSRFToken": cookie.load("csrftoken")
      },
      body: JSON.stringify({
        gloss_with_replacement: this.props.idGlossPos.gloss,
        token: this.props.idGlossPos.token_id,
        transcript_id: this.props.transcriptId,
        sense_offsets: [],
        participant: this.props.participantId,
        fixed_pos: this.state.selectedPos,
        fingerprint: this.props.fingerprint,
        workerId: this.props.workerId,
        workUnitId: this.props.workUnitId,
        userType: this.props.userType
      })
    })
      .then(response => {
        const toaster = Toaster.create(this.props);
        if (response.status === 202) {
          toaster.show({
            icon: "saved",
            intent: Intent.SUCCESS,
            message: (
              <>
                Better POS Saved <em>Yay!</em>
              </>
            )
          });
          this.props.disableSenseSelection();
          this.props.changeTagStatus(
            this.props.utteranceIndex,
            this.props.tokenIndex
          );
          return response.json();
        } else {
          toaster.show({
            intent: Intent.DANGER,
            message: (
              <>
                <em>Oops! </em>Failed to save the pos.
              </>
            )
          });
          throw new Error("Unknown Error");
        }
      })
      .catch(error => console.log(error));
  }

  handlePosChange(value) {
    this.setState({ selectedPos: value });
  }

  render() {
    return [
      <Text className="wrongPosConfirm">
        Are you sure that you want to mark this POS as wrong? (You cannot UNDO
        this)
      </Text>,
      <Text className="choiceTitle">
        Your choice of part of speech for "{this.props.idGlossPos.gloss}":
      </Text>,

      <form
        onSubmit={e => this.handleWrongPos(e, this.state)}
        className="auth-form"
      >
        <RadioGroup
          onChange={e => this.handlePosChange(e.target.value)}
          selectedValue={
            this.state.selectedPos === ""
              ? this.props.idGlossPos.pos
              : this.state.selectedPos
          }
        >
          <Radio label="n" value="n" />
          <Radio label="v" value="v" />
          <Radio label="adj" value="adj" />
          <Radio label="adv" value="adv" />
          <Radio label="other" value="other" />
        </RadioGroup>
        <div className="actions">
          <Button
            intent={"none"}
            text={"Cancel"}
            onClick={this.props.handleWrongPosClose}
          />
          <Button
            intent={"success"}
            text={"Okay"}
            type="submit"
            disabled={
              this.state.selectedPos === "" ||
              this.state.selectedPos === this.props.idGlossPos.pos
            }
          />
        </div>
      </form>
    ];
  }
}

export default WrongPosForm;

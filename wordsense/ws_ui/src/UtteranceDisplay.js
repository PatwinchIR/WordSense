import React, { Component } from "react";

class UtteranceDisplay extends Component {
    constructor(props) {
        super(props);

        this.state = {
            clickedTokenId: "",
            clickedGloss: "",
            utterances: []
        };

        this.loadUtterancesForSelectedTranscript = this.loadUtterancesForSelectedTranscript.bind(
      this
    );
    }

      renderUtterances(rawUtterances) {
    const utterances = rawUtterances.reduce(
        (utterances, item) => {
          if (!utterances[item.utterance_id]) {
              utterances[item.utterance_id] = {
                  'speaker_role': item.speaker_role,
                  'id_gloss_pos': []
              }
          }
          utterances[item.utterance_id].id_gloss_pos.push({'gloss': item.gloss_with_replacement, 'pos': item.part_of_speech, 'token_id': item.id});
          return utterances;
        }, {}
    );
    const results = [];
    Object.keys(utterances)
        .sort((a, b) => (a - b))
        .forEach((v, i) => {
          results.push(utterances[v]);
    });
    return results;
  }

    async loadUtterancesForSelectedTranscript(transcriptID) {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/get_utterances?transcript_id=${transcriptID}`
      );
      const utterances = await res.json();
      this.setState({
        utterances: this.renderUtterances(utterances)
      });
    } catch (e) {
      console.log(e);
    }
  }

  componentWillReceiveProps(nextProps) {
        if (this.props.selectedTranscriptID !== nextProps.selectedTranscriptID) {
            this.loadUtterancesForSelectedTranscript(nextProps.selectedTranscriptID);
        }
    }

    render () {
        return <div>
          {this.state.utterances.map(
                item => (
                    [
                        <span> {item.speaker_role}:

                            {item.id_gloss_pos.map(
                                id_gloss_pos => {
                                    return id_gloss_pos.pos === 'n' ||
                                        id_gloss_pos.pos === 'v' ||
                                        id_gloss_pos.pos === 'adv' ||
                                        id_gloss_pos.pos === 'adj' ?
                                        (
                                            <span onClick={() => this.props.handleGlossClick(id_gloss_pos)} style={{cursor:'pointer', color:'red'}}>{id_gloss_pos.gloss} </span>
                                        ) :
                                        (
                                            <span>{id_gloss_pos.gloss} </span>
                                        )
                                }
                                )}
                        </span>, <br/>
                    ]
                )
            )
        }
        </div>
    }
}

export default UtteranceDisplay;

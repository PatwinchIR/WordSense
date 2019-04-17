import React, { Component } from "react";
import { WithStore } from 'pure-react-carousel';

class Utterance extends Component {
    constructor(props) {
        super(props);

        this.state = {
            active: false
        }
    }

    changeUtteranceStyle() {
         if ((this.props.index === this.props.currentSlide + 4 )) {
             return "currentFocus";
         } else {
             return null;
         }
    }

    componentDidUpdate() {
        if ((this.props.index === this.props.currentSlide + 4 )) {
            this.props.setDisplayFocus(this.props.utterance, this.props.index);
         } else {
         }
    }

    componentDidMount() {
        if ((this.props.index === this.props.currentSlide + 4 )) {
            this.props.setDisplayFocus(this.props.utterance, this.props.index);
         } else {
         }
    }


    render () {
        const utterance = this.props.utterance;

        return [<div id="utterance" className={this.changeUtteranceStyle()}> {utterance.speaker_role}{utterance.speaker_role === "" ? "" : ": "}

                            {utterance.id_gloss_pos.map(
                                id_gloss_pos => {
                                    return id_gloss_pos.pos === 'n' ||
                                        id_gloss_pos.pos === 'v' ||
                                        id_gloss_pos.pos === 'adv' ||
                                        id_gloss_pos.pos === 'adj' ?
                                        (
                                            <span
                                                onClick={
                                                    () => {
                                                        this.props.handleGlossClick(id_gloss_pos);
                                                        if (this.props.index !== this.props.currentSlide + 4) {
                                                            this.props.setDisplayFocus(this.props.utterance, this.props.index);
                                                            this.props.carouselStore.setStoreState({currentSlide: this.props.index - 4})
                                                        }
                                                    }
                                                }
                                                style={{cursor:'pointer', color:'red'}}
                                            >
                                                {id_gloss_pos.gloss} </span>
                                        ) :
                                        (
                                            <span>{id_gloss_pos.gloss} </span>
                                        )
                                }
                                )}
                        </div>, <br />]
    }
}

// export default Utterance;

export default WithStore(Utterance, state => ({
    currentSlide: state.currentSlide,
    step: state.step
}))

import React from 'react';
import qs from 'qs';

function cleanSoundName(soundName) {
  return soundName.replace('.mp3', '');
}

export default class PlaySlackSound extends React.Component {
  constructor() {
    super();

    this.state = {
      disabled: false
    };

    this.playSlackSound = this.playSlackSound.bind(this);
  }

  playSlackSound() {
    fetch('https://slack.com/api/chat.postMessage?' + qs.stringify({
        token: this.props.accessToken,
        channel: 'sounds',
        text: 'play ' + cleanSoundName(this.props.soundName),
        as_user: 1
      }), {
      method: 'get',
    });
    this.setState({disabled: true});
    setTimeout(() => {
      this.setState({disabled: false});
    }, 3000)
  }

  render() {
    return (
      <button onClick={this.playSlackSound} className="btn btn-primary" disabled={this.state.disabled}>
        Play that funky music
      </button>
    );
  }
}
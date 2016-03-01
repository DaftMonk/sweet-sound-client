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

    this.onSendToSlack = this.onSendToSlack.bind(this);

    // refactor to use redux
    window.addEventListener('sendToSlack', this.onSendToSlack);
  }

  componentWillUnmount() {
    window.removeEventListener('sendToSlack', this.onSendToSlack);
  }

  onSendToSlack() {
    console.log('heey');
    if(this.state.disabled) {
      return;
    }


    fetch('https://slack.com/api/chat.postMessage?' + qs.stringify({
        token: this.props.accessToken,
        channel: 'sounds',
        text: 'play ' + cleanSoundName(this.props.soundName),
        as_user: 1
      }), {
      method: 'get',
    });

    this.setState({disabled: true});

    // delay spamming slack
    setTimeout(() => {
      this.setState({disabled: false});
    }, 3000)
  }

  onClick() {
    let event = new window.CustomEvent('sendToSlack');
    window.dispatchEvent(event);
  }

  render() {
    return (
      <button onClick={this.onClick} className="btn btn-primary" disabled={this.state.disabled}>
        Play that funky music
      </button>
    );
  }
}
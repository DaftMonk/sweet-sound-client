import React from 'react';
import SoundLib from '../lib/SoundLib';

export default class PreviewSound extends React.Component {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
    this.onPlaySound = this.onPlaySound.bind(this);

    // refactor to use redux
    window.addEventListener('playSound', this.onPlaySound);
  }

  componentWillUnmount() {
    window.removeEventListener('playSound', this.onPlaySound);
  }

  onPlaySound() {
    if(this.props.downloadUrl) {
      SoundLib.playSound(this.props.downloadUrl, gapi.auth.getToken().access_token);
    }
  }

  onClick() {
    let event = new window.CustomEvent('playSound');
    window.dispatchEvent(event);
  }

  render() {
    return (
      <button onClick={this.onClick}>Preview Sound</button>
    );
  }
}
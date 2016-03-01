import React from 'react';
import SoundLib from '../lib/SoundLib';

export default class PreviewSound extends React.Component {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
    this.onPlaySound = this.onPlaySound.bind(this);
    this.onStopSound = this.onStopSound.bind(this);

    // refactor to use redux
    window.addEventListener('playSound', this.onPlaySound);
    window.addEventListener('stopSound', this.onStopSound);;
  }

  componentWillUnmount() {
    window.removeEventListener('playSound', this.onPlaySound);
    window.removeEventListener('stopSound', this.onStopSound);
  }

  onPlaySound() {
    if(this.props.downloadUrl) {
      SoundLib.playSound(this.props.downloadUrl, gapi.auth.getToken().access_token);
    }
  }

  onStopSound() {
    SoundLib.stopSound();
  }

  onClick() {
    let event = new window.CustomEvent('playSound');
    window.dispatchEvent(event);
  }

  render() {
    return (
      <div>
        <button className="btn preview-sound-btn" onClick={this.onClick}>
          <span className="ion-volume-medium"></span>
        </button>
      </div>
    );
  }
}
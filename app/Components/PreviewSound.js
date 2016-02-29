import React from 'react';
import SoundLib from '../lib/SoundLib';

export default class PreviewSound extends React.Component {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    SoundLib.playSound(this.props.downloadUrl, gapi.auth.getToken().access_token);
  }

  render() {
    return (
      <button onClick={this.onClick}>Preview Sound</button>
    );
  }
}
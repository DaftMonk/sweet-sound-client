import React from 'react';

import Header from './Components/Header';
import AuthDrive from './Components/AuthDrive';
import {HotKeys} from 'react-hotkeys';


const map = {
  'playSound': 'command+enter',
  'sendToSlack': 'shift+enter',
  'stopSound': 'esc'
};

module.exports = React.createClass({
  displayName: 'App',

  render: function () {
    return (
      <HotKeys keyMap={map}>
        <div className="container">
          <div className="row">
            <div className="center-form panel">
              <div className="panel-body">
                  <Header/>
                  <AuthDrive/>
              </div>
            </div>
          </div>
        </div>
      </HotKeys>
    )
  }

});
import React from 'react';
import Favicon from 'react-favicon';

import Header from './Components/Header';
import AuthDrive from './Components/AuthDrive';

var faviconUrl = require('./Assets/favicon.ico');

module.exports = React.createClass({
  displayName: 'App',

  render: function () {
    return (
      <div className="container">
        <div className="row">
          <div className="center-form panel">
            <div className="panel-body">
                <Header/>
                <AuthDrive/>
                <Favicon url={ faviconUrl }/>
            </div>
          </div>
        </div>
      </div>)
  }

});
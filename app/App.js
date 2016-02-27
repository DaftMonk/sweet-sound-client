var React = require('react');

var Header = require('./Components/Header');
var Content = require('./Components/Content');
var AuthDrive = require('./Components/AuthDrive');
var Favicon = require('react-favicon');

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
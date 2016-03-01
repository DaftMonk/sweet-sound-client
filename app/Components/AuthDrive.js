import Promise from 'bluebird';
import React from 'react';
import googleApiLoader from '../Lib/GoogleAPILoader';
import _ from 'lodash';
import SuggestionBox from './SuggestionBox';
import PreviewSound from './PreviewSound';
import AuthSlack from './AuthSlack';
import PlaySlackSound from './PlaySlackSound';
import Spinner from 'react-spinkit';
import {HotKeys} from 'react-hotkeys';

var walkFilePages = function(request) {
  return new Promise((resolve) => {
    retrieveRecursiveFiles(request, [], resolve)
  });
};

var retrieveRecursiveFiles = function(request, arr, done) {
  return request.execute((resp) => {
    arr = arr.concat(resp.items);
    var nextPageToken = resp.nextPageToken;
    if (nextPageToken) {
      request = gapi.client.request({
        'path': '/drive/v2/files',
        'method': 'GET',
        'pageToken': nextPageToken,
        'params': {
          'q': 'trashed = false'
        }
      });
      retrieveRecursiveFiles(request, arr);
    } else {
      done(arr);
    }
  });
}


var retrieveAllFiles = function(folderId)  {
  var initialRequest = gapi.client.request({
    'path': '/drive/v2/files',
    'method': 'GET',
    'params': {
      'q': "trashed = false and '" + folderId + "' in parents"
    }
  });
  return walkFilePages(initialRequest);
}

function getSubFolders(folderId) {
  var initialRequest = gapi.client.request({
    'path': '/drive/v2/files',
    'method': 'GET',
    'params': {
      'q': "trashed = false and '" + folderId + "' in parents and mimeType='application/vnd.google-apps.folder'"
    }
  });
  return walkFilePages(initialRequest);
}

module.exports = React.createClass({

    getInitialState: function() {
      return {
        isAuthorized: false,
        selectedSound: {},
        folders: []
      };
    },

    componentDidMount: function () {
      var _this = this;

      googleApiLoader.apiReady.then(() => {
        _this.setState({isAuthorized: true});

        return gapi.client.drive.files.list({
          'q': "mimeType='application/vnd.google-apps.folder' and name='sounds'",
          'pageSize': 10,
          'fields': "nextPageToken, files(id, name)"
        }).execute((resp) => {
          var folders = resp.files;
          var soundFolderId = folders[0].id;

          var getSoundFolders = getSubFolders(soundFolderId).then((folders) => {
            return Promise.reduce(folders, function(soundFolders, folder) {
              return Promise.delay(100).then(() => {
                return retrieveAllFiles(folder.id).then(function (files) {
                  folder.files = files;
                  soundFolders.push(folder);
                  return soundFolders;
                })
              });
            }, []);
          });

          getSoundFolders.then((soundFolders) => {
            _this.setState({folders: soundFolders});
          })
        });
      });
    },

    signIn() {
      googleApiLoader.login();
    },

    onSuggestionSelected(e, data) {
      this.setState({ selectedSound: data.suggestion });
    },

    onAuthenticatedWithSlack(resp) {
      this.setState({slackAccessToken: resp.access_token});
    },

    playSound() {
      setTimeout(function() {
        let event = new window.CustomEvent('playSound');
        window.dispatchEvent(event);
      });
    },

    sendToSlack() {
      setTimeout(function() {
        let event = new window.CustomEvent('sendToSlack');
        window.dispatchEvent(event);
      });
    },

    stopSound() {
      setTimeout(function() {
        let event = new window.CustomEvent('stopSound');
        window.dispatchEvent(event);
      });
    },

    clickHelp() {
      alert(`
Login with Slack to play sounds

Search:
 ":" to get all sound files
 "folder:" to get all sound files in a folder

Shortcuts:
 * command+enter to preview a sound
 * esc to Stop a Preview
 * shift+enter to play a sound on slack`);
    },

    render: function () {

      const handlers = {
        'playSound': this.playSound,
        'sendToSlack': this.sendToSlack,
        'stopSound': this.stopSound
      };

      var spinner;
      if(this.state.isAuthorized && !this.state.folders.length) {
        spinner = (<div className="help-container"><Spinner spinnerName='three-bounce' noFadeIn={true}/> Loading drive files...</div>);
      }

      if (!this.state.isAuthorized) {
        return (
          <div>
            <div className="help-container">Sign in with your Google Drive account to search sound files</div>
            <div className="btn-container">
              <button className="btn btn-block btn-google-plus" onClick={this.signIn}>
                <span className="ion-social-googleplus"></span>Sign in with Google
              </button>
            </div>
         </div>
        );
      }

      let slackAuth = (
        <div className="btn-container pull-right">
          <AuthSlack onAuthenticated={this.onAuthenticatedWithSlack}/>
        </div>
      );

      let helpBtn = (
        <div className="btn-container">
          <button className="btn btn-default" onClick={this.clickHelp}>
            <span className="ion-help"></span>
          </button>
        </div>
      )

      let playSound;
      if(this.state.slackAccessToken) {
        playSound = (
          <div className="btn-container pull-right">
            <PlaySlackSound accessToken={this.state.slackAccessToken} soundName={this.state.selectedSound.title}/>
          </div>);
        slackAuth = null;
      }

        return (<div>
          {spinner}
          <div className="content-container">
            <HotKeys handlers={handlers}>
              <SuggestionBox folders={this.state.folders} onSuggestionSelected={this.onSuggestionSelected} onKeyDown={this.onSuggestionKeyDown}/>
            </HotKeys>
            <PreviewSound downloadUrl={this.state.selectedSound.downloadUrl} />
            {playSound}
            {slackAuth}
            {helpBtn}
          </div>
        </div>)

    }
});

import Promise from 'bluebird';
import React from 'react';
import googleApiLoader from '../Lib/GoogleAPILoader';
import _ from 'lodash';
import SuggestionBox from './SuggestionBox';
import PreviewSound from './PreviewSound';

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

    onSuggestionKeyDown(e) {
      // enter key
      if (e.keyCode == 13) {
        // ugly hack, refactor with redux
        setTimeout(function() {
          let event = new window.CustomEvent('playSound');
          window.dispatchEvent(event);
        });
      }
    },

    render: function () {
      var toggleLoginButton = (
        <button className="btn btn-block btn-google-plus" onClick={this.signIn}>
          <span className="ion-social-googleplus"></span>Sign in with Google
        </button>
      );

      if (this.state.isAuthorized) {
        return (<div>
          <SuggestionBox folders={this.state.folders} onSuggestionSelected={this.onSuggestionSelected} onKeyDown={this.onSuggestionKeyDown}/>

          preview sound <PreviewSound downloadUrl={this.state.selectedSound.downloadUrl} />
        </div>)
      }
      else {
        return toggleLoginButton;
      }

    }
});

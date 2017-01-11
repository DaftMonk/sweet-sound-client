import Promise from 'bluebird';
import React from 'react';
import googleApiLoader from '../Lib/GoogleApiLoader';
import _ from 'lodash';
import SuggestionBox from './SuggestionBox';
import PreviewSound from './PreviewSound';
import AuthSlack from './AuthSlack';
import PlaySlackSound from './PlaySlackSound';
import Spinner from 'react-spinkit';
import {HotKeys} from 'react-hotkeys';
import swal from 'exports?swal!sweetalert2/src/sweetalert2.js';

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

    maxCacheAge: 5 * 1000 * 60, // 5 min
    maxSlackAge: 24 * 60 * 60 * 1000, // 1 day

    getInitialState: function() {
      return {
        isAuthorized: false,
        selectedSound: {},
        folders: []
      };
    },

    componentDidMount: function () {
      var _this = this
      googleApiLoader.apiReady.then(() => {
        _this.setState({isAuthorized: true})
        return _this.fetchFiles()
      });

      _this.checkForSavedSlackToken()
    },

    queueFileRefresh() {
      setTimeout(this.fetchFiles, this.maxCacheAge)
    },


    fetchFiles() {
      var maxCacheMinutes = this.maxCacheAge / (1000 * 60)
      var oldestAllowedCache = (new Date()).setMinutes((new Date()).getMinutes() - maxCacheMinutes)
      var folderJson = localStorage.getItem('driveFileCache')
      var cacheAge = localStorage.getItem('driveFileCacheTime')
      var cacheIsStale = new Date(cacheAge) < oldestAllowedCache

      if (!cacheAge || !folderJson) {
        console.log('No valid cache, fetching new file listing')
        return this.fetchFilesFromGoogle()
      }


      console.log('Files loaded from localstorage!')
      this.setState({folders: JSON.parse(folderJson)})

      // Cache is old.. but we don't have any files yet
      // start google fetch, but use cache for now
      if (cacheIsStale && !this.state.folders.length) {
        console.log('Queuing Google fetch because the cache is stale...')
        this.fetchFilesFromGoogle()
      } else {
        this.queueFileRefresh()
      }
    },


    fetchFilesFromGoogle() {
      var _this = this
      var deletableFields = [
        'appDataContents',
        'copyable',
        'editable',
        'etag',
        'explicitlyTrashed',
        'iconLink',
        'kind',
        'labels',
        'lastModifyingUser',
        'lastViewedByMeDate',
        'markedViewedByMeDate',
        'mimeType',
        'modifiedByMeDate',
        'modifiedDate',
        'ownerNames',
        'owner',
        'owners',
        'version',
        'parents',
        'quotaBytesUsed',
        'shared',
        'spaces',
        'userPermission',
        'writersCanShare',
        'alternateLink',
        'fileExtension',
        'headRevisionId',
        'md5Checksum',
        'originalFilename',
        'selfLink',
        'webContentLink'
      ]

      function cleanFileList(list) {
        return list.map(function(file) {
          deletableFields.forEach(function(deletableField) {
            if (file[deletableField]) {
              delete file[deletableField]
            }
          })
          return file
        })
      }


      if (_this.state.loadingFromGoogle) {
        console.log('Alreading loading from Google... ignoring request')
        return
      }
      _this.setState({loadingFromGoogle: true});
      return gapi.client.drive.files.list({
        'q': "mimeType='application/vnd.google-apps.folder' and name='sounds, -slack-sounds'",
        'pageSize': 10,
        'fields': "nextPageToken, files(id, name)"
      }).execute((resp) => {
        var folders = cleanFileList(resp.files)
        
        var soundFolderId = folders[0].id

        var getSoundFolders = getSubFolders(soundFolderId).then((folders) => {
          return Promise.reduce(folders, function(soundFolders, folder) {
            return Promise.delay(100).then(() => {
              return retrieveAllFiles(folder.id).then(function (files) {
                
                folder.files = cleanFileList(files)
                soundFolders.push(folder)
                return soundFolders
              })
            });
          }, []);
        });

        getSoundFolders.then((soundFolders) => {
          console.log('Saving files to localstorage...')
          localStorage.setItem('driveFileCache', JSON.stringify(soundFolders))
          localStorage.setItem('driveFileCacheTime', new Date())
          _this.queueFileRefresh()
          _this.setState({
            folders: soundFolders,
            loadingFromGoogle: false
          });
        })
      });
    },

    checkForSavedSlackToken() {
      var maxCacheMinutes = this.maxSlackAge / (1000 * 60)
      var token = localStorage.getItem('slackAccessToken')
      var tokenSavedString = localStorage.getItem('slackAccessTokenTime')
      var oldestAllowedCache = (new Date()).setMinutes((new Date()).getMinutes() - maxCacheMinutes)
      var cacheIsStale = new Date(tokenSavedString) < oldestAllowedCache

      if (!token || !tokenSavedString) {
        return
      }

      if (cacheIsStale) {
        console.log('Local Slack token is older than a day, ignoring...')
        localStorage.removeItem('slackAccessToken')
        localStorage.removeItem('slackAccessTokenTime')
        return
      }

      console.log('Slack token loaded from localstorage!')
      this.setState({slackAccessToken: token})
    },

    signIn() {
      googleApiLoader.login();
    },

    onSuggestionSelected(e, data) {
      this.setState({ selectedSound: data.suggestion });
    },

    onAuthenticatedWithSlack(resp) {
      console.log('Saving Slack token to localstorage...');
      localStorage.setItem('slackAccessToken', resp.access_token)
      localStorage.setItem('slackAccessTokenTime', new Date())
      this.setState({slackAccessToken: resp.access_token})
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
      swal({   title: "Sound Client Help!",   html: `
        <div>Login with Slack to play sounds</div>
        <br>
        <div class="help-list">Search:
          <ul>
            <li><strong>":"</strong> to get all sound files</li>
            <li><strong>"&lt;folder&gt;:"</strong> to get all sound files in a folder</li>
          </ul>
        </div>
        <div class="help-list">Shortcuts:
          <ul>
            <li><strong>command+enter</strong> to preview a sound</li>
            <li><strong>esc</strong> to stop a preview</li>
            <li><strong>shift+enter</strong> to play a sound on slack</li>
          </ul>
        </div>
      `});
    },

    render: function () {

      const handlers = {
        'playSound': this.playSound,
        'sendToSlack': this.sendToSlack,
        'stopSound': this.stopSound
      };

      var spinner;
      if (this.state.isAuthorized && !this.state.folders.length) {
        spinner = (
          <div className="help-container">
            <Spinner spinnerName='three-bounce' noFadeIn={true}/> Loading drive files...
          </div>
        );
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
          <div className="btn-group" role="group">
            <button className="btn btn-default" onClick={this.clickHelp}>
              <span className="ion-help"></span>
            </button>
            <button className="btn btn-default btn-fetch-google" onClick={this.fetchFilesFromGoogle}>
              {this.state.loadingFromGoogle ?
                <Spinner spinnerName='cube-grid'/> :
                <span className="ion-loop"></span>}
            </button>
          </div>
        </div>
      )

      let playSound;
      if (this.state.slackAccessToken) {
        playSound = (
          <div className="btn-container pull-right">
            <PlaySlackSound
              accessToken={this.state.slackAccessToken}
              soundName={this.state.selectedSound.title}/>
          </div>);
        slackAuth = null;
      }

      return (
        <div>
          {spinner}
          <div className="content-container">
            <HotKeys handlers={handlers}>
              <SuggestionBox
                folders={this.state.folders}
                onSuggestionSelected={this.onSuggestionSelected}
                onKeyDown={this.onSuggestionKeyDown}/>
            </HotKeys>
            <PreviewSound downloadUrl={this.state.selectedSound.downloadUrl}/>
            {playSound}
            {slackAuth}
            {helpBtn}
          </div>
        </div>
      )
    }
});

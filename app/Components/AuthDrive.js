import Promise from 'bluebird';
import React from 'react';
import googleApiLoader from '../Lib/GoogleAPILoader';
import _ from 'lodash';

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

function delay(ms) {
  return new Promise(function (v) {
    setTimeout(v, ms);
  });
}

module.exports = React.createClass({

    getInitialState: function() {
      return { serverData: null };
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

          var fileTree = getSubFolders(soundFolderId).then((folders) => {
            let i = 0;
            return Promise.reduce(folders, function(tree, folder) {
              i++;
              return delay(i * 100).then(() => {
                return retrieveAllFiles(folder.id).then(function (files) {
                  tree[folder.title] = folder;
                  tree[folder.title]._files = files;
                  return tree;
                })
              });
            }, {});
          });

          fileTree.then((tree) => {
            console.log(tree);
          })
        });
        //.then(resp => {

        //  return googleApiLoader.execute(() => {
        //    return gapi.client.drive.files.list({
        //      'q': "mimeType='audio/mpeg'"
        //    });
        //  }).then(resp => {
        //    var files = resp.files;
        //    console.log(resp);
        //    _this.setState({files: files});
        //  });
        //});
      });
    },

    signIn: function () {
      googleApiLoader.login();
    },

    render: function () {
      var toggleLoginButton = (
        <button className="btn btn-block btn-google-plus" onClick={this.signIn}>
          <span className="ion-social-googleplus"></span>Sign in with Google
        </button>
      );

      if (this.state.isAuthorized) {
        return (<div>
           You're now free to use the Google APIs!
        </div>)
      }
      else {
        return toggleLoginButton;
      }

    }
});

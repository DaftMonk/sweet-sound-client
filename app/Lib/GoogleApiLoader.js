/* global gapi */

import Promise from 'bluebird';

var appSettings = require("json!../../google_app_settings.json");
var EventEmitter = require('events').EventEmitter;


let googleApiEvents = new EventEmitter();
let isAuthorizing = false;
let isAuthorized = false;
let resolveClientsAvailable;
let allClientsAvailable = new Promise(function (resolve) {
  resolveClientsAvailable = resolve;
});
let auth2;

function gapiLoaded(callback) {
  var hasgapi = function () {
    if (typeof (gapi) !== "undefined" && gapi.client) {
      callback();
    }
    else {
      window.setTimeout(function () {
        hasgapi();
      }, 50);
    }
  }

  hasgapi();
}

gapiLoaded(tryAuthorize);


function tryAuthorize() {
  googleApiEvents.emit('authorization-request');
  isAuthorizing = true;

  gapi.load('auth2', function () {
    auth2 = gapi.auth2.init({
      client_id: appSettings.client_id,
      scopes: appSettings.scopes.join(' '),
    });
  });
}

function whenAuthenticated(authResult) {
  isAuthorizing = false;
  if (authResult && !authResult.error) {
    let clientsLoaded = 0;

    googleApiEvents.emit('authorization-success');
    isAuthorized = true;

    var clientLoaded = function clientLoaded() {
      clientsLoaded++;
      if(appSettings.libraries.length === clientsLoaded) {
        googleApiEvents.emit('clients-loaded');
        resolveClientsAvailable(true);
      }
    };

    for (var i = 0; i < appSettings.libraries.length; i++) {
      var client = appSettings.libraries[i];
      gapi.client.load(client.name, client.version, clientLoaded);
    }
  } else {
    isAuthorized = false;
    googleApiEvents.emit('authorization-failure');
  }
}

/**
 * Executes a Google API request (anything with an execute method), turning
 * it into a promise. The promise is rejected if the response contains an
 * error field, resolved otherwise.
 */
function execute(request) {
  return allClientsAvailable.then(() => {
    return new Promise((resolve, reject) => {
      request().execute(response => {
        if (response.error) {
          console.error('API Error', response.error);
          reject(response.error);
          return;
        }
        resolve(response);
      });
    });
  });
}

function login() {
  var options = new gapi.auth2.SigninOptionsBuilder({
    scopes: appSettings.scopes.join(' ')
  });

  isAuthorizing = true;
  auth2.signIn(options).then(function (success) {
    isAuthorizing = false;
    isAuthorized = true;
  }, function (fail) {
    isAuthorizing = false;
    isAuthorized = true;
  });
}

module.exports = {
  events: googleApiEvents,
  execute,
  login,
  isAuthorizing,
  isAuthorized
};
/* global gapi */

import Promise     from 'bluebird';
import appSettings from '../../google_app_settings.js';

let allClientsAvailable = false;

let apiReadyResolve;

const apiReady = new Promise((resolve, reject) => {
  apiReadyResolve = resolve;
})

window.checkAuth = function() {
  login(true).catch(function(err) {
  });
};

/**
 * Load Client libraries
 * @returns {Promise}
 */
const loadClients = Promise.promisify(function(done) {
  let clientsLoaded = 0;

  if(allClientsAvailable) {
    done(null, true);
  }

  var clientLoaded = function clientLoaded() {
    clientsLoaded++;
    if(appSettings.libraries.length === clientsLoaded) {
      allClientsAvailable = true;
      done(null, true);
    }
  };

  for (var i = 0; i < appSettings.libraries.length; i++) {
    var client = appSettings.libraries[i];
    gapi.client.load(client.name, client.version, clientLoaded);
  }
});


/**
 * Executes a Google API request (anything with an execute method), turning
 * it into a promise. The promise is rejected if the response contains an
 * error field, resolved otherwise.
 * @returns {Promise}
 */
const execute = function (request) {
  return new Promise((resolve, reject) => {
    request().execute(response => {
      if (response.error) {
        console.error('API Error', response.error);
        reject(response.error);
      }
      resolve(response);
    });
  });
};

/**
 * Login
 * @returns {Promise}
 */
const login = function (immediate) {
  return new Promise(function(resolve, reject) {
    gapi.auth.authorize({
      'client_id': appSettings['client_id'],
      'scope': appSettings.scopes.join(' '),
      'immediate': immediate
    }, function(authResult) {
      if (authResult && !authResult.error) {
        loadClients().then(() => {
          apiReadyResolve(true);
          resolve(authResult)
        });
      } else {
        reject(new Error('Unable to authenticate'));
      }
    });
  });
};

const loadScript = function() {
  var script = window.document.createElement('script');
  self.script = script;
  script.type = 'text/javascript';
  script.src = 'https://apis.google.com/js/client.js?onload=checkAuth';
  window.document.body.appendChild(script);
};

loadScript();

module.exports = {
  apiReady,
  execute,
  login
};
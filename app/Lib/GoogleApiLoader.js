/* global gapi */

import Promise     from 'bluebird';
import appSettings from 'json!../../google_app_settings.json';

let currentUser = null;

let allClientsAvailable = false;

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
 * Get Current User
 * @returns {Promise}
 */
const getCurrentUser = Promise.promisify(function (done) {
  getAuth2().then((auth2) => {
    auth2.currentUser.listen(function (user) {
      done(null, user);
    });
  });
});


/**
 * Executes a Google API request (anything with an execute method), turning
 * it into a promise. The promise is rejected if the response contains an
 * error field, resolved otherwise.
 * @returns {Promise}
 */
const execute = function (request) {
  return loadLibraries().then(() => {
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
};

/**
 * Login
 * @returns {Promise}
 */
const login = function () {
  return getAuth2().then((auth2) => {
    let options = new gapi.auth2.SigninOptionsBuilder({
      scopes: appSettings.scopes.join(' ')
    });

    return auth2.signIn(options);
  });
};

/**
 * gapi client loaded
 * @returns {Promise}
 */
const gapiLoaded = Promise.promisify(function (callback) {
  var checkGapi = function () {
    if (typeof (gapi) !== "undefined" && gapi.client) {
      callback();
    }
    else {
      window.setTimeout(function () {
        checkGapi();
      }, 50);
    }
  };

  checkGapi();
});

/**
 * Load gapi and client libaries
 * @returns {Promise}
 */
const loadLibraries = function() {
  return gapiLoaded().then(() => {
    return loadClients();
  });
};

loadLibraries().then(() => {

});

let auth2;
const getAuth2 = Promise.promisify(function(callback) {
  if(auth2) {
    callback(null, auth2);
  }
  gapi.load('auth2', function () {
    auth2 = gapi.auth2.init({
      client_id: appSettings.client_id,
      scopes: appSettings.scopes.join(' '),
    });
    callback(null, auth2);
  });
});

module.exports = {
  getCurrentUser,
  execute,
  login
};
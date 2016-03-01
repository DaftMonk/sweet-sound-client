/**
 * This code is mostly from WebAudiox
 *
 * @namespace definition of SoundLib
 * @type {object}
 */
var SoundLib = SoundLib || {}

// create WebAudio API context
var context = new AudioContext()

/**
 * definition of a lineOut
 * @constructor
 * @param  {AudioContext} context WebAudio API context
 */
SoundLib.LineOut = function (context) {
  var _this = this;
  // init this.destination
  this.destination = context.destination

  // this.destination to support muteWithVisibility
  var visibilityGain = context.createGain()
  visibilityGain.connect(this.destination)
  muteWithVisibility(visibilityGain)
  this.destination = visibilityGain

  // this.destination to support webAudiox.toggleMute() and webAudiox.isMuted
  var muteGain = context.createGain()
  muteGain.connect(this.destination)
  this.destination = muteGain
  this.isMuted = false
  this.toggleMute = function () {
    this.isMuted = this.isMuted ? false : true;
    muteGain.gain.value = this.isMuted ? 0 : 1;
  }.bind(this)

  //  to support webAudiox.volume
  var volumeNode = context.createGain()
  volumeNode.connect(this.destination)
  this.destination = volumeNode
  Object.defineProperty(this, 'volume', {
    get: function () {
      return volumeNode.gain.value;
    },
    set: function (value) {
      volumeNode.gain.value = value;
    }
  });

  return;

  //////////////////////////////////////////////////////////////////////////////////
  //		muteWithVisibility helper					//
  //////////////////////////////////////////////////////////////////////////////////
  /**
   * mute a gainNode when the page isnt visible
   * @param  {Node} gainNode the gainNode to mute/unmute
   */
  function muteWithVisibility(gainNode) {
    // shim to handle browser vendor
    var eventStr = (document.hidden !== undefined ? 'visibilitychange' :
      (document.mozHidden !== undefined ? 'mozvisibilitychange' :
        (document.msHidden !== undefined ? 'msvisibilitychange' :
          (document.webkitHidden !== undefined ? 'webkitvisibilitychange' :
              console.assert(false, "Page Visibility API unsupported")
          ))));
    var documentStr = (document.hidden !== undefined ? 'hidden' :
      (document.mozHidden !== undefined ? 'mozHidden' :
        (document.msHidden !== undefined ? 'msHidden' :
          (document.webkitHidden !== undefined ? 'webkitHidden' :
              console.assert(false, "Page Visibility API unsupported")
          ))));
    // event handler for visibilitychange event
    var callback = function () {
      var isHidden = document[documentStr] ? true : false
      gainNode.gain.value = isHidden ? 0 : 1
    }.bind(this)
    // bind the event itself
    document.addEventListener(eventStr, callback, false)
    // destructor
    _this.destroy = function () {
      document.removeEventListener(eventStr, callback, false)
    }
  }
}

/**
 * -- MODIFIED TO ACCEPT ACCESS TOKEN --
 *
 * Helper to load a buffer
 *
 * @param  {AudioContext} context the WebAudio API context
 * @param  {String} url     the url of the sound to load
 * @param  {Function} onLoad  callback to notify when the buffer is loaded and decoded
 * @param  {Function} onError callback to notify when an error occured
 */
SoundLib.loadBuffer = function (context, url, accessToken, onLoad, onError) {
  onLoad = onLoad || function (buffer) {
    }
  onError = onError || function () {
    }
  if (url instanceof Blob) {
    var request = new FileReader();
  } else {
    // modified to set auth token
    var request = new XMLHttpRequest()
    request.open('GET', url, true)
    if (accessToken) {
      request.setRequestHeader('Authorization', 'Bearer ' + accessToken)
    }
    request.responseType = 'arraybuffer'
  }
  // counter inProgress request
  SoundLib.loadBuffer.inProgressCount++
  request.onload = function () {
    context.decodeAudioData(request.response, function (buffer) {
      // counter inProgress request
      SoundLib.loadBuffer.inProgressCount--
      // notify the callback
      onLoad(buffer)
      // notify
      SoundLib.loadBuffer.onLoad(context, url, buffer)
    }, function () {
      // notify the callback
      onError()
      // counter inProgress request
      SoundLib.loadBuffer.inProgressCount--
    })
  }
  request.send()
}

/**
 * global onLoad callback. it is notified everytime .loadBuffer() load something
 * @param  {AudioContext} context the WebAudio API context
 * @param  {String} url     the url of the sound to load
 * @param {[type]} buffer the just loaded buffer
 */
SoundLib.loadBuffer.onLoad = function (context, url, buffer) {
}

/**
 * counter of all the .loadBuffer in progress. usefull to know is all your sounds
 * as been loaded
 * @type {Number}
 */
SoundLib.loadBuffer.inProgressCount = 0

let currentSound;

const playSound = function (url, token) {
  // Create lineOut
  var lineOut = new SoundLib.LineOut(context)

  // load a sound and play it immediatly
  SoundLib.loadBuffer(context, url, token, function (buffer) {
    if(currentSound) {
      currentSound.stop();
    }
    // init AudioBufferSourceNode
    var source = context.createBufferSource();
    currentSound = source;
    source.buffer = buffer
    source.connect(lineOut.destination)

    // start the sound now
    source.start(0);
  });
};

const stopSound = function() {
  if(currentSound) {
    currentSound.stop();
  }
};

export default {
  playSound,
  stopSound
};
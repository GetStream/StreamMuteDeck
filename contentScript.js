"use strict";

let isInMeeting = false;
let isMuted = false;
let isVideoStarted = false;
let isShareStarted = false;
let isRecordStarted = false;
let updateLoops = 0;

// get the websocket host and port from localstorage and reinitialise the websocket
let socket = null;
chrome.storage.sync.get({
  mutedeck_host: 'localhost',
  mutedeck_port: 3492
}, function(items) {
  let websocket_url = 'ws://' + items.mutedeck_host + ':' + items.mutedeck_port;
  console.log(websocket_url);
  socket = new ReconnectingWebSocket(websocket_url);

  socket.addEventListener('open', () => {
    console.log(`[open] Connected to MuteDeck`);

    // identify as a google meet plugin, so MD can send messages back
    const identify = {
      'source': 'google-meet-plugin',
      'action': 'identify'
    };
    socket.send(JSON.stringify(identify));

    sendGoogleMeetStatus();
  });

  socket.onclose = function(event) {
    if (event.wasClean) {
      console.log(`[close] Connection to MuteDeck closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
      console.log(`[close] Connection to MuteDeck closed unexpected, code=${event.code} reason=${event.reason}`);
    }
  };

  socket.onerror = function(error) {
    console.log(`[error] ${error.message}`);
  };

  socket.addEventListener('message', function(event) {
    console.log(`[extension] received event: ${event.data}`);
    var message = JSON.parse(event.data);
    if (message.action === 'toggle_mute') {
      toggleMute();
    } else if (message.action === 'toggle_video') {
      toggleVideo();
    } else if (message.action === 'toggle_share') {
      toggleShare();
    } else if (message.action === 'toggle_record') {
      toggleRecord();
    } else if (message.action === 'leave_meeting') {
      leaveCall();
    } else {
      console.log('Dont know this action: ' + message.action);
    }
  });
});

function toggleMute() {
  console.log('Muting?');

  let muteButton = document.querySelectorAll(".str-video__icon--mic")[0];
  if (muteButton) {
    console.log('Clicking mute button');
    muteButton.click();
  } else {
    let unmuteButton = document.querySelectorAll(".str-video__icon--mic-off")[0];
    if (unmuteButton) {
      console.log('Clicking unmute button');
      unmuteButton.click();
    }
  }
}

function toggleVideo() {
  let videoButton = document.querySelectorAll(".str-video__icon--camera")[0];
  if (videoButton) {
    console.log('Clicking video off button');
    videoButton.click();
  } else {
    let videoButton = document.querySelectorAll(".str-video__icon--camera-off")[0];
    if (videoButton) {
      console.log('Clicking video on button');
      videoButton.click();
    }
  }
}

function pressStopPresenting() {
  let stopButton = document.querySelector('ul[aria-label*="Presentation options"] > li');
  if (stopButton) {
    console.log('Clicking stop presenting button');
    stopButton.click();
  }
}

function toggleShare() {
  let presentButton = document.querySelector(".str-video__icon--screen-share-off");
  if (presentButton) {
    console.log('Clicking present now button');
    presentButton.click();
  } else {
    let presentButton = document.querySelector(".str-video__icon--screen-share-on");
    if (presentButton) {
      console.log('Clicking unshare button');
      presentButton.click();
      setTimeout(pressStopPresenting, 500);
    }
  }
}

function pressConfirmationButton() {
  console.log('pressConfirmationButton');
  let readyButton = document.querySelector('button[data-mdc-dialog-button-default]');
  if (readyButton) {
    console.log('Clicking confirmation button');
    readyButton.click();
  }
}

function pressStartRecordButton() {
  console.log('pressStartRecordButton');
  let recordButton = document.querySelector('button[aria-label="Start recording"]');
  if (recordButton) {
    console.log('Clicking start recording');
    recordButton.click();
    setTimeout(pressConfirmationButton, 250);
  }
}

function pressStopRecordButton() {
  console.log('pressStopRecordButton');
  let recordButton = document.querySelector('button[aria-label="Stop recording"]');
  if (recordButton) {
    console.log('Clicking stop recording');
    recordButton.click();
    setTimeout(pressConfirmationButton, 250);
  }
}

function pressRecordToggleButtons() {
  console.log('pressRecordToggleButtons');
  // get the menu
  let ul = document.querySelector('ul[aria-label="Call options"');
  if (!ul) {
    console.log('Unable to find recording ul');
    return;
  }
  // then the list items
  let lis = ul.getElementsByTagName('li');
  // record option is the second one from the top
  let record_li = lis[1];
  if (!record_li) {
    console.log('Unable to find recording li');
    return;
  }

  if (record_li.innerHTML.includes("Record meeting")) {
    record_li.click();
    setTimeout(pressStartRecordButton, 350);
  } else if (record_li.innerHTML.includes("Stop recording")) {
    record_li.click();
    setTimeout(pressStopRecordButton, 350);
  } else {
    // click the menu again to close it as there's no recording option
    pressMoreOptionsButton();
  }
}

function pressMoreOptionsButton() {
  let moreButton = document.querySelector('button[aria-label*="More options"]');
  if (moreButton) {
    console.log('Clicking more options button');
    moreButton.click();
    return true;
  } else {
    console.log('Unable to find the More Options button where recording is hidden.');
    return false;
  }
}

function toggleRecord() {
  let moreButtonPressed = pressMoreOptionsButton();
  if (moreButtonPressed) {
    setTimeout(pressRecordToggleButtons, 250);
  }
}

function leaveCall() {
  let leaveButton = document.querySelectorAll(".str-video__icon--call-end")[0];
  if (leaveButton) {
    console.log('Clicking leave call button');
    leaveButton.click();
  }
}

function updateGoogleMeetStatus() {
  let changed = false;

  // check if the meeting info icon is on the canvas. if yes, then we're in a meeting.
  let meetingInfo = document.querySelectorAll('.str-video__call-header-title');
  if (meetingInfo.length > 0) {
    if (!isInMeeting) {
      changed = true;
    }
    isInMeeting = true;

    let offMuteButton = document.querySelectorAll(".str-video__icon--mic-off")[0];
    let onMuteButton = document.querySelectorAll(".str-video__icon--mic")[0];
    if (offMuteButton || onMuteButton) {
      if (offMuteButton) {
        isMuted = true;
        changed = true;
      } else if (onMuteButton) {
        isMuted = false;
        changed = true;
      }
    } else {
      console.log('Unable to find mute button.');
    }

    // it's weird that google is also using 'data-is-muted' for the camera button, but here we are.
    let offVideoButton = document.querySelectorAll(".str-video__icon--camera-off")[0];
    let onVideoButton = document.querySelectorAll(".str-video__icon--camera")[0];
    if (offVideoButton || onVideoButton) {
      if (offVideoButton) {
        isVideoStarted = false;
        changed = true;
      } else if (onVideoButton) {
        isVideoStarted = true;
        changed = true;
      }
    } else {
      console.log('Unable to find camera button.');
    }

    let presentOffButton = document.querySelector(".str-video__icon--screen-share-off");
    let presentOnButton = document.querySelector(".str-video__icon--screen-share-on");
    if (presentOnButton || presentOffButton) {
      if (presentOffButton) {
          if (isShareStarted) {
             changed = true;
          }
          isShareStarted = false;
      } else if (presentOnButton) {
          if (!isShareStarted) {
            changed = true;
          }
          isShareStarted = true;
      }
    } else {
      console.log('Unable to find share button')
    }
    // let shareButton = document.querySelectorAll('[aria-label="You are presenting"]');
    // if (shareButton.length > 0) {
    //   if (!isShareStarted) {
    //     changed = true;
    //   }
    //   isShareStarted = true;
    // } else {
    //   if (isShareStarted) {
    //     changed = true;
    //   }
    //   isShareStarted = false;
    // }

    // let xpath = "//div[text()='Recording']";
    // let foundRecordDiv = false;
    // // there can be multiple components that have 'Recording'
    // let recordButton = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    // if (recordButton) {
    //   for (let i = 0; i < recordButton.snapshotLength; i++) {
    //     let node = recordButton.snapshotItem(i).cloneNode(true);
    //     // there's a header in the HTML that has a role, ignore that one.
    //     let role = node.getAttribute('role');
    //     if (!role) {
    //       foundRecordDiv = true;
    //     }
    //   }

    //   if (foundRecordDiv) {
    //     if (!isRecordStarted) {
    //       changed = true;
    //     }
    //     isRecordStarted = true;
    //   } else {
    //     if (isRecordStarted) {
    //       changed = true;
    //     }
    //     isRecordStarted = false;
    //   }
    // } else {
    //   isRecordStarted = false;
    // }

  } else {
    isInMeeting = false;
  }

  // send meeting status if it has been updated, or if it's been 1 second (250ms * 4) since the last update
  if (changed || updateLoops >= 4) {
    sendGoogleMeetStatus();
    updateLoops = 0;
  } else {
    updateLoops++;
  }
}

function sendGoogleMeetStatus() {
  if (!isInMeeting) {
    return;
  }
  const message = {
    'source': 'google-meet-plugin',
    'action': 'update-status',
    'status': isInMeeting ? 'call' : 'closed',
    'mute': isMuted ? 'muted' : 'unmuted',
    'video': isVideoStarted ? 'started' : 'stopped',
    'share': isShareStarted ? 'started' : 'stopped',
    'record': isRecordStarted ? 'started' : 'stopped',
  };
  // console.log(message);
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

window.addEventListener("load", function load(event) {
  // start a timer that'll scrape the google meet interface
  let timer = window.setInterval(updateGoogleMeetStatus, 250);
}, false);


// https://github.com/joewalnes/reconnecting-websocket/blob/master/reconnecting-websocket.js
(function(global, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    global.ReconnectingWebSocket = factory();
  }
})(this, function() {

  if (!('WebSocket' in window)) {
    return;
  }

  function ReconnectingWebSocket(url, protocols, options) {

    // Default settings
    var settings = {

      /** Whether this instance should log debug messages. */
      debug: false,

      /** Whether or not the websocket should attempt to connect immediately upon instantiation. */
      automaticOpen: true,

      /** The number of milliseconds to delay before attempting to reconnect. */
      reconnectInterval: 1000,
      /** The maximum number of milliseconds to delay a reconnection attempt. */
      maxReconnectInterval: 30000,
      /** The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. */
      reconnectDecay: 1.5,

      /** The maximum time in milliseconds to wait for a connection to succeed before closing and retrying. */
      timeoutInterval: 2000,

      /** The maximum number of reconnection attempts to make. Unlimited if null. */
      maxReconnectAttempts: null,

      /** The binary type, possible values 'blob' or 'arraybuffer', default 'blob'. */
      binaryType: 'blob'
    }
    if (!options) { options = {}; }

    // Overwrite and define settings with options if they exist.
    for (var key in settings) {
      if (typeof options[key] !== 'undefined') {
        this[key] = options[key];
      } else {
        this[key] = settings[key];
      }
    }

    // These should be treated as read-only properties

    /** The URL as resolved by the constructor. This is always an absolute URL. Read only. */
    this.url = url;

    /** The number of attempted reconnects since starting, or the last successful connection. Read only. */
    this.reconnectAttempts = 0;

    /**
     * The current state of the connection.
     * Can be one of: WebSocket.CONNECTING, WebSocket.OPEN, WebSocket.CLOSING, WebSocket.CLOSED
     * Read only.
     */
    this.readyState = WebSocket.CONNECTING;

    /**
     * A string indicating the name of the sub-protocol the server selected; this will be one of
     * the strings specified in the protocols parameter when creating the WebSocket object.
     * Read only.
     */
    this.protocol = null;

    // Private state variables

    var self = this;
    var ws;
    var forcedClose = false;
    var timedOut = false;
    var eventTarget = document.createElement('div');

    // Wire up "on*" properties as event handlers

    eventTarget.addEventListener('open', function(event) { self.onopen(event); });
    eventTarget.addEventListener('close', function(event) { self.onclose(event); });
    eventTarget.addEventListener('connecting', function(event) { self.onconnecting(event); });
    eventTarget.addEventListener('message', function(event) { self.onmessage(event); });
    eventTarget.addEventListener('error', function(event) { self.onerror(event); });

    // Expose the API required by EventTarget

    this.addEventListener = eventTarget.addEventListener.bind(eventTarget);
    this.removeEventListener = eventTarget.removeEventListener.bind(eventTarget);
    this.dispatchEvent = eventTarget.dispatchEvent.bind(eventTarget);

    /**
     * This function generates an event that is compatible with standard
     * compliant browsers and IE9 - IE11
     *
     * This will prevent the error:
     * Object doesn't support this action
     *
     * http://stackoverflow.com/questions/19345392/why-arent-my-parameters-getting-passed-through-to-a-dispatched-event/19345563#19345563
     * @param s String The name that the event should use
     * @param args Object an optional object that the event will use
     */
    function generateEvent(s, args) {
      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(s, false, false, args);
      return evt;
    };

    this.open = function(reconnectAttempt) {
      ws = new WebSocket(self.url, protocols || []);
      ws.binaryType = this.binaryType;

      if (reconnectAttempt) {
        if (this.maxReconnectAttempts && this.reconnectAttempts > this.maxReconnectAttempts) {
          return;
        }
      } else {
        eventTarget.dispatchEvent(generateEvent('connecting'));
        this.reconnectAttempts = 0;
      }

      if (self.debug || ReconnectingWebSocket.debugAll) {
        console.debug('ReconnectingWebSocket', 'attempt-connect', self.url);
      }

      var localWs = ws;
      var timeout = setTimeout(function() {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'connection-timeout', self.url);
        }
        timedOut = true;
        localWs.close();
        timedOut = false;
      }, self.timeoutInterval);

      ws.onopen = function(event) {
        clearTimeout(timeout);
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'onopen', self.url);
        }
        self.protocol = ws.protocol;
        self.readyState = WebSocket.OPEN;
        self.reconnectAttempts = 0;
        var e = generateEvent('open');
        e.isReconnect = reconnectAttempt;
        reconnectAttempt = false;
        eventTarget.dispatchEvent(e);
      };

      ws.onclose = function(event) {
        clearTimeout(timeout);
        ws = null;
        if (forcedClose) {
          self.readyState = WebSocket.CLOSED;
          eventTarget.dispatchEvent(generateEvent('close'));
        } else {
          self.readyState = WebSocket.CONNECTING;
          var e = generateEvent('connecting');
          e.code = event.code;
          e.reason = event.reason;
          e.wasClean = event.wasClean;
          eventTarget.dispatchEvent(e);
          if (!reconnectAttempt && !timedOut) {
            if (self.debug || ReconnectingWebSocket.debugAll) {
              console.debug('ReconnectingWebSocket', 'onclose', self.url);
            }
            eventTarget.dispatchEvent(generateEvent('close'));
          }

          var timeout = self.reconnectInterval * Math.pow(self.reconnectDecay, self.reconnectAttempts);
          setTimeout(function() {
            self.reconnectAttempts++;
            self.open(true);
          }, timeout > self.maxReconnectInterval ? self.maxReconnectInterval : timeout);
        }
      };
      ws.onmessage = function(event) {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'onmessage', self.url, event.data);
        }
        var e = generateEvent('message');
        e.data = event.data;
        eventTarget.dispatchEvent(e);
      };
      ws.onerror = function(event) {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'onerror', self.url, event);
        }
        eventTarget.dispatchEvent(generateEvent('error'));
      };
    }

    // Whether or not to create a websocket upon instantiation
    if (this.automaticOpen == true) {
      this.open(false);
    }

    /**
     * Transmits data to the server over the WebSocket connection.
     *
     * @param data a text string, ArrayBuffer or Blob to send to the server.
     */
    this.send = function(data) {
      if (ws) {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'send', self.url, data);
        }
        return ws.send(data);
      } else {
        throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
      }
    };

    /**
     * Closes the WebSocket connection or connection attempt, if any.
     * If the connection is already CLOSED, this method does nothing.
     */
    this.close = function(code, reason) {
      // Default CLOSE_NORMAL code
      if (typeof code == 'undefined') {
        code = 1000;
      }
      forcedClose = true;
      if (ws) {
        ws.close(code, reason);
      }
    };

    /**
     * Additional public API method to refresh the connection if still open (close, re-open).
     * For example, if the app suspects bad data / missed heart beats, it can try to refresh.
     */
    this.refresh = function() {
      if (ws) {
        ws.close();
      }
    };
  }

  /**
   * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
   * this indicates that the connection is ready to send and receive data.
   */
  ReconnectingWebSocket.prototype.onopen = function(event) {};
  /** An event listener to be called when the WebSocket connection's readyState changes to CLOSED. */
  ReconnectingWebSocket.prototype.onclose = function(event) {};
  /** An event listener to be called when a connection begins being attempted. */
  ReconnectingWebSocket.prototype.onconnecting = function(event) {};
  /** An event listener to be called when a message is received from the server. */
  ReconnectingWebSocket.prototype.onmessage = function(event) {};
  /** An event listener to be called when an error occurs. */
  ReconnectingWebSocket.prototype.onerror = function(event) {};

  /**
   * Whether all instances of ReconnectingWebSocket should log debug messages.
   * Setting this to true is the equivalent of setting all instances of ReconnectingWebSocket.debug to true.
   */
  ReconnectingWebSocket.debugAll = false;

  ReconnectingWebSocket.CONNECTING = WebSocket.CONNECTING;
  ReconnectingWebSocket.OPEN = WebSocket.OPEN;
  ReconnectingWebSocket.CLOSING = WebSocket.CLOSING;
  ReconnectingWebSocket.CLOSED = WebSocket.CLOSED;

  return ReconnectingWebSocket;
});
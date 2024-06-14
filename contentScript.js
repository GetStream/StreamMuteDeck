"use strict";

var mutedeckConnectionStatus = {
  connectionError: "",
  isMuteDeckConnected: false,
  connectionParameters: {},
};
const streamVideoObserver = new StreamVideoObserver();

function sendCustomAction(keyCombinationString) {
  const keys = keyCombinationString.split("+");
  const key = keys.pop().toUpperCase();
  const keyCode = key.charCodeAt(0);
  const modifiers = keys.map(key => {
    switch (key.toLowerCase()) {
      case "ctrl":
        return "ctrlKey";
      case "alt":
        return "altKey";
      case "shift":
        return "shiftKey";
      case "meta":
        if (navigator.userAgent.toLowerCase().indexOf('mac') > -1) {
          return "metaKey";
        } else {
          return "ctrlKey"; // Windows and Linux use the Ctrl key for the "meta" modifier
        }
      case "cmd":
        if (navigator.userAgent.toLowerCase().indexOf('mac') > -1) {
          return "metaKey";
        } else {
          return "ctrlKey"; // Windows and Linux use the Ctrl key for the "cmd" modifier
        }
      case "win":
        return "metaKey";
      default:
        return null;
    }
  }).filter(modifier => modifier !== null);
  const options = {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    code: keyCode,
    key: key
  };
  modifiers.forEach(modifier => {
    options[modifier] = true;
  });

  document.dispatchEvent(new KeyboardEvent("keydown", {
    key: options.key,
    keyCode: options.code, // example values.
    code: "Key" + options.key, // put everything you need in this object.
    which: options.code,
    shiftKey: options.shiftKey, // you don't need to include values
    ctrlKey: options.ctrlKey, // if you aren't going to use them.
    metaKey: options.metaKey, // these are here for example's sake.
    altKey: options.altKey
  }));
}

function toggleMute() {
  if (streamVideoObserver.isInMeeting) {
    streamVideoObserver.toggleMute();
  }
}

function toggleVideo() {
  if (streamVideoObserver.isInMeeting) {
    streamVideoObserver.toggleVideo();
  }
}

function toggleShare() {
  if (streamVideoObserver.isInMeeting) {
    streamVideoObserver.toggleShare();
  }
}

function toggleRecord() {
  if (streamVideoObserver.isInMeeting) {
    streamVideoObserver.toggleRecord();
  }
}

function leaveCall() {
  if (streamVideoObserver.isInMeeting) {
    streamVideoObserver.leaveCall();
  }
}

function bringToFront() {
  console.log('Bringing Stream Video Call to front');
  let meetingType = 'stream-video';
  if (streamVideoObserver.isInMeeting) {
    meetingType = 'stream-video';
  }
  chrome.runtime.sendMessage({ action: "callBringToFront", meetingType: meetingType }, function (response) {
    console.log("Message sent to background script");
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message from background script: ');
  console.log(message);
  if (message.action === 'getMuteDeckStatus') {
    let isInMeeting = streamVideoObserver.isInMeeting;
    let isMuted = streamVideoObserver.isMuted;
    let isVideoStarted = streamVideoObserver.isVideoStarted;
    let isShareStarted = streamVideoObserver.isShareStarted;
    let isRecordStarted = streamVideoObserver.isRecordStarted;
    let isStreamVideoCall = streamVideoObserver.isInMeeting;

    let response = {
      connection: '',
      connected: mutedeckConnectionStatus.isMuteDeckConnected,
      connectionParameters: mutedeckConnectionStatus.connectionParameters,
      isInMeeting: isInMeeting,
      isMuted: isMuted,
      isVideoStarted: isVideoStarted,
      isShareStarted: isShareStarted,
      isRecordStarted: isRecordStarted,
      isStreamVideoCall: isStreamVideoCall,
    };
    if (mutedeckConnectionStatus.isMuteDeckConnected) {
      response.connection = '✅ Connected to MuteDeck';
    } else {
      response.connection = '⚠️ Not connected to MuteDeck. Last error: ' + mutedeckConnectionStatus.connectionError;
    }

    sendResponse(response);
  } // end getMuteDeckStatus
  else if (message.action === 'toggleMute') {
    toggleMute();
  }
  else if (message.action === 'toggleVideo') {
    toggleVideo();
  }
  else if (message.action === 'toggleShare') {
    toggleShare();
  }
  else if (message.action === 'toggleRecord') {
    toggleRecord();
  }
  else if (message.action === 'leaveCall') {
    leaveCall();
  }
  else if (message.action === 'sendCustomAction') {
    sendCustomAction(message.data.shortcut);
  }
  else if (message.action === 'updatedMuteDeckConnectionStatus') {
    console.log('Received updated connection status from background script: ');
    console.log(message.data);
    mutedeckConnectionStatus = message.data;
  }
});

window.addEventListener("load", function load(event) {
  chrome.runtime.sendMessage({ action: "contentAskedForMuteDeckConnectionStatus" });
  streamVideoObserver.initialize();
}, false);

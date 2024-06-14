let defaultSSL = false;
const userAgent = navigator.userAgent;
console.log(`User agent: ${userAgent}`);
if (userAgent.includes("Firefox")) {
  defaultSSL = true;
}

const mutedeckConnection = new MuteDeckConnection(defaultSSL);
mutedeckConnection.initialize();

function onError(error) {
  console.log(`Error: ${error}`);
}

function sendMessageToContentScript(action, message = {}) {
  chrome.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: action, data: message }).catch(onError);
    });
  });
}

sendConnectionStatusUpdate = () => {
  let status = {
    isMuteDeckConnected: mutedeckConnection._isMuteDeckConnected,
    connectionParameters: mutedeckConnection.getConnectionParameters(),
    connectionError: mutedeckConnection._MuteDeckConnectionError
  };

  sendMessageToContentScript('updatedMuteDeckConnectionStatus', status);
};

function toggleMute() {
  sendMessageToContentScript('toggleMute');
}

function toggleVideo() {
  sendMessageToContentScript('toggleVideo');
}

function toggleShare() {
  sendMessageToContentScript('toggleShare');
}

function toggleRecord() {
  sendMessageToContentScript('toggleRecord');
}

function leaveCall() {
  sendMessageToContentScript('leaveCall');
}

function sendCustomAction(shortcut) {
  sendMessageToContentScript('sendCustomAction', { shortcut: shortcut });
}

function bringToFront() {
  chrome.tabs.query({}).then(function (tabs) {
    let meetFound = false;

    for (let i = 0; i < tabs.length; i++) {
     if (tabs[i].url.includes('https://getstream.io/video/demos') && message.meetingType === 'stream-video') {
        meetFound = true;
        chrome.tabs.update(tabs[i].id, { active: true });
        chrome.windows.update(tabs[i].windowId, { focused: true });
        break;
      }
    }

    if (!meetFound) {
      console.log('No Stream Video tabs found');
    }
  });
}

chrome.runtime.onMessage.addListener(function (message, sender) {
  if (message.action == "updateMuteDeckStatus") {
    // console.log('Received message from content script');
    // console.log(message.message);
    mutedeckConnection.sendMessage(message.message);
  }
  else if (message.action === "refreshConnectionSettings") {
    console.log('Received refresh connection settings message');
    mutedeckConnection.refreshConnectionSettings();
  }
  else if (message.action == "contentAskedForMuteDeckConnectionStatus") {
    sendConnectionStatusUpdate();
  }
});

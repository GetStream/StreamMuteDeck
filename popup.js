chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  chrome.tabs.sendMessage(tab.id, { action: 'getMuteDeckStatus' }, (response) => {
    if (!response) {
      return;
    }
    document.getElementById('connection').innerText = response.connection;

    var callTypeAndStatus = 'Not in call';
    if (response.isInMeeting) {
      if (response.isStreamVideoCall) {
        callTypeAndStatus = 'In Stream Video call';
      }
    }
    document.getElementById('google-meet-call').innerText = callTypeAndStatus;
    document.getElementById('mute-status').innerText = (response.isMuted ? 'Muted' : 'Unmuted');
    document.getElementById('camera-status').innerText = (response.isVideoStarted ? 'Camera on' : 'Camera off');
    document.getElementById('share-status').innerText = (response.isShareStarted ? 'Sharing' : 'Not sharing');
    document.getElementById('recording-status').innerText = (response.isRecordStarted ? 'Recording' : 'Not recording');

    if (response.connectionParameters.enable_ssl && !response.connected) {
      document.getElementById('ssl_accept_warning').innerHTML = '<br />With SSL enabled, you may need to accept the certificate in your browser.<br /><br />Click <a href="https://' + response.connectionParameters.host + ':' + response.connectionParameters.port_ssl + '" target="_blank">here</a> and accept the certificate. Then refresh this page.';
    }
  });
});
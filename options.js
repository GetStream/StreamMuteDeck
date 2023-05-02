// Saves options to chrome.storage
function save_options() {
  var mutedeck_host = document.getElementById('mutedeck_host').value;
  var mutedeck_port = document.getElementById('mutedeck_port').value;
  chrome.storage.sync.set({
    mutedeck_host: mutedeck_host,
    mutedeck_port: mutedeck_port
  }, function() {
    var status = document.getElementById('status');
    status.textContent = 'Saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function load_options() {
  chrome.storage.sync.get({
    mutedeck_host: 'localhost',
    mutedeck_port: 3492
  }, function(items) {
    document.getElementById('mutedeck_host').value = items.mutedeck_host;
    document.getElementById('mutedeck_port').value = items.mutedeck_port;
  });
}
document.addEventListener('DOMContentLoaded', load_options);
document.getElementById('save').addEventListener('click',
  save_options);
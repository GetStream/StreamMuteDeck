// Saves options to chrome.storage
function save_options() {
  var mutedeck_host = document.getElementById('mutedeck_host').value;
  var mutedeck_port = document.getElementById('mutedeck_port').value;
  var mutedeck_port_ssl = document.getElementById('mutedeck_port_ssl').value;
  var mutedeck_enable_ssl = document.getElementById('mutedeck_enable_ssl').checked;
  chrome.storage.sync.set({
    mutedeck_host: mutedeck_host,
    mutedeck_port: mutedeck_port,
    mutedeck_port_ssl: mutedeck_port_ssl,
    mutedeck_enable_ssl: mutedeck_enable_ssl
  }, function () {
    var status = document.getElementById('status');
    status.textContent = 'Saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 2000);
  });

  // refresh connection settings in background script
  chrome.runtime.sendMessage({ action: 'refreshConnectionSettings' });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function load_options() {
  chrome.storage.sync.get({
    mutedeck_host: 'localhost',
    mutedeck_port: 3492,
    mutedeck_port_ssl: 3493,
    mutedeck_enable_ssl: false
  }, function (items) {
    document.getElementById('mutedeck_host').value = items.mutedeck_host;
    document.getElementById('mutedeck_port').value = items.mutedeck_port;
    document.getElementById('mutedeck_port_ssl').value = items.mutedeck_port_ssl;
    document.getElementById('mutedeck_port_ssl').disabled = !items.mutedeck_enable_ssl;
    document.getElementById('mutedeck_enable_ssl').checked = items.mutedeck_enable_ssl;
  });
}
document.addEventListener('DOMContentLoaded', load_options);
document.getElementById('save').addEventListener('click', save_options);
// enable mutedeck_port_ssl if mutedeck_enable_ssl is checked
document.getElementById('mutedeck_enable_ssl').addEventListener('change', function () {
  document.getElementById('mutedeck_port_ssl').disabled = !this.checked;
});
document.addEventListener('DOMContentLoaded', function() {
  const actionButton = document.getElementById('actionButton');
  const statusDiv = document.getElementById('status');
  
  // Add click event to the button
  actionButton.addEventListener('click', function() {
    // Example: Send a message to the content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "performAction"}, function(response) {
        statusDiv.textContent = response ? response.status : "Action performed!";
      });
    });
  });
});

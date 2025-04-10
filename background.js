// Background script for persistent functionality
chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension installed");
  
  // Example: Initialize storage
  chrome.storage.local.set({
    isEnabled: true,
    settings: {
      option1: true,
      option2: false
    }
  });
});

// Example: Listen for messages from content or popup scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getSettings") {
    chrome.storage.local.get("settings", function(data) {
      sendResponse({settings: data.settings});
    });
    return true; // Required for async sendResponse
  }
});

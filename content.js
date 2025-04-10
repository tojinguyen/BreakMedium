// This script runs in the context of web pages
console.log("Content script loaded");

// Example: Listen for messages from popup or background
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "performAction") {
    // Do something with the webpage
    console.log("Performing action on the current page");
    
    // Example: Modify page content
    const pageTitle = document.title;
    
    // Send response back to popup
    sendResponse({status: "Action completed! Page title: " + pageTitle});
  }
});

// Example: Add direct functionality to the page
document.addEventListener('DOMContentLoaded', function() {
  // Add features or modifications to the page
});

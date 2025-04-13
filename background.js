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
  try {
    if (request.action === "getSettings") {
      chrome.storage.local.get("settings", function(data) {
        sendResponse({ settings: data.settings });
      });
      return true; // Required for async sendResponse
    } else if (request.action === "openInNewTab") {
      chrome.tabs.create({ url: request.url }, () => {
        sendResponse({ success: true });
      });
      return true; // Required for async response
    } else if (request.action === "buttonInjected") {
      console.log("Button injection confirmed by content script.");
      sendResponse({ success: true });
      return true; // Required for async response
    }
    sendResponse({ error: "Unknown action" });
  } catch (error) {
    console.error("Error handling message:", error);
    sendResponse({ error: "Internal error occurred" });
  }
  return false; // No async response needed
});

// Optimize tab update listener to avoid redundant injections
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isMediumSite = tab.url.includes('medium.com') || tab.url.includes('towardsdatascience.com');
    if (isMediumSite) {
      console.log("Medium page detected, injecting automatically:", tab.url);
      chrome.tabs.sendMessage(tabId, { action: "injectButton" }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Error sending message to content script:", chrome.runtime.lastError.message);
        } else if (response && response.success) {
          console.log("Button injection successful:", tab.url);
        }
      });
    }
  }
});


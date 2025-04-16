/**
 * Background script for BreakMedium extension
 * Handles persistent functionality across the browser
 */

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(function() {
  console.log("BreakMedium extension installed");
  
  // Check for API compatibility
  checkForDeprecatedAPIs();
  
  // Initialize storage with default settings
  chrome.storage.local.set({
    isEnabled: true,
    settings: {
      option1: true,
      option2: false,
      openInNewTab: true
    }
  });
});

/**
 * Checks for deprecated APIs and logs compatibility warnings
 */
function checkForDeprecatedAPIs() {
  if (typeof window !== 'undefined') {
    const mql = window.matchMedia('(min-width: 600px)');
    if (mql && !mql.addEventListener) {
      console.warn('Browser using deprecated MediaQueryList.addListener() - extension includes fallback support.');
    }
  }
  
  console.info('BreakMedium running with cross-browser compatibility mode enabled.');
}

/**
 * Handle messages from content or popup scripts
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  try {
    switch(request.action) {
      case "getSettings":
        chrome.storage.local.get("settings", function(data) {
          sendResponse({ settings: data.settings });
        });
        return true; // Required for async sendResponse
        
      case "openInNewTab":
        chrome.tabs.create({ url: request.url }, () => {
          sendResponse({ success: true });
        });
        return true;
        
      case "buttonInjected":
        console.log("Button injection confirmed by content script.");
        sendResponse({ success: true });
        return true;
        
      default:
        sendResponse({ error: "Unknown action" });
    }
  } catch (error) {
    console.error("Error handling message:", error);
    sendResponse({ error: "Internal error occurred" });
  }
  return false;
});

/**
 * Listen for tab updates to inject content on Medium sites
 */
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

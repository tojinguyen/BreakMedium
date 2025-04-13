/**
 * BreakMedium popup script
 * Handles popup UI interactions and medium article redirection
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const breakMediumButton = document.getElementById('breakMediumButton');
  const statusDiv = document.getElementById('status');
  
  // Configuration
  const CONFIG = {
    mediumDomains: ['medium.com', 'towardsdatascience.com'],
    redirectUrl: 'https://freedium.cfd/',
    statusColors: {
      success: '#4caf50',
      error: '#d9534f',
      processing: '#4caf50'
    }
  };
  
  /**
   * Updates status message with appropriate styling
   * @param {string} message - The message to display
   * @param {string} type - Message type (success, error, processing)
   */
  function updateStatus(message, type = 'processing') {
    statusDiv.textContent = message;
    statusDiv.style.color = CONFIG.statusColors[type];
  }
  
  /**
   * Checks if a URL belongs to a Medium domain
   * @param {string} url - URL to check
   * @returns {boolean} True if URL is a Medium domain
   */
  function isMediumUrl(url) {
    return CONFIG.mediumDomains.some(domain => url.includes(domain));
  }
  
  /**
   * Creates a freedium URL from a Medium URL
   * @param {string} mediumUrl - Original Medium URL
   * @returns {string} Freedium URL
   */
  function createFreediumUrl(mediumUrl) {
    return CONFIG.redirectUrl + mediumUrl;
  }
  
  /**
   * Redirects current tab to Freedium version of Medium article
   */
  function redirectToFreedium() {
    updateStatus("Processing...");
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentUrl = tabs[0].url;
      
      if (isMediumUrl(currentUrl)) {
        const freediumUrl = createFreediumUrl(currentUrl);
        
        chrome.tabs.update(tabs[0].id, { url: freediumUrl });
        updateStatus("Redirecting to Freedium...", 'success');
        
        // Try to create notification
        tryCreateNotification();
      } else {
        updateStatus("This is not a Medium article.", 'error');
      }
    });
  }
  
  /**
   * Attempts to create a notification and handles errors gracefully
   */
  function tryCreateNotification() {
    try {
      chrome.notifications.create(
        '',
        {
          type: "basic",
          iconUrl: "images/icon48.png",
          title: "Break Medium",
          message: "You are being redirected to Freedium for unlimited access."
        },
        response => {
          if (chrome.runtime.lastError) {
            console.error("Notification error:", chrome.runtime.lastError.message);
          }
        }
      );
    } catch (err) {
      console.error("Error creating notification:", err);
    }
  }
  
  /**
   * Sets up responsive layout adjustments for popup
   */
  function setupResponsiveLayout() {
    if (!window.matchMedia) return;
    
    const setupMediaQuery = (mediaQueryString, callback) => {
      const mediaQuery = window.matchMedia(mediaQueryString);
      
      // Call callback initially
      callback(mediaQuery);
      
      // Use modern approach if supported
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', callback);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(callback);
      }
    };
    
    // Adjust button size based on screen width
    setupMediaQuery('(max-width: 300px)', (mq) => {
      if (mq.matches) {
        breakMediumButton.style.fontSize = '14px';
        breakMediumButton.style.padding = '8px 16px';
      } else {
        breakMediumButton.style.fontSize = '16px';
        breakMediumButton.style.padding = '12px 20px';
      }
    });
  }
  
  // Add click event listener to button
  breakMediumButton.addEventListener('click', function() {
    breakMediumButton.classList.toggle('active');
    redirectToFreedium();
  });
  
  // Setup responsive layout
  setupResponsiveLayout();
});

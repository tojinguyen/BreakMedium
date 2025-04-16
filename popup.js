/**
 * BreakMedium popup script
 * Handles popup UI interactions and medium article redirection
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const breakMediumButton = document.getElementById('breakMediumButton');
  const statusDiv = document.getElementById('status');
  const openInNewTabCheckbox = document.getElementById('openInNewTab');
  const enableButtonCheckbox = document.getElementById('enableButton');
  const githubLink = document.getElementById('githubLink');
  const mediumOnlyNotice = document.getElementById('mediumOnlyNotice');

  // Configuration
  const CONFIG = {
    mediumDomains: ['medium.com', 'towardsdatascience.com'],
    redirectUrl: 'https://freedium.cfd/',
    githubUrl: 'https://github.com/tojinguyen/BreakMedium',
    statusColors: {
      success: '#4caf50',
      error: '#d9534f',
      processing: '#4caf50',
      warning: '#ff9800'
    }
  };
  
  // Load saved settings
  function loadSettings() {
    chrome.storage.local.get('settings', function(data) {
      if (data.settings) {
        if (typeof data.settings.openInNewTab !== 'undefined') {
          openInNewTabCheckbox.checked = data.settings.openInNewTab;
        } else {
          // Default to true if setting doesn't exist
          openInNewTabCheckbox.checked = true;
        }

        if (typeof data.settings.enableButton !== 'undefined') {
          enableButtonCheckbox.checked = data.settings.enableButton;
        } else {
          // Default to true if setting doesn't exist
          enableButtonCheckbox.checked = true;
        }
      } else {
        // Default settings if none exist
        openInNewTabCheckbox.checked = true;
        enableButtonCheckbox.checked = true;
      }
    });
  }

  // Save settings when changed
  function saveSettings(setting, value) {
    chrome.storage.local.get('settings', function(data) {
      const settings = data.settings || {};
      settings[setting] = value;

      chrome.storage.local.set({ settings: settings }, function() {
        updateStatus("Settings saved", 'success');

        // Clear status after a delay
        setTimeout(() => {
          updateStatus("");
        }, 1500);

        // If the enableButton setting was changed, notify all tabs to update
        if (setting === 'enableButton') {
          chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
              if (tab.url && (tab.url.includes('medium.com') || tab.url.includes('towardsdatascience.com'))) {
                chrome.tabs.sendMessage(tab.id, {
                  action: "updateButtonVisibility",
                  isEnabled: value
                });
              }
            });
          });
        }
      });
    });
  }

  // Event listeners for settings changes
  openInNewTabCheckbox.addEventListener('change', function() {
    saveSettings('openInNewTab', openInNewTabCheckbox.checked);
  });

  enableButtonCheckbox.addEventListener('change', function() {
    saveSettings('enableButton', enableButtonCheckbox.checked);
  });

  // Setup GitHub link
  githubLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: CONFIG.githubUrl });
  });

  // Add entrance animation to the button when popup opens - lighter effect
  function animateButtonEntrance() {
    breakMediumButton.style.opacity = '0.8';
    breakMediumButton.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      breakMediumButton.style.transition = 'all 0.3s ease-out';
      breakMediumButton.style.opacity = '1';
      breakMediumButton.style.transform = 'scale(1)';
    }, 50);
  }
  
  // Run entrance animation
  animateButtonEntrance();
  
  // Load settings when popup opens
  loadSettings();

  /**
   * Updates status message with appropriate styling
   * @param {string} message - The message to display
   * @param {string} type - Message type (success, error, processing, warning)
   */
  function updateStatus(message, type = 'processing') {
    statusDiv.textContent = message;
    statusDiv.style.color = CONFIG.statusColors[type];
    
    // Add subtle fade-in animation for status updates
    if (message) {
      statusDiv.style.opacity = '0';
      statusDiv.style.transform = 'translateY(-5px)';
      statusDiv.style.transition = 'all 0.2s ease-out';
      
      setTimeout(() => {
        statusDiv.style.opacity = '1';
        statusDiv.style.transform = 'translateY(0)';
      }, 10);
    }
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
   * Update UI based on whether current page is a Medium page
   * @param {boolean} isMedium - Whether current page is Medium
   */
  function updateUIForMediumPage(isMedium) {
    if (isMedium) {
      // On Medium page
      breakMediumButton.disabled = false;
      breakMediumButton.classList.remove('disabled');
      mediumOnlyNotice.classList.add('hidden');
      breakMediumButton.textContent = "Break Medium Article";
    } else {
      // Not on Medium page
      breakMediumButton.disabled = true;
      breakMediumButton.classList.add('disabled');
      mediumOnlyNotice.classList.remove('hidden');
      breakMediumButton.textContent = "Only works on Medium";
      updateStatus("Visit Medium to use this extension", 'warning');
    }
  }
  
  /**
   * Redirects to Freedium version of Medium article
   */
  function redirectToFreedium() {
    updateStatus("Processing...");
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentUrl = tabs[0].url;
      
      if (isMediumUrl(currentUrl)) {
        const freediumUrl = createFreediumUrl(currentUrl);
        
        // Check user preference for tab behavior
        if (openInNewTabCheckbox.checked) {
          // Open in new tab
          chrome.tabs.create({ url: freediumUrl });
          updateStatus("Opened in new tab!", 'success');
        } else {
          // Redirect current tab
          chrome.tabs.update(tabs[0].id, { url: freediumUrl });
          updateStatus("Redirecting...", 'success');
        }
        
        // Try to create notification
        tryCreateNotification(openInNewTabCheckbox.checked);
      } else {
        updateStatus("This is not a Medium article.", 'error');
      }
    });
  }
  
  /**
   * Attempts to create a notification and handles errors gracefully
   */
  function tryCreateNotification(openedInNewTab) {
    try {
      const message = openedInNewTab ?
        "Freedium opened in a new tab for unlimited access." :
        "You are being redirected to Freedium for unlimited access.";

      chrome.notifications.create(
        '',
        {
          type: "basic",
          iconUrl: "images/icon48.png",
          title: "Break Medium",
          message: message
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
  
  // Add click event listener to button with lighter animation
  breakMediumButton.addEventListener('click', function() {
    // Don't do anything if button is disabled
    if (breakMediumButton.disabled) {
      return;
    }
    
    // Lighter click animation
    breakMediumButton.style.transition = 'all 0.15s ease-out';
    breakMediumButton.style.transform = 'scale(0.98)';
    breakMediumButton.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
    
    setTimeout(() => {
      breakMediumButton.classList.add('active');
      breakMediumButton.style.transform = 'scale(1)';
      
      setTimeout(() => {
        redirectToFreedium();
      }, 100);
    }, 100);
  });
  
  // Add subtle hover effects to the logo
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('mouseenter', () => {
      logo.style.transform = 'rotate(5deg) scale(1.05)';
    });
    
    logo.addEventListener('mouseleave', () => {
      logo.style.transform = '';
    });
  }
  
  // Check if current page is Medium and update UI accordingly
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentUrl = tabs[0].url;
    const isMedium = isMediumUrl(currentUrl);
    updateUIForMediumPage(isMedium);
  });
  
  // Setup responsive layout
  setupResponsiveLayout();
});


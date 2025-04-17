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
  const darkModeToggle = document.getElementById('darkModeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const githubLink = document.getElementById('githubLink');
  const mediumOnlyNotice = document.getElementById('mediumOnlyNotice');

  // Configuration
  const CONFIG = {
    mediumDomains: ['medium.com', 'towardsdatascience.com'],
    freediumDomain: 'freedium.cfd',
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
    chrome.storage.local.get(['settings', 'darkMode'], function(data) {
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

      // Load dark mode setting
      if (typeof data.darkMode !== 'undefined') {
        darkModeToggle.checked = data.darkMode;
        updateTheme(data.darkMode);
      } else {
        // Default to system preference
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        darkModeToggle.checked = prefersDarkMode;
        updateTheme(prefersDarkMode);
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
              if (tab.url && isMediumUrl(tab.url)) {
                // Check if content script is loaded before sending message
                chrome.tabs.sendMessage(tab.id, { action: "ping" }, function(response) {
                  // Only send message if content script responded
                  if (!chrome.runtime.lastError && response) {
                    chrome.tabs.sendMessage(tab.id, {
                      action: "updateButtonVisibility",
                      isEnabled: value
                    });
                  }
                });
              }
            });
          });
        }
      });
    });
  }

  // Save dark mode setting separately
  function saveDarkMode(isDark) {
    chrome.storage.local.set({ darkMode: isDark }, function() {
      updateStatus("Theme updated", 'success');

      // Clear status after a delay
      setTimeout(() => {
        updateStatus("");
      }, 1500);

      // Update the theme icon
      updateThemeIcon(isDark);
    });
  }

  // Update theme icon based on current mode
  function updateThemeIcon(isDark) {
    themeIcon.textContent = isDark ? '🌙' : '☀️';
  }

  // Apply dark or light theme
  function updateTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('auto-dark-mode');
    } else {
      document.body.classList.remove('dark-mode');

      // Check if system prefers dark mode to add auto-dark-mode class
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('auto-dark-mode');
      } else {
        document.body.classList.remove('auto-dark-mode');
      }
    }

    // Update theme icon
    updateThemeIcon(isDark);
  }

  // Listen for system theme changes to update auto-dark-mode
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      // Only apply auto dark mode if manual dark mode isn't enabled
      if (!darkModeToggle.checked) {
        if (event.matches) {
          document.body.classList.add('auto-dark-mode');
        } else {
          document.body.classList.remove('auto-dark-mode');
        }
      }
    });
  }

  // Event listeners for settings changes
  openInNewTabCheckbox.addEventListener('change', function() {
    saveSettings('openInNewTab', openInNewTabCheckbox.checked);
  });

  enableButtonCheckbox.addEventListener('change', function() {
    saveSettings('enableButton', enableButtonCheckbox.checked);
  });

  // Event listener for dark mode toggle
  darkModeToggle.addEventListener('change', function() {
    updateTheme(darkModeToggle.checked);
    saveDarkMode(darkModeToggle.checked);

    // Notify all medium tabs about theme change
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        if (tab.url && isMediumUrl(tab.url)) {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateTheme",
            darkMode: darkModeToggle.checked
          }).catch(() => {
            // Ignore errors if content script isn't loaded
          });
        }
      });
    });
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
  
  // Add beautiful water ripple effect to popup button
  setupRippleEffect(breakMediumButton);

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
    if (!url) return false;
    return CONFIG.mediumDomains.some(domain => url.includes(domain));
  }

  /**
   * Checks if a URL is already a Freedium URL
   * @param {string} url - URL to check
   * @returns {boolean} True if URL is a Freedium URL
   */
  function isFreediumUrl(url) {
    if (!url) return false;
    return url.includes(CONFIG.freediumDomain);
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
   * Update UI based on whether current page is a Medium page or Freedium
   * @param {boolean} isMedium - Whether current page is Medium
   * @param {boolean} isFreedium - Whether current page is Freedium
   */
  function updateUIForMediumPage(isMedium, isFreedium) {
    if (isFreedium) {
      // On Freedium page (already redirected)
      breakMediumButton.disabled = true;
      breakMediumButton.classList.remove('disabled');
      breakMediumButton.classList.add('redirected');
      mediumOnlyNotice.classList.add('hidden');
      breakMediumButton.innerHTML = "<span class='check-icon'>✓</span> Redirected";
      updateStatus("You're already on a Freedium page", 'success');
    }
    else if (isMedium) {
      // On Medium page
      breakMediumButton.disabled = false;
      breakMediumButton.classList.remove('disabled');
      breakMediumButton.classList.remove('redirected');
      mediumOnlyNotice.classList.add('hidden');
      breakMediumButton.textContent = "Break Medium Article";
    } else {
      // Not on Medium page
      breakMediumButton.disabled = true;
      breakMediumButton.classList.add('disabled');
      breakMediumButton.classList.remove('redirected');
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
      if (!tabs || tabs.length === 0) {
        updateStatus("Cannot access current tab", 'error');
        return;
      }

      const currentUrl = tabs[0].url;
      
      if (isMediumUrl(currentUrl)) {
        const freediumUrl = createFreediumUrl(currentUrl);
        
        // Check user preference for tab behavior
        if (openInNewTabCheckbox.checked) {
          // Open in new tab
          chrome.tabs.create({ url: freediumUrl }, function(tab) {
            if (chrome.runtime.lastError) {
              console.error("Error creating tab:", chrome.runtime.lastError);
              updateStatus("Error opening new tab", 'error');
            } else {
              updateStatus("Opened in new tab!", 'success');
            }
          });
        } else {
          // Redirect current tab
          chrome.tabs.update(tabs[0].id, { url: freediumUrl }, function(tab) {
            if (chrome.runtime.lastError) {
              console.error("Error updating tab:", chrome.runtime.lastError);
              updateStatus("Error redirecting", 'error');
            } else {
              updateStatus("Redirecting...", 'success');
            }
          });
        }
        
        // Try to create notification if permission exists
        if (chrome.notifications) {
          tryCreateNotification(openInNewTabCheckbox.checked);
        }
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
      if (!chrome.notifications) {
        console.log("Notifications API not available");
        return;
      }

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
        function(notificationId) {
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
    if (!tabs || tabs.length === 0) {
      console.error("Cannot access current tab");
      updateStatus("Cannot access current tab", 'error');
      return;
    }

    const currentUrl = tabs[0].url;
    const isMedium = isMediumUrl(currentUrl);
    const isFreedium = isFreediumUrl(currentUrl);
    updateUIForMediumPage(isMedium, isFreedium);
  });
  
  // Setup responsive layout
  setupResponsiveLayout();

  /**
   * Sets up beautiful water ripple effect on a button
   * @param {HTMLElement} button - Button to apply effect to
   */
  function setupRippleEffect(button) {
    // Make sure the button can accept absolute positioned elements
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    
    let rippleInterval = null;
    let isHovering = false;
    let lastMousePosition = { x: 0, y: 0 };
    
    // Create ripples when mouse enters button
    button.addEventListener('mouseenter', function(e) {
      isHovering = true;
      lastMousePosition = { x: e.clientX, y: e.clientY };
      
      // Create initial ripple at exact mouse position
      createMultipleRipples(button, e);
      
      // Continue creating ripples while hovering, based on mouse movement
      rippleInterval = setInterval(() => {
        if (isHovering && !button.disabled && !button.classList.contains('disabled')) {
          createMultipleRipples(button, { clientX: lastMousePosition.x, clientY: lastMousePosition.y });
        }
      }, 1200); // Create new wave set every 1.2s
    });
    
    // Track mouse position during hover to create ripples from current position
    button.addEventListener('mousemove', function(e) {
      if (isHovering) {
        lastMousePosition = { x: e.clientX, y: e.clientY };
      }
    });
    
    // Stop creating ripples when mouse leaves
    button.addEventListener('mouseleave', function() {
      isHovering = false;
      if (rippleInterval) {
        clearInterval(rippleInterval);
        rippleInterval = null;
      }
    });
  }
  
  /**
   * Creates multiple parallel ripple effects
   * @param {HTMLElement} button - Button element
   * @param {MouseEvent|Object} [e] - Optional mouse event for position
   */
  function createMultipleRipples(button, e = null) {
    // Don't create ripples if button is disabled
    if (button.disabled || button.classList.contains('disabled') || button.classList.contains('redirected')) {
      return;
    }
    
    const rect = button.getBoundingClientRect();
    const mouseX = e ? (e.clientX - rect.left) : rect.width/2;
    const mouseY = e ? (e.clientY - rect.top) : rect.height/2;
    
    // Clear old ripples if too many
    const ripples = button.querySelectorAll('.popup-ripple-effect');
    if (ripples.length > 15) {
      for (let i = 0; i < 5; i++) {
        if (ripples[i]) ripples[i].remove();
      }
    }
    
    // Create 3-5 ripples in parallel from mouse position
    const rippleCount = 3 + Math.floor(Math.random() * 2);
    
    // Beautiful colors for ripple effect - popup button has different base color
    const rippleColors = [
      'rgba(255,255,255,0.15)',
      'rgba(255,255,255,0.13)',
      'rgba(255,255,255,0.17)',
      'rgba(240,255,240,0.12)',
      'rgba(220,255,220,0.10)'
    ];
    
    for (let i = 0; i < rippleCount; i++) {
      // All ripples originate from mouse position with small random offsets
      const offsetX = (Math.random() - 0.5) * 6; // Slight X offset (-3 to +3px)
      const offsetY = (Math.random() - 0.5) * 6; // Slight Y offset (-3 to +3px)
      const posX = mouseX + offsetX;
      const posY = mouseY + offsetY;
      
      // Use fixed sizes for consistent ripple effect
      const multiplier = 1.5; // Fixed value instead of random
      const size = Math.max(rect.width, rect.height) * multiplier;
      const duration = 2.0; // Fixed 2.0 second duration for all ripples
      const delay = i * 80; // Even spacing between ripples
      const opacity = 0.15; // Fixed opacity for consistency
      
      // Select random color from our palette
      const color = rippleColors[Math.floor(Math.random() * rippleColors.length)];
      
      createRippleAt(button, posX, posY, size, opacity, duration, delay, color);
    }
  }
  
  /**
   * Creates a single ripple at specific position
   * @param {HTMLElement} button - Button element
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} size - Final ripple size
   * @param {number} opacity - Ripple opacity
   * @param {number} duration - Animation duration
   * @param {number} delay - Start delay
   * @param {string} color - Ripple color
   */
  function createRippleAt(button, x, y, size, opacity, duration, delay, color) {
    const ripple = document.createElement('span');
    ripple.className = 'popup-ripple-effect';
    
    // Position and initial size
    ripple.style.position = 'absolute';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = ripple.style.height = '0px';
    
    // Advanced styling
    ripple.style.background = color;
    ripple.style.borderRadius = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.opacity = '0.6';
    ripple.style.pointerEvents = 'none';
    ripple.style.mixBlendMode = 'lighten';
    ripple.style.filter = 'blur(1.5px)';
    ripple.style.willChange = 'transform, width, height, opacity';
    
    // Use simple timing function for consistent effect
    const timingFn = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // easeOutQuad
    
    // Smooth water-like transition
    ripple.style.transition = `width ${duration}s ${timingFn}, height ${duration}s ${timingFn}, opacity ${duration * 0.8}s ${timingFn}`;
    ripple.style.zIndex = '1';
    
    // Add subtle shadow for depth
    ripple.style.boxShadow = '0 0 10px rgba(255,255,255,0.05) inset';
    
    button.appendChild(ripple);
    
    // Start animation with delay
    setTimeout(() => {
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.opacity = '0.12';
      
      // Use fixed scale value
      const scale = 1.05; // Fixed instead of random
      ripple.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }, delay);
    
    // Remove after animation completes
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.style.opacity = '0';
        // Use fixed scale when disappearing
        ripple.style.transform = 'translate(-50%, -50%) scale(1.1)';
        setTimeout(() => {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 600);
      }
    }, delay + (duration * 1000));
  }
});


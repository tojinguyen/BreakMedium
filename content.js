/**
 * BreakMedium content script
 * Handles DOM manipulation and button injection on Medium pages
 */

console.log("Break Medium content script loaded");

// Configuration
const CONFIG = {
  buttonId: 'break-medium-button',
  injectionAttempts: 30,
  injectionInterval: 1500, // 1,5 second
  urlChangeDelay: 1500,
  buttonStyle: {
    padding: '8px 16px',
    backgroundColor: '#1a8917',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '0',
    margin: 'auto 0',
    alignSelf: 'center',
    fontWeight: 'bold',
    marginRight: '10px',
    transition: 'all 0.3s ease',
    opacity: '0',
    transform: 'scale(0.9)',
    animation: 'breakMediumButtonAppear 0.5s ease forwards',
    // Add properties to improve macOS clickability
    zIndex: '9999',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    position: 'relative',
    outline: 'none'
  },
  buttonHoverStyle: {
    filter: 'brightness(110%)',
    transform: 'scale(1.05)'
  },
  // Dark mode styles
  darkModeButtonStyle: {
    backgroundColor: '#1a8917',
    color: 'white',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
  }
};

// Track if button is enabled and dark mode state
let isButtonEnabled = true;
let isDarkMode = false;

// Check settings on load
chrome.storage.local.get(['settings', 'darkMode'], function(data) {
  if (data.settings && typeof data.settings.enableButton !== 'undefined') {
    isButtonEnabled = data.settings.enableButton;
    console.log("Button enabled setting loaded:", isButtonEnabled);
  }

  // Check dark mode setting
  if (typeof data.darkMode !== 'undefined') {
    isDarkMode = data.darkMode;
    console.log("Dark mode setting loaded:", isDarkMode);
  } else {
    // Default to system preference if not set
    isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
});

// Inject animation keyframes to the page
function injectAnimationStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes breakMediumButtonAppear {
      0% {
        opacity: 0.7;
        transform: scale(0.95);
      }
      50% {
        opacity: 0.9;
        transform: scale(1.02);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    #${CONFIG.buttonId} {
      animation: breakMediumButtonAppear 0.3s ease forwards;
    }
    
    #${CONFIG.buttonId}:hover {
      filter: brightness(105%);
      transform: scale(1.02);
    }
    
    #${CONFIG.buttonId}:active {
      transform: scale(0.98);
      filter: brightness(97%);
    }
    
    /* Fix for macOS button click area */
    #${CONFIG.buttonId}::before {
      content: '';
      position: absolute;
      top: -5px;
      left: -5px;
      right: -5px;
      bottom: -5px;
      z-index: -1;
    }
  `;
  document.head.appendChild(styleElement);
}

/**
 * Find target element for button injection by looking for "Write" text
 * @returns {HTMLElement|null} The target element or null if not found
 */
function findTargetElementByText() {
  try {
    // Find all elements that might contain the text "Write"
    const allElements = document.querySelectorAll('div, button, a, span');
    
    // Look for element with exact "Write" text content
    for (const element of allElements) {
      if (element.textContent.trim() === "Write") {
        console.log('Found "Write" element:', element);
        const targetElement = element.closest('div');
        console.log('Target element (closest container):', targetElement);
        return targetElement;
      }
    }

    // Fallback methods if "Write" is not found
    console.warn('Primary method failed. Attempting fallback...');
    const fallbackElement = document.querySelector('[aria-label="Write"]') || 
                            document.querySelector('[data-action="write"]');
    
    if (fallbackElement) {
      console.log('Fallback element found:', fallbackElement);
      return fallbackElement.closest('div');
    }

    console.error('Target element could not be found using any method.');
    return null;
  } catch (error) {
    console.error('Error finding target element by text:', error);
    return null;
  }
}

/**
 * Checks if the current article is a premium Medium article
 * @returns {boolean} True if premium article detected
 */
function isPremiumArticle() {
  try {
    // Look for premium article indicators
    const premiumBadge = document.querySelector('div[aria-label="Member-only story"]') || 
                         Array.from(document.querySelectorAll('span, p')).find(el => 
                           el.textContent.includes("Member-only story") || 
                           el.textContent.includes("Get unlimited access"));

    if (premiumBadge) {
      console.log('Premium article detected:', premiumBadge);
      return true;
    } 
    
    console.log('Non-premium article detected');
    return false;
  } catch (error) {
    console.error('Error detecting premium article:', error);
    return false;
  }
}

/**
 * Creates a button element with proper styling
 * @returns {HTMLButtonElement} The created button
 */
function createButton() {
  // Ensure animation styles are injected
  if (!document.querySelector(`style[data-id="break-medium-animations"]`)) {
    injectAnimationStyles();
  }
  
  const button = document.createElement('button');
  button.id = CONFIG.buttonId;
  button.textContent = 'Break Medium';
  button.setAttribute('type', 'button'); // Explicitly set type
  button.setAttribute('role', 'button'); // Ensure ARIA role
  button.tabIndex = 0; // Make focusable for keyboard accessibility
  
  // Apply styles from config
  Object.assign(button.style, CONFIG.buttonStyle);
  
  // Apply dark mode styles if needed
  if (isDarkMode) {
    Object.assign(button.style, CONFIG.darkModeButtonStyle);
  }

  // Add multiple event listeners to ensure click works - critical fix for macOS
  ['mousedown', 'mouseup', 'click'].forEach(eventType => {
    button.addEventListener(eventType, function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Only process the click event
      if (eventType === 'click') {
        const freediumUrl = 'https://freedium.cfd/' + window.location.href;
        
        // Add click animation - reduced intensity
        button.style.transform = 'scale(0.98)';
        button.style.filter = 'brightness(95%)';
        
        console.log(`Button clicked! Redirecting to: ${freediumUrl}`);
        
        // Get user preference for tab behavior
        chrome.storage.local.get('settings', function(data) {
          const openInNewTab = data.settings && data.settings.openInNewTab;
    
          // Short timeout to see the click effect
          setTimeout(() => {
            if (openInNewTab) {
              // Open in new tab
              window.open(freediumUrl, '_blank');
            } else {
              // Redirect current tab
              window.location.href = freediumUrl;
            }
          }, 100);
        });
      }
      
      return false; // Prevent default behavior
    }, { capture: true, passive: false });
  });
  
  // Add hover and hover out effects - reduced intensity
  button.addEventListener('mouseenter', function() {
    button.style.filter = 'brightness(105%)';
    button.style.transform = 'scale(1.02)';
  });
  
  button.addEventListener('mouseleave', function() {
    button.style.filter = '';
    button.style.transform = '';
  });

  // --- Water ripple effect with MULTIPLE PARALLEL WAVES on hover ---
  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  
  let rippleInterval = null;
  let isHovering = false;
  let lastMousePosition = { x: 0, y: 0 };
  
  // Create ripples when mouse enters button and track mouse position
  button.addEventListener('mouseenter', function(e) {
    isHovering = true;
    lastMousePosition = { x: e.clientX, y: e.clientY };
    
    // Create initial multiple ripples at mouse position
    createMultipleRipples(button, e);
    
    // Continue creating ripples while hovering from current mouse position
    rippleInterval = setInterval(() => {
      if (isHovering) {
        createMultipleRipples(button, { clientX: lastMousePosition.x, clientY: lastMousePosition.y });
      }
    }, 1200); // Create new wave sets every 1.2s
  });
  
  // Track mouse movement to update ripple origin
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
  
  return button;
}

/**
 * Creates multiple parallel ripple effects
 * @param {HTMLElement} button - The button element
 * @param {MouseEvent|Object} [e] - Optional mouse event for position
 */
function createMultipleRipples(button, e = null) {
  const rect = button.getBoundingClientRect();
  const mouseX = e ? (e.clientX - rect.left) : rect.width/2;
  const mouseY = e ? (e.clientY - rect.top) : rect.height/2;
  
  // Clear old ripples if too many
  const ripples = button.querySelectorAll('.ripple-effect');
  if (ripples.length > 15) {
    for (let i = 0; i < 5; i++) {
      if (ripples[i]) ripples[i].remove();
    }
  }
  
  // Create 3-5 ripples in parallel from mouse position (same as popup)
  const rippleCount = 3 + Math.floor(Math.random() * 2); // 3 to 5 ripples, consistent with popup
  
  // Beautiful colors for ripple effect
  const rippleColors = [
    'rgba(255,255,255,0.15)',  // light white
    'rgba(255,255,255,0.13)',  // softer white
    'rgba(255,255,255,0.17)',  // stronger white
    'rgba(240,255,250,0.12)',  // very light mint
    'rgba(220,255,250,0.10)'   // softer mint
  ];
  
  for (let i = 0; i < rippleCount; i++) {
    // All ripples originate from mouse position with small random offsets (same as popup)
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
    
    // Choose random color from our color palette
    const color = rippleColors[Math.floor(Math.random() * rippleColors.length)];
    
    createRippleAt(button, posX, posY, size, opacity, duration, delay, color);
  }
}

/**
 * Creates a single ripple at specific position
 * @param {HTMLElement} button - The button element
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Final ripple size
 * @param {number} opacity - Ripple opacity
 * @param {number} duration - Animation duration
 * @param {number} delay - Start delay
 * @param {string} color - Ripple color in rgba format
 */
function createRippleAt(button, x, y, size, opacity, duration, delay, color = 'rgba(255,255,255,0.15)') {
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  
  // Position and initial size
  ripple.style.position = 'absolute';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.style.width = ripple.style.height = '0px';
  
  // Advanced styling (synchronized with popup)
  ripple.style.background = color;
  ripple.style.borderRadius = '50%';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.opacity = '0.6'; // Start with higher opacity like popup
  ripple.style.pointerEvents = 'none';
  ripple.style.mixBlendMode = 'lighten';
  ripple.style.filter = 'blur(1.5px)';
  ripple.style.willChange = 'transform, width, height, opacity';
  
  // Use simple timing function for consistent effect
  const timingFn = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // easeOutQuad
  
  // Set up slow, smooth water-like transition
  ripple.style.transition = `width ${duration}s ${timingFn}, height ${duration}s ${timingFn}, opacity ${duration * 0.8}s ${timingFn}`;
  ripple.style.zIndex = '1';
  
  // Add subtle shadow for depth effect
  ripple.style.boxShadow = '0 0 10px rgba(255,255,255,0.05) inset';
  
  button.appendChild(ripple);
  
  // Start animation with delay
  setTimeout(() => {
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.opacity = '0.12'; // Lower opacity when expanding
    
    // Use fixed scale value
    const scale = 1.05; // Fixed instead of random
    ripple.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }, delay);
  
  // Remove after animation completes with fade-out
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

/**
 * Injects button into the page
 * @returns {boolean} True if injection was successful
 */
function injectButtonToSelector() {
  try {
    // Skip if button is disabled
    if (!isButtonEnabled) {
      console.log('Button injection disabled by user settings');
      removeExistingButton();
      return false;
    }

    // Skip injection on Medium homepage
    const currentUrl = window.location.href;
    if (currentUrl === "https://medium.com/" || currentUrl === "https://www.medium.com/") {
      console.log("Medium homepage detected, skipping button injection");
      return false;
    }

    // Skip injection for non-premium articles
    if (!isPremiumArticle()) {
      console.log('Non-premium article detected, skipping button injection');
      return false;
    }

    // Check if button already exists
    if (document.getElementById(CONFIG.buttonId)) {
      console.log('Break Medium button already exists');
      return true;
    }

    // Find target element and inject button
    const targetElement = findTargetElementByText();
    if (!targetElement) {
      console.error('Target element not found for button injection');
      return false;
    }
    
    const button = createButton();
    
    // Create a wrapper to ensure better click handling on macOS
    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.display = 'inline-block';
    buttonWrapper.style.position = 'relative';
    buttonWrapper.style.marginRight = '10px';
    buttonWrapper.style.zIndex = '9999';
    buttonWrapper.appendChild(button);
    
    // Insert wrapper as second child if possible
    if (targetElement.childNodes.length >= 1) {
      if (targetElement.childNodes[0].nextSibling) {
        targetElement.insertBefore(buttonWrapper, targetElement.childNodes[0].nextSibling);
      } else {
        targetElement.appendChild(buttonWrapper);
      }
    } else {
      targetElement.appendChild(buttonWrapper);
    }
    
    // Use setTimeout to ensure the animation plays
    setTimeout(() => {
      button.style.opacity = '1';
      button.style.transform = 'scale(1)';
    }, 10);
    
    console.log('Button successfully injected with animation');
    
    // Notify background script
    chrome.runtime.sendMessage({ action: "buttonInjected" });
    return true;
    
  } catch (error) {
    console.error('Error injecting button:', error);
    return false;
  }
}

/**
 * Removes the button from the page if it exists
 */
function removeExistingButton() {
  const existingButton = document.getElementById(CONFIG.buttonId);
  if (existingButton) {
    console.log('Removing existing button');
    // Animate removal
    existingButton.style.opacity = '0';
    existingButton.style.transform = 'scale(0.9)';

    setTimeout(() => {
      if (existingButton.parentNode) {
        existingButton.parentNode.removeChild(existingButton);
      }
    }, 300);
  }
}

/**
 * Update button visibility based on settings
 * @param {boolean} enabled - Whether the button should be visible
 */
function updateButtonVisibility(enabled) {
  isButtonEnabled = enabled;
  console.log('Button visibility updated:', enabled);

  if (enabled) {
    // Try to inject button if it's enabled
    if (!isButtonStillPresent()) {
      injectButtonToSelector();
    }
  } else {
    // Remove button if it's disabled
    removeExistingButton();
  }
}

/**
 * Checks if button is currently in the DOM
 * @returns {boolean} True if button exists
 */
function isButtonStillPresent() {
  return !!document.getElementById(CONFIG.buttonId);
}

/**
 * Attempts to inject button repeatedly until successful
 */
function startContinuousInjection() {
  console.log('Starting continuous button injection monitoring');
  
  let attempts = 0;
  
  const injectionInterval = setInterval(() => {
    attempts++;
    console.log(`Attempting to inject button (attempt ${attempts}/${CONFIG.injectionAttempts})`);
    
    if (injectButtonToSelector() || attempts >= CONFIG.injectionAttempts) {
      console.log('Button successfully injected or max attempts reached');
      clearInterval(injectionInterval);
    }
  }, CONFIG.injectionInterval);
  
  // Set up persistent monitoring
  setupPersistentObserver();
}

/**
 * Set up mutation observer to continually monitor DOM for changes
 */
function setupPersistentObserver() {
  console.log('Setting up persistent DOM observer');
  
  const observer = new MutationObserver(function() {
    if (!isButtonStillPresent()) {
      console.log('Button disappeared, attempting to reinject');
      injectButtonToSelector();
    }
  });
  
  // Start observing the document body
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    characterData: true
  });
  
  // Monitor URL changes for SPAs
  monitorURLChanges();
}

/**
 * Monitor URL changes in single page applications
 */
function monitorURLChanges() {
  let lastUrl = location.href;
  
  // Create observer for URL changes
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('URL changed, checking if button needs to be reinjected');
      
      setTimeout(() => {
        if (!isButtonStillPresent()) {
          console.log('Button not found after URL change, injecting again');
          injectButtonToSelector();
        }
      }, CONFIG.urlChangeDelay);
    }
  });
  
  // Start observing
  urlObserver.observe(document, { subtree: true, childList: true });
  
  // Hook into history API
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    
    setTimeout(() => {
      if (!isButtonStillPresent()) {
        console.log('History API navigation detected, injecting button');
        injectButtonToSelector();
      }
    }, CONFIG.urlChangeDelay);
  };
}

/**
 * Cross-browser compatible media query listener
 * @param {string} mediaQueryString - Media query to listen for
 * @param {function} callback - Function to call on matches
 * @returns {function} Cleanup function
 */
function addMediaQueryListener(mediaQueryString, callback) {
  const mediaQuery = window.matchMedia(mediaQueryString);
  
  // Use modern approach if supported
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  } 
  // Fall back to deprecated method
  else {
    mediaQuery.addListener(callback);
    return () => mediaQuery.removeListener(callback);
  }
}

/**
 * Set up responsive styles for the button
 */
function setupResponsiveButtonStyles() {
  // Handle mobile/small screen layouts
  addMediaQueryListener('(max-width: 767px)', (event) => {
    const button = document.getElementById(CONFIG.buttonId);
    if (button) {
      if (event.matches) {
        // Mobile styles
        button.style.fontSize = '14px';
        button.style.padding = '6px 12px';
      } else {
        // Desktop styles
        button.style.fontSize = 'inherit';
        button.style.padding = '8px 16px';
      }
    }
  });
}

// Message listener
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "ping") {
    // Response to ping, confirms content script is loaded
    sendResponse({status: "alive"});
  }
  else if (request.action === "performAction") {
    const currentUrl = window.location.href;
    const freediumUrl = 'https://freedium.cfd/' + currentUrl;
    sendResponse({status: "Redirecting to: " + freediumUrl});
  }
  else if (request.action === "injectButton") {
    // Only inject if enabled
    if (isButtonEnabled) {
      injectButtonToSelector();
    }
    sendResponse({success: true});
  }
  else if (request.action === "updateButtonVisibility") {
    updateButtonVisibility(request.isEnabled);
    sendResponse({success: true});
  }
  else if (request.action === "updateTheme") {
    // Update dark mode state
    isDarkMode = request.darkMode;

    // Update button styling if it exists
    const existingButton = document.getElementById(CONFIG.buttonId);
    if (existingButton) {
      if (isDarkMode) {
        Object.assign(existingButton.style, CONFIG.darkModeButtonStyle);
      } else {
        // Reset to default
        existingButton.style.backgroundColor = CONFIG.buttonStyle.backgroundColor;
        existingButton.style.color = CONFIG.buttonStyle.color;
        existingButton.style.boxShadow = '';
      }
    }

    sendResponse({success: true});
  }
  return true; // Required for async sendResponse
});

// Initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (!injectButtonToSelector()) {
    console.log('Initial injection failed, starting continuous injection');
    startContinuousInjection();
  } else {
    setupPersistentObserver();
    setupResponsiveButtonStyles();
  }
});

// Also try when window is fully loaded
window.addEventListener('load', function() {
  if (!isButtonStillPresent()) {
    console.log('Button not found after window load, trying injection again');
    if (!injectButtonToSelector()) {
      startContinuousInjection();
    } else {
      setupPersistentObserver();
      setupResponsiveButtonStyles();
    }
  } else {
    setupPersistentObserver();
    setupResponsiveButtonStyles();
  }
});


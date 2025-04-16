/**
 * BreakMedium content script
 * Handles DOM manipulation and button injection on Medium pages
 */

console.log("Break Medium content script loaded");

// Configuration
const CONFIG = {
  buttonId: 'break-medium-button',
  injectionAttempts: 60,
  injectionInterval: 1000, // 1 second
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
    animation: 'breakMediumButtonAppear 0.5s ease forwards'
  },
  buttonHoverStyle: {
    filter: 'brightness(110%)',
    transform: 'scale(1.05)'
  }
};

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
  
  // Apply styles from config
  Object.assign(button.style, CONFIG.buttonStyle);
  
  // Add click event to redirect to Freedium
  button.addEventListener('click', function() {
    const freediumUrl = 'https://freedium.cfd/' + window.location.href;
    
    // Add click animation - reduced intensity
    button.style.transform = 'scale(0.98)';
    button.style.filter = 'brightness(95%)';
    
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
  
  return button;
}

/**
 * Injects button into the page
 * @returns {boolean} True if injection was successful
 */
function injectButtonToSelector() {
  try {
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
    
    // Insert button as second child if possible
    if (targetElement.childNodes.length >= 1) {
      if (targetElement.childNodes[0].nextSibling) {
        targetElement.insertBefore(button, targetElement.childNodes[0].nextSibling);
      } else {
        targetElement.appendChild(button);
      }
    } else {
      targetElement.appendChild(button);
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
  if (request.action === "performAction") {
    const currentUrl = window.location.href;
    const freediumUrl = 'https://freedium.cfd/' + currentUrl;
    sendResponse({status: "Redirecting to: " + freediumUrl});
  }
  if (request.action === "injectButton") {
    injectButtonToSelector();
  }
  return true;
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


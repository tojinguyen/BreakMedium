console.log("Break Medium content script loaded");

// Function to find element containing "Write" text and navigate up 6 levels
function findTargetElementByText() {
  try {
    // Find all elements that might contain the text "Write"
    const allElements = document.querySelectorAll('div, button, a, span');
    let targetElement = null;
    
    // Look through elements to find one containing exactly "Write"
    for (const element of allElements) {
      if (element.textContent.trim() === "Write") {
        console.log('Found "Write" element:', element);
        targetElement = element;
        console.log('Target element (6 levels up):', element);
        break;
      }
    }
    
    return targetElement;
  } catch (error) {
    console.error('Error finding target element by text:', error);
    return null;
  }
}

// Function to inject button into the specified selector
function injectButtonToSelector() {
  try {
    // Check if button already exists
    if (document.getElementById('break-medium-button')) {
      console.log('Break Medium button already exists, not adding another one');
      return true; // Return true to indicate success
    }

    // Find the element using the text-based approach
    let targetElement = findTargetElementByText();
    
    if (targetElement) {
      // Create the button
      const button = document.createElement('button');
      button.id = 'break-medium-button'; // Add unique ID to the button
      button.textContent = 'Break Medium';
      button.style.padding = '8px 16px';
      button.style.backgroundColor = '#1a8917';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.marginTop = '0'; // Changed from 10px to 0
      button.style.margin = 'auto 0'; // Add vertical centering
      button.style.alignSelf = 'center'; // Ensure vertical alignment
      button.style.fontWeight = 'bold';
      button.style.marginRight = '10px'; // Add some space to the left
      
      // Add click event to the button
      button.addEventListener('click', function() {
        // Open Freedium in a new tab
        const freediumUrl = 'https://freedium.cfd/' + window.location.href;
        window.open(freediumUrl, '_blank');
      });
      
      // Make sure to insert the button as the second child
      if (targetElement.childNodes.length >= 1) {
        // If there's at least one child, insert after the first one
        if (targetElement.childNodes[0].nextSibling) {
          targetElement.insertBefore(button, targetElement.childNodes[0].nextSibling);
        } else {
          // If there's only one child, just append it
          targetElement.appendChild(button);
        }
      } else {
        // If there are no children, just append it
        targetElement.appendChild(button);
      }
      
      console.log('Button successfully injected as second child');
      return true; // Return true to indicate success
    } else {
      console.error('Target element not found using text-based method');
      // Try to find similar elements to help with debugging
      const rootElement = document.querySelector('#root');
      if (rootElement) {
        console.log('Root element exists, but target element not found');
      }
      return false; // Return false to indicate failure
    }
  } catch (error) {
    console.error('Error injecting button:', error);
    return false; // Return false to indicate failure
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "performAction") {
    // Get current URL and create freedium URL
    const currentUrl = window.location.href;
    const freediumUrl = 'https://freedium.cfd/' + currentUrl;
    
    // Send the URL back to popup
    sendResponse({status: "Redirecting to: " + freediumUrl});
  }
  if (request.action === "injectButton") {
    injectButtonToSelector();
  }
  return true;
});

// Function to check if button still exists in DOM
function isButtonStillPresent() {
  return !!document.getElementById('break-medium-button');
}

// Function to continuously attempt injection until successful
function startContinuousInjection() {
  console.log('Starting continuous button injection monitoring');
  
  // Try to inject every second for up to 60 seconds (1 minute)
  let attempts = 0;
  let maxAttempts = 60;
  
  let injectionInterval = setInterval(() => {
    attempts++;
    console.log(`Attempting to inject button (attempt ${attempts}/${maxAttempts})`);
    
    if (injectButtonToSelector() || attempts >= maxAttempts) {
      console.log('Button successfully injected or max attempts reached, stopping continuous injection');
      clearInterval(injectionInterval);
    }
  }, 1000); // Try every second
  
  // Set up a persistent mutation observer to monitor DOM changes
  setupPersistentObserver();
}

// Set up a persistent observer that continues monitoring even after successful injection
function setupPersistentObserver() {
  console.log('Setting up persistent DOM observer');
  
  const observer = new MutationObserver(function(mutations) {
    // If button is missing, try to inject it again
    if (!isButtonStillPresent()) {
      console.log('Button disappeared, attempting to reinject');
      injectButtonToSelector();
    }
  });
  
  // Start observing the document body for DOM changes
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    characterData: true
  });
  
  // Also monitor for URL changes (SPA navigation)
  monitorURLChanges();
}

// Monitor for URL changes in single page applications
function monitorURLChanges() {
  let lastUrl = location.href;
  
  // Create a new observer to watch for URL changes
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('URL changed, checking if button needs to be reinjected');
      
      // Wait a bit for the new page to load its elements
      setTimeout(() => {
        if (!isButtonStillPresent()) {
          console.log('Button not found after URL change, injecting again');
          injectButtonToSelector();
        }
      }, 1500);
    }
  });
  
  // Start observing
  urlObserver.observe(document, { subtree: true, childList: true });
  
  // Also hook into history API
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    
    // Wait a bit for the new page to load its elements
    setTimeout(() => {
      if (!isButtonStillPresent()) {
        console.log('History API navigation detected, injecting button');
        injectButtonToSelector();
      }
    }, 1500);
  };
}

// Try to inject the button when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Try immediately after DOM is loaded
  if (!injectButtonToSelector()) {
    // If initial injection fails, start continuous injection
    console.log('Initial injection failed, starting continuous injection');
    startContinuousInjection();
  } else {
    // Even if initial injection succeeds, set up persistent monitoring
    setupPersistentObserver();
  }
});

// Also try when the window has fully loaded (including images)
window.addEventListener('load', function() {
  if (!isButtonStillPresent()) {
    console.log('Button not found after window load, trying injection again');
    if (!injectButtonToSelector()) {
      startContinuousInjection();
    } else {
      setupPersistentObserver();
    }
  } else {
    // Button exists but still set up persistent monitoring
    setupPersistentObserver();
  }
});

console.log("Break Medium content script loaded");

// Function to inject button into the specified selector
function injectButtonToSelector() {
  try {
    // The complex selector path
    const targetElement = document.querySelector(
      '#root > div > div.l.c > div.l.m.n.o.c > div.p.q.r.ab.ac'
    );
    
    if (targetElement) {
      // Create the button
      const button = document.createElement('button');
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
    } else {
      console.error('Target element not found for selector: #root > div > div.l.c > div.l.m.n.o.c > div.p.q.r.ab.ac');
      // Try to find similar elements to help with debugging
      const rootElement = document.querySelector('#root');
      if (rootElement) {
        console.log('Root element exists, the selector might have changed');
      }
    }
  } catch (error) {
    console.error('Error injecting button:', error);
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

// Try to inject the button when the page loads and also add a retry mechanism
document.addEventListener('DOMContentLoaded', function() {
  // Try immediately after DOM is loaded
  injectButtonToSelector();
  
  // And also try after a short delay to ensure the target element is rendered
  setTimeout(injectButtonToSelector, 2000);
  
  // Set up a mutation observer to watch for changes in the DOM
  const observer = new MutationObserver(function(mutations) {
    injectButtonToSelector();
  });
  
  // Start observing the document body for DOM changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Stop the observer after 10 seconds to avoid unnecessary processing
  setTimeout(function() {
    observer.disconnect();
  }, 10000);
});

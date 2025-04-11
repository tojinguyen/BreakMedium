document.addEventListener('DOMContentLoaded', function() {
  const breakMediumButton = document.getElementById('breakMediumButton');
  const statusDiv = document.getElementById('status');
  
  // Add click event to the button
  breakMediumButton.addEventListener('click', function() {
    // Get the current active tab URL
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      console.log("Current URL: " + currentUrl);
      
      // Check if we're on a Medium site
      if (currentUrl.includes('medium.com') || currentUrl.includes('towardsdatascience.com')) {
        // Create the freedium URL
        const freediumUrl = 'https://freedium.cfd/' + currentUrl;
        
        // Redirect to the freedium URL
        chrome.tabs.update({url: freediumUrl});
        statusDiv.textContent = "Redirecting to Freedium...";
      } else {
        statusDiv.textContent = "Not a Medium article. No action taken.";
      }
    });
  });

  // Display auto-injection status
  const injectButtonElement = document.getElementById('injectButton');
  if (injectButtonElement) {
    injectButtonElement.textContent = "Injection is Automatic";
    statusDiv.textContent = "Medium articles are automatically injected when loaded";
    
    injectButtonElement.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        const isMediumSite = tab.url.includes('medium.com') || 
                             tab.url.includes('towardsdatascience.com');
        
        if (isMediumSite) {
          // Manual injection still available if needed
          chrome.tabs.sendMessage(tab.id, { action: "injectButton" });
          statusDiv.textContent = "Button injection triggered (already automatic)";
        } else {
          statusDiv.textContent = "Not a Medium article. Cannot inject button.";
        }
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const breakMediumButton = document.getElementById('breakMediumButton');
  const statusDiv = document.getElementById('status');

  breakMediumButton.addEventListener('click', function() {
    statusDiv.textContent = "Processing...";
    statusDiv.style.color = "#03a87c"; // Set status color to match theme

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentUrl = tabs[0].url;

      if (currentUrl.includes('medium.com') || currentUrl.includes('towardsdatascience.com')) {
        const freediumUrl = 'https://freedium.cfd/' + currentUrl;
        chrome.tabs.update(tabs[0].id, { url: freediumUrl }); // Update the current tab's URL
        statusDiv.textContent = "Redirecting to Freedium...";
        
        // Show success notification
        chrome.notifications.create(
          '', // Provide an empty string for the notification ID
          {
            type: "basic",
            iconUrl: "images/icon48.png",
            title: "Break Medium",
            message: "You are being redirected to Freedium for unlimited access."
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error("Notification error:", chrome.runtime.lastError.message);
            }
          }
        );
      } else {
        statusDiv.textContent = "This is not a Medium article.";
        statusDiv.style.color = "#d9534f"; // Error color
      }
    });
  });
});

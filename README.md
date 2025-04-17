# BreakMedium

A Chrome extension that makes Medium articles more accessible by bypassing the paywall.

> **Important Disclaimer:** This extension is intended only for users who genuinely cannot afford to pay for Medium subscriptions. We strongly encourage supporting content creators by paying for Medium membership if you have the means to do so, as this provides the best reading experience and directly supports the authors who create the content you enjoy. This tool exists as a last resort for educational purposes, not as a replacement for a proper subscription.

## Description

BreakMedium is a lightweight Chrome extension that helps you read Medium articles without hitting the paywall. When you encounter a premium Medium article, the extension adds a "Break Medium" button to the page that redirects you to [Freedium](https://freedium.cfd/), allowing you to read the full article without a Medium subscription.

## Features

- **One-Click Access**: Adds a "Break Medium" button directly on Medium article pages
- **Automatic Detection**: Only appears on premium/member-only Medium articles
- **Customizable Settings**:
  - Toggle dark mode for the extension interface
  - Enable/disable the redirect button
  - Choose to open articles in a new tab or the current tab
- **Responsive Design**: Works on all screen sizes
- **Visual Feedback**: Beautiful animations and ripple effects
- **Cross-Browser Compatibility**: Designed with compatibility in mind

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (link to be added)
2. Click "Add to Chrome"
3. Confirm the installation when prompted

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the downloaded folder
5. The extension should now be installed and active

## Usage

1. Visit any premium article on Medium or Towards Data Science
2. Look for the green "Break Medium" button that appears in the navigation bar
3. Click the button to read the article without restrictions
4. Customize your experience through the extension popup by clicking the extension icon in your browser toolbar

## How It Works

BreakMedium detects when you're viewing a premium Medium article and injects a button into the page. When clicked, it redirects you to Freedium.cfd, which serves as a proxy to bypass Medium's paywall, allowing you to read the full article without a subscription.

## Technical Details

- **Manifest V3**: Built using the latest Chrome extension manifest version
- **Content Script**: Injects the "Break Medium" button on Medium pages
- **Background Service Worker**: Handles persistent functionality across the browser
- **Storage API**: Saves user preferences
- **Responsive Design**: Adapts to different screen sizes
- **Cross-Browser Compatibility**: Includes fallbacks for different browser implementations

## Privacy

BreakMedium does not collect any user data. It only requires permissions to:
- Access tabs to detect Medium articles
- Modify content on Medium domains to add the button
- Store your preferences locally

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests to help improve the extension.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Freedium](https://freedium.cfd/) for providing the service that makes Medium articles accessible
- All contributors and users who help improve this extension

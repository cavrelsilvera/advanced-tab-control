# Advanced Tab Control - Chrome Extension

A powerful Chrome extension that gives you complete control over tab behavior, including tab closing order, link opening behavior, and per-site customization.

## Features

### 🎯 Tab Close Control
- **Directional Activation**: Choose whether closing a tab activates the tab to the left or right
- **Smart Handling**: Properly handles edge cases like closing the first or last tab
- **Prevents Race Conditions**: Carefully designed to handle rapid tab closing without conflicts

### 🆕 New Tab Behavior
- **Position Control**: Open new tabs to the left or right of the current tab
- **Activation Control**: Choose whether new tabs open in foreground or background
- **Link Behavior**: Set default behavior for clicking links (new tab vs same tab)

### 🪟 Popup Management
- **Convert to Tabs**: Automatically convert popup windows to tabs
- **Foreground/Background**: Control whether converted popups appear in foreground or background
- **Keep as Popup**: Option to keep traditional popup behavior

### 🌐 Site-Specific Settings
- **Per-Site Customization**: Configure different behaviors for different websites
- **Easy Management**: Add, edit, and delete site-specific rules from the popup interface
- **Domain-Based**: Settings apply to entire domains (e.g., all pages on github.com)

## Installation

### From Source (Developer Mode)

1. **Download the Extension**
   - Download and extract the extension ZIP file
   - Or clone this repository

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or use Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `tab-control-extension` folder
   - The extension icon should appear in your toolbar

## Usage

### Accessing Settings

There are two ways to access settings:

1. **Popup Interface** - Click the extension icon in your Chrome toolbar for quick access to basic settings
2. **Full Options Page** - Right-click the extension icon and select "Options" OR click "Open Full Settings Page" in the popup for the complete interface with better organization

### General Settings Tab

Configure default behavior for all sites:

1. **Tab Close Behavior**
   - Choose to activate the tab to the left or right when closing tabs
   - Example: With "Left" selected, closing Tab 3 will activate Tab 2

2. **New Tab Position**
   - Control where new tabs appear relative to the current tab
   - "Right" places new tabs immediately after the current one

3. **New Tab Activation**
   - Foreground: Immediately switch to the new tab
   - Background: Stay on the current tab

4. **Link Behavior**
   - New Tab: All links open in a new tab
   - Same Tab: Links open in the current tab
   - Note: Ctrl/Cmd+Click always opens in a new tab regardless of this setting

5. **Popup Behavior**
   - Convert to Tab (Background): Opens popups as background tabs
   - Convert to Tab (Foreground): Opens popups as foreground tabs
   - Keep as Popup: Maintains traditional popup window behavior

### Site-Specific Settings Tab

Create custom rules for specific websites:

1. **Current Site**
   - Shows the hostname of your current tab
   - Click "Configure This Site" to add/edit settings

2. **Configure a Site**
   - Enable/disable custom settings with the checkbox
   - Set all the same options available in general settings
   - Settings only apply when "Enable custom settings" is checked

3. **Manage Configured Sites**
   - View all sites with custom settings
   - Edit or delete settings for any site
   - Settings are saved automatically

## Technical Details

### How It Works

The extension uses several Chrome APIs to provide robust tab control:

1. **Background Service Worker**
   - Monitors tab events (close, create, activate, move)
   - Manages tab state and handles activation logic
   - Stores and retrieves settings from Chrome sync storage

2. **Content Scripts**
   - Intercepts link clicks on web pages
   - Applies site-specific behavior based on settings
   - Handles middle-click and keyboard modifiers (Ctrl/Cmd)

3. **Smart Tab Tracking**
   - Maintains internal state of all tabs
   - Handles edge cases like rapid tab closing
   - Prevents race conditions with closing tab detection

### Edge Cases Handled

- **Window Closing**: Doesn't interfere when closing entire windows
- **Last Tab**: Properly wraps around when closing first/last tabs
- **Rapid Closing**: Handles multiple quick tab closures gracefully
- **Tab Movements**: Updates tracking when tabs are moved/reordered
- **Duplicate Tabs**: Each tab is tracked independently by ID

### Permissions

The extension requires these permissions:

- **tabs**: To monitor and control tab behavior
- **storage**: To save your settings (synced across devices)
- **webNavigation**: To handle popups and navigation events
- **host_permissions** (<all_urls>): To inject content scripts for link handling

## Troubleshooting

### Extension Not Working

1. Check that the extension is enabled in `chrome://extensions/`
2. Try reloading the extension
3. Refresh any open tabs

### Settings Not Saving

1. Check Chrome sync status (settings sync across devices if enabled)
2. Try clearing extension storage and reconfiguring
3. Check browser console for error messages

### Tab Activation Issues

1. Verify your settings in the popup
2. Check if site-specific settings are overriding general settings
3. Some system operations may bypass the extension

### Link Behavior Not Working

1. Refresh the page after changing settings
2. Check that content scripts are injected (visible in extension details)
3. Some sites may prevent script injection (security restrictions)

## Development

### File Structure

```
tab-control-extension/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js            # Content script for link handling
├── popup.html            # Settings popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Key Functions

**background.js**
- `initSettings()`: Load settings from storage
- `getSettingsForUrl()`: Get effective settings for a URL
- `chrome.tabs.onRemoved`: Handle tab closing and activation
- `handleLinkClick()`: Process link clicks from content script

**content.js**
- `shouldInterceptLink()`: Determine if a link should be intercepted
- `handleLinkClick()`: Process clicks and send to background

**popup.js**
- `loadSettings()`: Load current settings
- `saveGeneralSettings()`: Save general settings
- `saveSiteSettings()`: Save site-specific settings

## Privacy

This extension:
- ✅ Stores settings locally and in Chrome sync (if enabled)
- ✅ Does not collect any personal data
- ✅ Does not send data to external servers
- ✅ Only monitors tabs and links as needed for functionality
- ✅ Open source - you can review all code

## License

**Proprietary License - All Rights Reserved**

This software is proprietary and confidential. Distribution, modification, or commercial use is prohibited without express written consent from the copyright holder.

For licensing inquiries or permission requests, please see the [LICENSE](LICENSE) file.

## Support

For issues, feature requests, or questions:
1. Check the Troubleshooting section
2. Review the code comments for technical details
3. Open an issue on the repository

## Version History

**v1.0.0** (Initial Release)
- Tab close activation control (left/right)
- New tab position and activation control
- Link behavior customization
- Popup window management
- Per-site settings
- Clean, intuitive interface

---

Made with ❤️ for better tab management

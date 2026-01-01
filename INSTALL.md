# Quick Installation Guide

## Step-by-Step Installation

### 1. Extract the ZIP File
- Download `tab-control-extension.zip`
- Extract it to a permanent location (don't delete this folder after installation!)
- Suggested location: `Documents/ChromeExtensions/tab-control-extension`

### 2. Open Chrome Extensions Page
- Open Google Chrome
- Type `chrome://extensions/` in the address bar and press Enter
- OR click Menu (⋮) → More Tools → Extensions

### 3. Enable Developer Mode
- Look for the "Developer mode" toggle in the top-right corner
- Click it to turn it ON (it should turn blue)

### 4. Load the Extension
- Click the "Load unpacked" button (appears after enabling Developer mode)
- Navigate to and select the `tab-control-extension` folder
- Click "Select Folder" or "Open"

### 5. Verify Installation
- You should see "Advanced Tab Control" in your extensions list
- The extension icon should appear in your Chrome toolbar
- If you don't see it, click the puzzle piece icon and pin it

## First-Time Setup

1. **Click the extension icon** in your toolbar
2. **Configure your preferences** in the "General" tab:
   - Set tab close activation (left or right)
   - Choose new tab position and activation
   - Set link behavior
   - Configure popup behavior

3. **Click "Save Settings"**

4. **Optional: Configure site-specific settings**
   - Switch to the "Site-Specific" tab
   - Navigate to a website you want to customize
   - Click "Configure This Site"
   - Enable custom settings and configure as desired

## Testing the Extension

### Test Tab Close Behavior
1. Open several tabs
2. Close the middle tab
3. Verify that the correct adjacent tab becomes active

### Test New Tab Behavior
1. Click a link (or Ctrl+Click)
2. Verify the new tab opens in the correct position
3. Check if it opens in foreground or background as configured

### Test Site-Specific Settings
1. Configure a site (e.g., github.com)
2. Navigate to that site
3. Test that the custom behavior applies

## Troubleshooting Installation

### Extension Not Loading
- Make sure you selected the correct folder (should contain `manifest.json`)
- Check for error messages in the extensions page
- Try refreshing the extensions page

### Extension Disappears After Chrome Restart
- This means the folder was deleted or moved
- Extract to a permanent location
- Reload the extension

### Icons Not Showing
- This is normal and doesn't affect functionality
- Icons are included in the icons/ folder

### Settings Not Working
- Refresh any open tabs after changing settings
- Check that the extension is enabled
- Look for any error messages in the Chrome console

## Updating the Extension

When a new version is released:
1. Download the new ZIP file
2. Extract it to the SAME location (overwrite old files)
3. Go to `chrome://extensions/`
4. Click the refresh icon on the Advanced Tab Control card
5. Your settings will be preserved

## Uninstalling

To remove the extension:
1. Go to `chrome://extensions/`
2. Find "Advanced Tab Control"
3. Click "Remove"
4. Optionally delete the extension folder

Your settings are stored in Chrome sync, so they'll be available if you reinstall.

---

Need help? Check the full README.md for detailed documentation.

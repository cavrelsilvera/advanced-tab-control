# Troubleshooting Link Behavior Issues

If links are opening inconsistently (sometimes in new tabs, sometimes in the same tab), follow this guide.

## Step 1: Enable Debug Mode

1. Right-click the extension icon → **Options**
2. Scroll to **Advanced Options** section
3. Set **Debug Mode** to **Enabled**
4. Click **Save Settings**
5. **Reload the page** you're testing on (F5 or Ctrl+R)

## Step 2: Test and Check Console

1. Open the browser console:
   - Press **F12** or
   - Right-click → **Inspect** → **Console** tab

2. Click a link on the page

3. Look for messages starting with `[TabControl]`:
   ```
   [TabControl] Click detected on link: https://example.com
   [TabControl] Current settings: {linkBehavior: "newTab", ...}
   [TabControl] Normal left click, linkBehavior: newTab
   [TabControl] Opening in new tab per settings
   ```

## Common Issues and Solutions

### Issue 1: No Debug Messages Appear

**Cause**: Content script isn't loaded on the page.

**Solutions**:
- Reload the page (F5)
- Check if the page URL is a special page (chrome://, edge://, etc.) - extensions can't run on these
- Verify the extension is enabled in `chrome://extensions/`
- Try disabling and re-enabling the extension

### Issue 2: "Link should not be intercepted" Message

**Cause**: The link has special attributes that tell the extension to skip it.

**Check**:
- Does the link have `target="_self"`? → This forces same-tab behavior
- Is it a special protocol (mailto:, tel:, javascript:)? → These are not intercepted
- Does it have a `download` attribute? → Download links are not intercepted
- Is it just a `#` anchor link? → These are not intercepted

**Solution**: This is expected behavior for these types of links.

### Issue 3: Link Opens in Same Tab Despite Setting

**Possible Causes**:

1. **Website prevents the extension from working**
   - Some sites use Shadow DOM or special frameworks that hide links
   - Some sites block all click events
   - Solution: Check console for errors, may need to add site to exceptions

2. **Link is created dynamically after page load**
   - The link wasn't present when the content script loaded
   - Solution: This should work, but if not, report which site

3. **Other extension conflict**
   - Another extension might be handling the link first
   - Solution: Temporarily disable other extensions to test

4. **Settings cache issue**
   - Old settings are cached
   - Solution: Save settings again, then reload the page

### Issue 4: Link Opens in New Tab Despite "Same Tab" Setting

**Possible Causes**:

1. **Link has target="_blank"**
   - Websites can force links to open in new tabs
   - Solution: This is intentional - target="_blank" is respected

2. **You're Ctrl/Cmd+clicking**
   - This always opens in new tab (browser standard)
   - Solution: This is expected behavior

3. **You're middle-clicking**
   - This always opens in new tab (browser standard)
   - Solution: This is expected behavior

### Issue 5: Tab "Jumps" or Switches Focus When Opening in Background

**Symptoms**: You set "New Tab Activation" to "Background" but the tab briefly flashes into view or activates momentarily.

**Cause**: This is a Chrome limitation. When creating a tab with `active: false`, Chrome sometimes briefly activates it anyway, especially if:
- The tab loads very quickly
- The website redirects immediately
- Chrome's internal processes interfere

**What the extension does**:
1. Creates tab with `active: false`
2. Detects if Chrome activated it anyway
3. Immediately switches back to the original tab
4. Checks again after 50ms to catch delayed switches

**This results in**:
- Brief flicker (unavoidable with current Chrome APIs)
- Quick return to original tab
- Console logs show the detection and correction (when debug mode is on)

**Console output you'll see**:
```
[TabControl Background] Tab activated unexpectedly! Attempting to reactivate original tab...
[TabControl Background] Successfully reactivated original tab
[TabControl Background] Detected activation of background tab
[TabControl Background] Reverting to original tab
```

**Solutions**:
1. This is the best we can do with current Chrome APIs
2. The flicker is usually < 100ms
3. Alternative: Use a different browser (Firefox has better tab control APIs)
4. Alternative: Accept the brief flicker as a Chrome limitation

**Not a bug**: This behavior is Chrome forcing activation despite our settings, and the extension is actively fighting it.

## Step 3: Test Different Scenarios

With debug mode enabled, test these scenarios and note the console output:

1. **Normal left-click** on a regular link
   - Expected: Opens according to your "Link Behavior" setting
   - Console should show: "Normal left click, linkBehavior: [your setting]"

2. **Ctrl+Click** (or Cmd+Click on Mac)
   - Expected: Always opens in new tab
   - Console should show: "Explicit new tab intent"

3. **Middle-click** (click scroll wheel)
   - Expected: Always opens in new tab
   - Console should show: "Middle-click detected"

4. **Link with target="_blank"**
   - Expected: Always opens in new tab
   - Console should show: "target=_blank"

## Step 4: Check Site-Specific Settings

1. Go to **Options** → **Site-Specific Rules** tab
2. Check if the current site has custom settings
3. Site-specific settings override general settings
4. Try removing site-specific settings to test

## Step 5: Verify Settings Are Saved

1. Open **Options** page
2. Check that "Link Behavior" shows your desired setting
3. Make sure you clicked **Save Settings**
4. Check the success message appears

## Step 6: Force Refresh Content Script

If settings seem stuck:

1. Go to `chrome://extensions/`
2. Find "Advanced Tab Control"
3. Click the **refresh icon** (circular arrow)
4. **Reload all open tabs** (close and reopen or use Ctrl+Shift+R)

## Still Having Issues?

If none of the above helps, please provide:

1. The website URL where it's not working
2. Your current settings (screenshot of Options page)
3. Debug console output when clicking a link
4. Which browser and version you're using
5. List of other extensions you have enabled

## Known Limitations

- Cannot work on Chrome internal pages (chrome://, edge://)
- Some websites with strict Content Security Policy may block the extension
- Shadow DOM elements may not be intercepted
- Extensions cannot modify browser's own UI links

## Quick Reset

If all else fails:

1. Go to **Options** → **General Settings**
2. Click **Reset to Defaults**
3. Go to `chrome://extensions/`
4. Click the refresh icon on "Advanced Tab Control"
5. Reload all pages you want to test
6. Reconfigure your settings

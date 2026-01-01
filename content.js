// Content script for site-specific link behavior

let cachedSettings = null;
let currentHostname = null;

// Get current page hostname
try {
  currentHostname = new URL(window.location.href).hostname;
} catch (e) {
  console.error('[ATC] Failed to get hostname:', e);
}

// Load settings on page load
chrome.storage.sync.get("settings", ({ settings }) => {
  if (!settings) return;
  cachedSettings = settings;
  
  // Get effective settings for current site
  const effectiveSettings = getEffectiveSettings();
  
  if (settings.debugMode) {
    console.log('[ATC Content] Loaded on:', currentHostname);
    console.log('[ATC Content] Effective settings:', effectiveSettings);
  }
});

// Listen for settings updates
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) {
    cachedSettings = changes.settings.newValue;
    if (cachedSettings?.debugMode) {
      console.log('[ATC Content] Settings updated:', getEffectiveSettings());
    }
  }
});

// Get effective settings for current site
function getEffectiveSettings() {
  if (!cachedSettings || !currentHostname) return cachedSettings;
  
  // Check if there's a site-specific override
  const siteSettings = cachedSettings.siteSettings?.[currentHostname];
  
  if (siteSettings && siteSettings.enabled !== false) {
    // Merge site settings with defaults
    return { ...cachedSettings, ...siteSettings };
  }
  
  return cachedSettings;
}

// Handle link clicks
document.addEventListener("click", async (e) => {
  const a = e.target.closest("a");
  if (!a || !a.href) return;
  
  // Don't intercept special modifier clicks or middle-click
  if (e.ctrlKey || e.metaKey || e.button === 1) return;
  
  // Don't intercept special protocols
  if (a.href.startsWith('javascript:') || 
      a.href.startsWith('mailto:') || 
      a.href.startsWith('tel:')) {
    return;
  }
  
  // Don't intercept download links
  if (a.hasAttribute('download')) return;
  
  // Get effective settings for THIS page (not the link destination)
  const settings = getEffectiveSettings();
  if (!settings) return;
  
  // Check if we should open in new tab
  if (settings.linkBehavior !== "newTab") return;
  
  if (settings.debugMode) {
    console.log('[ATC Content] Intercepting link:', a.href);
    console.log('[ATC Content] Using settings:', {
      linkBehavior: settings.linkBehavior,
      newTabPosition: settings.newTabPosition,
      newTabActivation: settings.newTabActivation
    });
  }
  
  // Prevent default navigation
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  
  try {
    // Send message to background to open the link with proper positioning
    await chrome.runtime.sendMessage({
      type: 'OPEN_LINK',
      url: a.href,
      settings: settings
    });
  } catch (error) {
    console.error('[ATC Content] Error opening link:', error);
    // Fallback to simple window.open
    window.open(a.href, '_blank');
  }
}, true);

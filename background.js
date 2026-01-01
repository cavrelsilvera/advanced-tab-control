/*
 Advanced Tab Control – Close Activation FIX
 Proper tab index tracking to prevent Chrome from overriding our choice
*/

const ATC_SCHEMA_VERSION = 1;

const DEFAULT_SETTINGS = {
  schemaVersion: ATC_SCHEMA_VERSION,
  closeTabActivation: "left", // or "right"
  newTabPosition: "right",
  newTabActivation: "background",
  linkBehavior: "newTab",
  popupBehavior: "tab-background",
  debugMode: true,
  siteSettings: {}
};

let cachedSettings = null;

// Per-window state - track tab indices BEFORE close
const winState = new Map(); // windowId -> { lastActive, tabIndexMap }

function debug(event, data = {}) {
  if (cachedSettings?.debugMode) {
    console.log("[ATC]", event, data);
  }
}

async function loadSettings() {
  const { settings } = await chrome.storage.sync.get("settings");
  cachedSettings = settings || DEFAULT_SETTINGS;
  if (!settings) await chrome.storage.sync.set({ settings: cachedSettings });
  debug("SERVICE_WORKER_START");
}

chrome.runtime.onInstalled.addListener(loadSettings);
chrome.runtime.onStartup.addListener(loadSettings);
chrome.storage.onChanged.addListener((c, area) => {
  if (area === "sync" && c.settings) cachedSettings = c.settings.newValue;
});

// Update tab index map for a window
async function updateTabIndexMap(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    const s = winState.get(windowId) || {};
    s.tabIndexMap = new Map();
    tabs.forEach((tab, index) => {
      s.tabIndexMap.set(tab.id, index);
    });
    winState.set(windowId, s);
    debug("INDEX_MAP_UPDATED", { windowId, tabCount: tabs.length });
  } catch (e) {
    debug("INDEX_MAP_ERROR", { error: e.message });
  }
}

// Track last active and update indices
chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  const s = winState.get(windowId) || {};
  s.lastActive = tabId;
  winState.set(windowId, s);
  debug("TAB_ACTIVATED", { tabId, windowId });
  
  // Update index map
  await updateTabIndexMap(windowId);
});

// Update indices when tabs are created
chrome.tabs.onCreated.addListener(async (tab) => {
  await updateTabIndexMap(tab.windowId);
});

// Update indices when tabs are moved
chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
  await updateTabIndexMap(moveInfo.windowId);
});

// Handle tab close
chrome.tabs.onRemoved.addListener(async (closedTabId, info) => {
  if (info.isWindowClosing) return;
  if (!cachedSettings) await loadSettings();

  const windowId = info.windowId;
  const s = winState.get(windowId) || {};
  
  // Get the index of the closed tab BEFORE it was removed
  const closedTabIndex = s.tabIndexMap?.get(closedTabId);
  
  debug("TAB_REMOVED", { 
    closedTabId, 
    closedTabIndex,
    wasLastActive: closedTabId === s.lastActive,
    mode: cachedSettings.closeTabActivation
  });
  
  // Only intervene if we closed the active tab
  if (closedTabId !== s.lastActive) {
    debug("SKIP_NOT_ACTIVE", { reason: "closed tab was not active" });
    await updateTabIndexMap(windowId);
    return;
  }
  
  if (closedTabIndex === undefined) {
    debug("SKIP_NO_INDEX", { reason: "no index tracked for closed tab" });
    await updateTabIndexMap(windowId);
    return;
  }

  // Get remaining tabs
  const tabs = await chrome.tabs.query({ windowId });
  if (tabs.length === 0) {
    debug("SKIP_NO_TABS", { reason: "no tabs remaining" });
    return;
  }

  // Compute target based on closed tab's index
  let targetIndex;
  if (cachedSettings.closeTabActivation === "left") {
    // Activate tab to the left
    targetIndex = closedTabIndex - 1;
    // If we were at index 0, wrap to last tab
    if (targetIndex < 0) {
      targetIndex = tabs.length - 1;
    }
  } else {
    // Activate tab to the right
    targetIndex = closedTabIndex;
    // Adjust if closed tab was at the end
    if (targetIndex >= tabs.length) {
      targetIndex = 0; // Wrap to first
    }
  }

  const targetTab = tabs[targetIndex];
  
  debug("COMPUTED_TARGET", { 
    closedTabIndex,
    targetIndex,
    targetTabId: targetTab?.id,
    targetTabUrl: targetTab?.url?.substring(0, 50)
  });

  if (!targetTab) {
    debug("SKIP_NO_TARGET", { reason: "target tab not found" });
    await updateTabIndexMap(windowId);
    return;
  }

  // IMMEDIATE activation - beat Chrome's default
  try {
    await chrome.tabs.update(targetTab.id, { active: true });
    debug("FORCE_ACTIVATE_SUCCESS", { targetId: targetTab.id });
    s.lastActive = targetTab.id;
    winState.set(windowId, s);
  } catch (e) {
    debug("FORCE_ACTIVATE_FAILED", { error: e.message });
  }
  
  // Update index map after the close
  await updateTabIndexMap(windowId);
});

// Message handler for settings and link opening
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    let { settings } = await chrome.storage.sync.get("settings");
    settings = settings || DEFAULT_SETTINGS;
    switch (msg.type) {
      case "GET_ALL_SETTINGS":
        sendResponse(settings);
        break;
      case "UPDATE_SETTINGS":
        settings = { ...settings, ...msg.settings };
        await chrome.storage.sync.set({ settings });
        cachedSettings = settings;
        sendResponse(true);
        break;
      case "SAVE_SITE_SETTINGS":
        if (!settings.siteSettings) settings.siteSettings = {};
        settings.siteSettings[msg.hostname] = msg.siteSettings;
        await chrome.storage.sync.set({ settings });
        cachedSettings = settings;
        sendResponse({ success: true });
        break;
      case "DELETE_SITE_SETTINGS":
        if (settings.siteSettings && settings.siteSettings[msg.hostname]) {
          delete settings.siteSettings[msg.hostname];
          await chrome.storage.sync.set({ settings });
          cachedSettings = settings;
        }
        sendResponse({ success: true });
        break;
      case "OPEN_LINK":
        try {
          // Use settings passed from content script (which may be site-specific)
          const effectiveSettings = msg.settings || settings;
          
          // Get current tab
          const currentTab = sender.tab;
          
          // Calculate new tab position
          const newTabIndex = effectiveSettings.newTabPosition === 'left' 
            ? currentTab.index 
            : currentTab.index + 1;
          
          // Determine activation
          const shouldActivate = effectiveSettings.newTabActivation === 'foreground';
          
          debug("OPEN_LINK", {
            url: msg.url.substring(0, 50),
            position: effectiveSettings.newTabPosition,
            activation: effectiveSettings.newTabActivation,
            index: newTabIndex,
            active: shouldActivate
          });
          
          // Create the new tab
          const newTab = await chrome.tabs.create({
            url: msg.url,
            index: newTabIndex,
            active: shouldActivate,
            openerTabId: currentTab.id
          });
          
          // Update index map
          await updateTabIndexMap(currentTab.windowId);
          
          sendResponse({ success: true });
        } catch (error) {
          debug("OPEN_LINK_FAILED", { error: error.message });
          sendResponse({ success: false, error: error.message });
        }
        break;
    }
  })();
  return true;
});

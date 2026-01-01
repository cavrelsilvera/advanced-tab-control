// Options page script

let currentSettings = null;
let editingHostname = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  updateUI();
  setupEventListeners();
});

// Load settings
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_SETTINGS' });
    currentSettings = response;
  } catch (error) {
    console.error('Error loading settings:', error);
    showMessage('generalMessage', 'error', 'Error loading settings');
  }
}

// Update UI with current settings
function updateUI() {
  // General settings
  document.getElementById('closeTabActivation').value = currentSettings.closeTabActivation;
  document.getElementById('newTabPosition').value = currentSettings.newTabPosition;
  document.getElementById('newTabActivation').value = currentSettings.newTabActivation;
  document.getElementById('linkBehavior').value = currentSettings.linkBehavior;
  document.getElementById('popupBehavior').value = currentSettings.popupBehavior;
  document.getElementById('debugMode').value = currentSettings.debugMode ? 'true' : 'false';
  
  // Update site list
  updateSiteList();
}

// Update site list display
function updateSiteList() {
  const listContainer = document.getElementById('siteList');
  const sites = Object.keys(currentSettings.siteSettings || {});
  
  if (sites.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🌐</div>
        <p>No site-specific rules configured yet</p>
      </div>
    `;
    return;
  }
  
  listContainer.innerHTML = '';
  
  sites.forEach(hostname => {
    const siteSettings = currentSettings.siteSettings[hostname];
    const card = document.createElement('div');
    card.className = 'site-card';
    
    card.innerHTML = `
      <div class="site-card-header">
        <div class="site-card-name">${hostname}</div>
        <div class="site-card-actions">
          <button class="btn-edit" data-hostname="${hostname}">✏️ Edit</button>
          <button class="btn-delete" data-hostname="${hostname}">🗑️ Delete</button>
        </div>
      </div>
      <div class="site-card-settings">
        <div>
          <span class="label">Close activation:</span>
          <span class="value">${siteSettings.closeTabActivation === 'left' ? '← Left' : 'Right →'}</span>
        </div>
        <div>
          <span class="label">New tab position:</span>
          <span class="value">${siteSettings.newTabPosition === 'left' ? '← Left' : 'Right →'}</span>
        </div>
        <div>
          <span class="label">New tab activation:</span>
          <span class="value">${siteSettings.newTabActivation === 'foreground' ? 'Foreground' : 'Background'}</span>
        </div>
        <div>
          <span class="label">Link behavior:</span>
          <span class="value">${siteSettings.linkBehavior === 'newTab' ? 'New Tab' : 'Same Tab'}</span>
        </div>
        <div>
          <span class="label">Popup behavior:</span>
          <span class="value">${getPopupLabel(siteSettings.popupBehavior)}</span>
        </div>
      </div>
    `;
    
    listContainer.appendChild(card);
  });
  
  // Add event listeners to cards
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editSite(btn.dataset.hostname));
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteSite(btn.dataset.hostname));
  });
}

function getPopupLabel(value) {
  const labels = {
    'tab-background': 'Tab (Background)',
    'tab-foreground': 'Tab (Foreground)',
    'popup': 'Popup'
  };
  return labels[value] || value;
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // General settings
  document.getElementById('saveGeneral').addEventListener('click', saveGeneralSettings);
  document.getElementById('resetGeneral').addEventListener('click', resetGeneralSettings);
  
  // Site settings
  document.getElementById('addSiteBtn').addEventListener('click', addNewSite);
  document.getElementById('saveSiteBtn').addEventListener('click', saveSiteSettings);
  document.getElementById('cancelSiteBtn').addEventListener('click', cancelSiteEdit);
  
  // Enter key on hostname input
  document.getElementById('newSiteHostname').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addNewSite();
    }
  });
}

// Switch tabs
function switchTab(tabName) {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
}

// Save general settings
async function saveGeneralSettings() {
  const newSettings = {
    closeTabActivation: document.getElementById('closeTabActivation').value,
    newTabPosition: document.getElementById('newTabPosition').value,
    newTabActivation: document.getElementById('newTabActivation').value,
    linkBehavior: document.getElementById('linkBehavior').value,
    popupBehavior: document.getElementById('popupBehavior').value,
    debugMode: document.getElementById('debugMode').value === 'true'
  };
  
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: newSettings
    });
    
    currentSettings = { ...currentSettings, ...newSettings };
    showMessage('generalMessage', 'success', '✓ Settings saved successfully!');
    
    // Notify all tabs to refresh their settings
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' });
      } catch (e) {
        // Tab might not have content script
      }
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('generalMessage', 'error', '✗ Error saving settings');
  }
}

// Reset to defaults
async function resetGeneralSettings() {
  if (!confirm('Reset all general settings to defaults?')) {
    return;
  }
  
  const defaultSettings = {
    closeTabActivation: 'left',
    newTabPosition: 'right',
    newTabActivation: 'foreground',
    linkBehavior: 'newTab',
    popupBehavior: 'tab-background',
    debugMode: false
  };
  
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: defaultSettings
    });
    
    currentSettings = { ...currentSettings, ...defaultSettings };
    updateUI();
    showMessage('generalMessage', 'success', '✓ Settings reset to defaults');
  } catch (error) {
    console.error('Error resetting settings:', error);
    showMessage('generalMessage', 'error', '✗ Error resetting settings');
  }
}

// Add new site
function addNewSite() {
  const input = document.getElementById('newSiteHostname');
  let hostname = input.value.trim().toLowerCase();
  
  if (!hostname) {
    showMessage('siteMessage', 'error', '✗ Please enter a hostname');
    return;
  }
  
  // Clean up hostname
  hostname = hostname.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
  
  if (!hostname.includes('.')) {
    showMessage('siteMessage', 'error', '✗ Please enter a valid hostname (e.g., example.com)');
    return;
  }
  
  input.value = '';
  editSite(hostname, true);
}

// Edit site settings
function editSite(hostname, isNew = false) {
  editingHostname = hostname;
  
  document.getElementById('editingSiteName').textContent = hostname;
  
  // Load existing settings or use defaults
  const siteSettings = currentSettings.siteSettings[hostname] || {
    enabled: true,
    closeTabActivation: currentSettings.closeTabActivation,
    newTabPosition: currentSettings.newTabPosition,
    newTabActivation: currentSettings.newTabActivation,
    linkBehavior: currentSettings.linkBehavior,
    popupBehavior: currentSettings.popupBehavior
  };
  
  document.getElementById('siteCloseTabActivation').value = siteSettings.closeTabActivation;
  document.getElementById('siteNewTabPosition').value = siteSettings.newTabPosition;
  document.getElementById('siteNewTabActivation').value = siteSettings.newTabActivation;
  document.getElementById('siteLinkBehavior').value = siteSettings.linkBehavior;
  document.getElementById('sitePopupBehavior').value = siteSettings.popupBehavior;
  
  document.getElementById('siteForm').classList.add('active');
  document.getElementById('siteForm').scrollIntoView({ behavior: 'smooth' });
  
  if (isNew) {
    showMessage('siteMessage', 'success', `Configure settings for ${hostname}`);
  }
}

// Save site settings
async function saveSiteSettings() {
  if (!editingHostname) return;
  
  const siteSettings = {
    enabled: true,
    closeTabActivation: document.getElementById('siteCloseTabActivation').value,
    newTabPosition: document.getElementById('siteNewTabPosition').value,
    newTabActivation: document.getElementById('siteNewTabActivation').value,
    linkBehavior: document.getElementById('siteLinkBehavior').value,
    popupBehavior: document.getElementById('sitePopupBehavior').value
  };
  
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SITE_SETTINGS',
      hostname: editingHostname,
      siteSettings: siteSettings
    });
    
    currentSettings.siteSettings[editingHostname] = siteSettings;
    updateSiteList();
    cancelSiteEdit();
    showMessage('siteMessage', 'success', `✓ Settings saved for ${editingHostname}`);
  } catch (error) {
    console.error('Error saving site settings:', error);
    showMessage('siteMessage', 'error', '✗ Error saving site settings');
  }
}

// Delete site
async function deleteSite(hostname) {
  if (!confirm(`Delete all settings for ${hostname}?`)) {
    return;
  }
  
  try {
    await chrome.runtime.sendMessage({
      type: 'DELETE_SITE_SETTINGS',
      hostname: hostname
    });
    
    delete currentSettings.siteSettings[hostname];
    updateSiteList();
    
    if (editingHostname === hostname) {
      cancelSiteEdit();
    }
    
    showMessage('siteMessage', 'success', `✓ Settings deleted for ${hostname}`);
  } catch (error) {
    console.error('Error deleting site settings:', error);
    showMessage('siteMessage', 'error', '✗ Error deleting site settings');
  }
}

// Cancel site edit
function cancelSiteEdit() {
  editingHostname = null;
  document.getElementById('siteForm').classList.remove('active');
}

// Show message
function showMessage(elementId, type, text) {
  const messageDiv = document.getElementById(elementId);
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  
  setTimeout(() => {
    messageDiv.className = 'message';
  }, 4000);
}


// ===============================
// EXPORT / IMPORT (NON-DESTRUCTIVE)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.getElementById("exportPrefs");
  const importBtn = document.getElementById("importPrefs");
  const importFile = document.getElementById("importFile");

  if (!exportBtn || !importBtn || !importFile) return;

  exportBtn.addEventListener("click", async () => {
    const settings = await chrome.runtime.sendMessage({ type: "GET_ALL_SETTINGS" });
    const payload = {
      schemaVersion: settings.schemaVersion || 1,
      exportedAt: new Date().toISOString(),
      settings
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "advanced-tab-control-preferences.json";
    a.click();
  });

  importBtn.addEventListener("click", () => importFile.click());

  importFile.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const imported = parsed.settings || parsed;

      await chrome.runtime.sendMessage({
        type: "UPDATE_SETTINGS",
        settings: imported
      });

      if (typeof currentSettings === "object") {
        Object.assign(currentSettings, imported);
      }

      if (typeof updateUI === "function") updateUI();
      if (typeof updateSiteList === "function") updateSiteList();

    } catch (err) {
      console.error("Import failed", err);
    }
  });
});

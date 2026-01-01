// Popup script for Advanced Tab Control extension

let currentSettings = null;
let currentHostname = null;
let editingHostname = null;

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadCurrentSite();
  setupEventListeners();
  updateUI();
});

// Load settings from background
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_SETTINGS' });
    currentSettings = response;
  } catch (error) {
    console.error('Error loading settings:', error);
    showMessage('error', 'Error loading settings');
  }
}

// Load current site hostname
async function loadCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      currentHostname = url.hostname;
      document.getElementById('currentHostname').textContent = currentHostname;
    }
  } catch (error) {
    console.error('Error loading current site:', error);
    document.getElementById('currentHostname').textContent = 'Unable to detect';
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
  
  // Update configured sites list
  updateConfiguredSitesList();
}

// Update the list of configured sites
function updateConfiguredSitesList() {
  const listContainer = document.getElementById('configuredSitesList');
  const siteSettings = currentSettings.siteSettings || {};
  const sites = Object.keys(siteSettings);
  
  if (sites.length === 0) {
    listContainer.innerHTML = '<p class="description">No sites configured yet.</p>';
    return;
  }
  
  listContainer.innerHTML = '';
  
  sites.forEach(hostname => {
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    
    const siteName = document.createElement('div');
    siteName.className = 'site-item-name';
    siteName.textContent = hostname;
    
    const actions = document.createElement('div');
    actions.className = 'site-item-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => editSite(hostname);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteSite(hostname);
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    siteItem.appendChild(siteName);
    siteItem.appendChild(actions);
    
    listContainer.appendChild(siteItem);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Open full options page
  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // General settings
  document.getElementById('saveGeneral').addEventListener('click', saveGeneralSettings);
  document.getElementById('resetGeneral').addEventListener('click', resetGeneralSettings);
  
  // Site-specific settings
  document.getElementById('addCurrentSite').addEventListener('click', addCurrentSite);
  document.getElementById('siteEnabled').addEventListener('change', toggleSiteSettings);
  document.getElementById('saveSite').addEventListener('click', saveSiteSettings);
  document.getElementById('deleteSite').addEventListener('click', () => {
    if (editingHostname) {
      deleteSite(editingHostname);
    }
  });
  document.getElementById('cancelSite').addEventListener('click', cancelSiteEdit);
}

// Switch between tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Save general settings
async function saveGeneralSettings() {
  const newSettings = {
    closeTabActivation: document.getElementById('closeTabActivation').value,
    newTabPosition: document.getElementById('newTabPosition').value,
    newTabActivation: document.getElementById('newTabActivation').value,
    linkBehavior: document.getElementById('linkBehavior').value,
    popupBehavior: document.getElementById('popupBehavior').value
  };
  
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: newSettings
    });
    
    currentSettings = { ...currentSettings, ...newSettings };
    showMessage('success', 'Settings saved successfully!');
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('error', 'Error saving settings');
  }
}

// Reset to default settings
async function resetGeneralSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }
  
  const defaultSettings = {
    closeTabActivation: 'left',
    newTabPosition: 'right',
    newTabActivation: 'foreground',
    linkBehavior: 'newTab',
    popupBehavior: 'tab-background'
  };
  
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: defaultSettings
    });
    
    currentSettings = { ...currentSettings, ...defaultSettings };
    updateUI();
    showMessage('success', 'Settings reset to defaults');
  } catch (error) {
    console.error('Error resetting settings:', error);
    showMessage('error', 'Error resetting settings');
  }
}

// Add current site to configuration
function addCurrentSite() {
  if (!currentHostname) {
    showSiteMessage('error', 'Unable to detect current site');
    return;
  }
  
  editSite(currentHostname);
}

// Edit site settings
function editSite(hostname) {
  editingHostname = hostname;
  
  document.getElementById('configuringSite').textContent = hostname;
  document.getElementById('siteSettingsForm').classList.remove('hidden');
  
  // Load existing settings or defaults
  const siteSettings = currentSettings.siteSettings[hostname] || {
    enabled: false,
    closeTabActivation: currentSettings.closeTabActivation,
    newTabPosition: currentSettings.newTabPosition,
    newTabActivation: currentSettings.newTabActivation,
    linkBehavior: currentSettings.linkBehavior,
    popupBehavior: currentSettings.popupBehavior
  };
  
  document.getElementById('siteEnabled').checked = siteSettings.enabled;
  document.getElementById('siteCloseTabActivation').value = siteSettings.closeTabActivation;
  document.getElementById('siteNewTabPosition').value = siteSettings.newTabPosition;
  document.getElementById('siteNewTabActivation').value = siteSettings.newTabActivation;
  document.getElementById('siteLinkBehavior').value = siteSettings.linkBehavior;
  document.getElementById('sitePopupBehavior').value = siteSettings.popupBehavior;
  
  toggleSiteSettings();
  
  // Switch to site tab
  switchTab('site');
  
  // Scroll to form
  document.getElementById('siteSettingsForm').scrollIntoView({ behavior: 'smooth' });
}

// Toggle site-specific settings
function toggleSiteSettings() {
  const enabled = document.getElementById('siteEnabled').checked;
  const settingsDiv = document.getElementById('siteSpecificSettings');
  
  if (enabled) {
    settingsDiv.classList.remove('disabled');
  } else {
    settingsDiv.classList.add('disabled');
  }
}

// Save site settings
async function saveSiteSettings() {
  if (!editingHostname) return;
  
  const siteSettings = {
    enabled: document.getElementById('siteEnabled').checked,
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
    updateConfiguredSitesList();
    cancelSiteEdit();
    showSiteMessage('success', `Settings saved for ${editingHostname}`);
  } catch (error) {
    console.error('Error saving site settings:', error);
    showSiteMessage('error', 'Error saving site settings');
  }
}

// Delete site settings
async function deleteSite(hostname) {
  if (!confirm(`Delete settings for ${hostname}?`)) {
    return;
  }
  
  try {
    await chrome.runtime.sendMessage({
      type: 'DELETE_SITE_SETTINGS',
      hostname: hostname
    });
    
    delete currentSettings.siteSettings[hostname];
    updateConfiguredSitesList();
    
    if (editingHostname === hostname) {
      cancelSiteEdit();
    }
    
    showSiteMessage('success', `Settings deleted for ${hostname}`);
  } catch (error) {
    console.error('Error deleting site settings:', error);
    showSiteMessage('error', 'Error deleting site settings');
  }
}

// Cancel site edit
function cancelSiteEdit() {
  editingHostname = null;
  document.getElementById('siteSettingsForm').classList.add('hidden');
}

// Show message
function showMessage(type, text) {
  const messageDiv = document.getElementById('saveMessage');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  
  setTimeout(() => {
    messageDiv.className = 'message';
  }, 3000);
}

// Show site message
function showSiteMessage(type, text) {
  const messageDiv = document.getElementById('siteSaveMessage');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  
  setTimeout(() => {
    messageDiv.className = 'message';
  }, 3000);
}

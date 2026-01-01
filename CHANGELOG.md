# Changelog

All notable changes to the Advanced Tab Control extension will be documented in this file.

## [1.0.0] - 2025-12-31

### Initial Release

#### Features Added
- **Tab Close Control**
  - Activate tab to the left or right when closing tabs
  - Handles edge cases (first tab, last tab, single tab)
  - Prevents race conditions during rapid tab closing
  - Smart tab state tracking

- **New Tab Behavior**
  - Position control (left or right of current tab)
  - Activation control (foreground or background)
  - Link behavior customization (new tab vs same tab)
  - Respects keyboard modifiers (Ctrl/Cmd+Click)

- **Popup Window Management**
  - Convert popups to background tabs
  - Convert popups to foreground tabs
  - Keep popups as traditional windows
  - Automatic detection and conversion

- **Site-Specific Settings**
  - Per-domain configuration
  - Override general settings for specific sites
  - Easy management interface
  - Add, edit, delete site rules

- **User Interface**
  - Clean, modern popup design
  - Tabbed interface for organization
  - Real-time settings preview
  - Configured sites list
  - Success/error messages

#### Technical Implementation
- Manifest V3 compliance
- Background service worker architecture
- Content script injection for link handling
- Chrome sync storage for settings
- Comprehensive state management
- Edge case handling and error prevention

#### Documentation
- Complete README with feature descriptions
- Quick installation guide
- Troubleshooting section
- Technical details for developers
- Code comments throughout

### Known Limitations
- Some websites may block content script injection due to CSP
- System-level operations may bypass extension control
- Extension requires tabs permission to function

### Future Enhancements (Planned)
- Tab groups support
- Keyboard shortcuts
- Import/export settings
- Tab behavior patterns (e.g., "work mode", "browse mode")
- Statistics and usage tracking (optional)
- Dark mode for popup interface

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backwards compatible manner
- PATCH version for backwards compatible bug fixes

## Release Notes Format

Each version includes:
- **Features Added**: New capabilities
- **Changed**: Changes to existing functionality
- **Fixed**: Bug fixes
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Security**: Security improvements

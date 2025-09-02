// YouTube Comment Viewer - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    const usernameInput = document.getElementById('username-input');
    const sortSelect = document.getElementById('sort-select');
    const apiKeyInput = document.getElementById('api-key-input');
    const toastTimeoutInput = document.getElementById('toast-timeout-input');
    const toastExtensionSelect = document.getElementById('toast-extension-select');
    const themeSelect = document.getElementById('theme-select');
    const saveBtn = document.getElementById('save-btn');
    const clearBtn = document.getElementById('clear-btn');
    const statusMessage = document.getElementById('status-message');
    const currentUsername = document.getElementById('current-username');
    const helpLink = document.getElementById('help-link');
    const feedbackLink = document.getElementById('feedback-link');
    
    // Load current settings
    await loadCurrentSettings();
    
    // Event listeners
    saveBtn.addEventListener('click', saveSettings);
    clearBtn.addEventListener('click', clearSettings);
    sortSelect.addEventListener('change', updateCurrentTarget);
    apiKeyInput.addEventListener('input', clearStatus);
    toastTimeoutInput.addEventListener('input', clearStatus);
    toastExtensionSelect.addEventListener('change', clearStatus);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveSettings();
        }
    });
    usernameInput.addEventListener('input', () => {
        clearStatus();
        updateCurrentTarget();
    });
    helpLink.addEventListener('click', showHelp);
    feedbackLink.addEventListener('click', showFeedback);
    
    // Load current settings from storage
    async function loadCurrentSettings() {
        try {
            const result = await chrome.storage.sync.get(['targetUsername', 'sortOrder', 'apiKey', 'toastTimeout', 'toastTheme', 'toastExtensionTime']);
            const username = result.targetUsername || '';
            const sortOrder = result.sortOrder || 'top';
            const apiKey = result.apiKey || '';
            const toastTimeout = result.toastTimeout || 10;
            const toastTheme = result.toastTheme || 'default';
            const toastExtensionTime = result.toastExtensionTime || 10;
            
            usernameInput.value = username;
            sortSelect.value = sortOrder;
            apiKeyInput.value = apiKey;
            toastTimeoutInput.value = toastTimeout;
            themeSelect.value = toastTheme;
            toastExtensionSelect.value = toastExtensionTime;
            updateCurrentTarget(); // Use the new function to set proper target text
            
            if (username) {
                showStatus('Settings loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showStatus('Error loading settings', 'error');
        }
    }
    
    // Update current target display based on username and sort order
    function updateCurrentTarget() {
        const username = usernameInput.value.trim();
        const sortOrder = sortSelect.value;
        
        let targetText = '';
        
        if (sortOrder === 'video-player-time') {
            targetText = 'Video Player Time (Toasts)';
        } else if (username) {
            const sortDescriptions = {
                'top': 'User + Top Timestamps',
                'top-no-timestamps': 'User + Top Comments',
                'newest': 'User + Newest Comments'
            };
            targetText = `${username} (${sortDescriptions[sortOrder] || 'Comments'})`;
        } else {
            const sortDescriptions = {
                'top': 'Timestamp Comments Only',
                'top-no-timestamps': 'Top Comments Only',
                'newest': 'Newest Comments Only'
            };
            targetText = sortDescriptions[sortOrder] || 'Comments Only';
        }
        
        currentUsername.textContent = targetText;
    }
    
    // Save settings to storage
    async function saveSettings() {
        const username = usernameInput.value.trim();
        const sortOrder = sortSelect.value;
        const apiKey = apiKeyInput.value.trim();
        const toastTimeout = parseInt(toastTimeoutInput.value) || 10;
        const toastTheme = themeSelect.value;
        const toastExtensionTime = parseInt(toastExtensionSelect.value) || 10;
        
        // Validate username
        if (username && username.length < 2) {
            showStatus('Username must be at least 2 characters (or leave empty for timestamp mode)', 'error');
            usernameInput.focus();
            return;
        }
        
        if (username && username.length > 50) {
            showStatus('Username is too long (max 50 characters)', 'error');
            usernameInput.focus();
            return;
        }
        
        // Check for invalid characters in username (basic check)
        if (username) {
            const invalidChars = /[<>\"'&]/;
            if (invalidChars.test(username)) {
                showStatus('Username contains invalid characters', 'error');
                usernameInput.focus();
                return;
            }
        }
        
        // Validate API key
        if (apiKey && apiKey.length < 10) {
            showStatus('API key seems too short. Please check your API key.', 'error');
            apiKeyInput.focus();
            return;
        }
        
        // Validate toast timeout
        if (toastTimeout < 3 || toastTimeout > 60) {
            showStatus('Toast timeout must be between 3 and 60 seconds', 'error');
            toastTimeoutInput.focus();
            return;
        }
        
        try {
            // Save to storage
            await chrome.storage.sync.set({ 
                targetUsername: username,
                sortOrder: sortOrder,
                apiKey: apiKey,
                toastTimeout: toastTimeout,
                toastTheme: toastTheme,
                toastExtensionTime: toastExtensionTime
            });
            
            // Update current username display
            updateCurrentTarget();
            
            // Notify content script about settings change
            notifyContentScript({ username, sortOrder, apiKey, toastTimeout, toastTheme, toastExtensionTime });
            
            showStatus('Settings saved successfully!', 'success');
            
            showStatus('Settings saved successfully!', 'success');
            
            // Update button text temporarily
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.disabled = true;
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            showStatus('Error saving settings', 'error');
        }
    }
    
    // Clear settings
    async function clearSettings() {
        try {
            await chrome.storage.sync.remove(['targetUsername', 'sortOrder', 'apiKey', 'toastTimeout', 'toastTheme', 'toastExtensionTime']);
            usernameInput.value = '';
            sortSelect.value = 'top'; // Reset to default
            apiKeyInput.value = '';
            toastTimeoutInput.value = '10'; // Reset to default
            themeSelect.value = 'default'; // Reset to default theme
            toastExtensionSelect.value = '10'; // Reset to default
            updateCurrentTarget(); // Update the display
            showStatus('Settings cleared', 'success');
            
            // Update button text temporarily
            const originalText = clearBtn.textContent;
            clearBtn.textContent = 'Cleared!';
            clearBtn.disabled = true;
            
            setTimeout(() => {
                clearBtn.textContent = originalText;
                clearBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error clearing settings:', error);
            showStatus('Error clearing settings', 'error');
        }
    }
    
    // Notify content script about settings change
    async function notifyContentScript(settings) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('youtube.com/watch')) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'settingsUpdated',
                    settings: settings
                });
            }
        } catch (error) {
            console.log('Could not notify content script:', error);
        }
    }
    
    // Show status message
    function showStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }
    }
    
    // Clear status message
    function clearStatus() {
        statusMessage.style.display = 'none';
    }
    
    // Show help information
    function showHelp(e) {
        e.preventDefault();
        const helpText = `
YouTube Comment Viewer Help:

NEW FEATURES:
- Automatic timestamp detection! Comments with times like "0:19" or "1:23" are now automatically tracked
- Better comment loading with retry system
- Overlay positioned relative to video player (bottom-right)
- More transparent background for better video viewing

USAGE:
1. Username Tracking: Enter a YouTube username to track their comments
2. Timestamp Mode: Leave username empty to only see timestamp comments  
3. Combined Mode: Enter username to see BOTH their comments AND timestamp comments

4. Overlay Controls: 
   - Positioned at bottom-right of video player
   - Drag the header to move the overlay
   - Click the × button to hide temporarily
   - Overlay auto-hides in fullscreen mode

5. Comment Types:
   - 👤⏰ = User comment with timestamp
   - 👤 = User comment only  
   - ⏰ = Timestamp comment only

6. Privacy: All data is stored locally on your device.

7. Troubleshooting:
   - Extension automatically retries loading comments
   - Works better with longer videos that have more comments
   - Try scrolling down on YouTube to load more comments
   - Check browser console for debug info

Note: The extension works on YouTube video pages and automatically detects timestamp patterns like "0:19", "1:23", "10:45", etc.
        `;
        
        alert(helpText);
    }
    
    // Show feedback options
    function showFeedback(e) {
        e.preventDefault();
        const feedbackText = `
We'd love to hear from you!

To provide feedback or report issues:

1. Check the browser console for any error messages
2. Note the specific YouTube video URL where issues occur
3. Describe the username you're trying to track
4. Include your browser version and operating system

Common Issues:
- Extension not working: Check permissions and reload the page
- Comments not appearing: Verify the username is correct
- Overlay not visible: Check if it's hidden or moved off-screen

The extension is open source and designed to respect user privacy.
        `;
        
        alert(feedbackText);
    }
    
    // Auto-focus username input
    usernameInput.focus();
    
    // Handle storage changes from other tabs/instances
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.targetUsername) {
            const newUsername = changes.targetUsername.newValue || '';
            currentUsername.textContent = newUsername || 'Timestamp mode';
            
            // Update input if it was changed from another instance
            if (usernameInput.value !== newUsername) {
                usernameInput.value = newUsername;
                showStatus('Settings updated from another tab', 'info');
            }
        }
    });
});

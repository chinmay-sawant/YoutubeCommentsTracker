# Installation Guide

## Quick Start

### Step 1: Load the Extension
1. Open Google Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select this project folder

### Step 2: Configure Settings
1. Click the extension icon in your toolbar
2. Enter a YouTube username to track
3. Click "Save Settings"

### Step 3: Use on YouTube
1. Go to any YouTube video page
2. The comment overlay will appear automatically
3. Comments from your target user will show in real-time

## Important Notes

### Icon Files
The extension references icon files that need to be created:
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)  
- `icons/icon128.png` (128x128 pixels)

The extension will work without these, but they improve the user experience.

### Browser Permissions
When loading the extension, Chrome will request permissions for:
- Access to YouTube pages
- Local storage for settings

These are necessary for the extension to function properly.

### Testing
Test the extension by:
1. Finding a YouTube video with comments
2. Setting a username that has commented on that video
3. Scrolling through comments to load more
4. Verifying the overlay shows matching comments

## Troubleshooting

**Extension not loading:**
- Check that all files are in the same directory
- Ensure Developer mode is enabled
- Try refreshing the extensions page

**No comments appearing:**
- Verify the username is typed correctly
- Make sure you're on a video page (not homepage)
- Check that the user has actually commented

**Overlay not visible:**
- Look for it in the bottom-right corner
- Try dragging from the red header area
- Check if it was moved off-screen

For more detailed information, see README.md

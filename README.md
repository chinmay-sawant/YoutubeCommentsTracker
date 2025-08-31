https://gemini.google.com/app/d5941b1f55494ac3
# YouTube User Comment Tracker

A Google Chrome extension that displays live-updating comments from a specific user AND/OR comments containing timestamps (like "0:19") on YouTube video pages in a transparent, draggable overlay.

## Features

- **Real-time Comment Monitoring**: Automatically detects new comments as they load on YouTube videos
- **User-specific Filtering**: Track comments from any YouTube username or channel
- **Automatic Timestamp Detection**: Finds comments with time references like "0:19", "1:23", "10:45"
- **Dual Mode Operation**: Track user comments, timestamp comments, or both simultaneously
- **Smart Positioning**: Overlay positioned relative to video player (bottom-right corner)
- **Enhanced Transparency**: More transparent background for better video viewing
- **Improved Comment Loading**: Retry system with better delay handling
- **Draggable Interface**: Move the comment feed anywhere on the screen
- **Live Notifications**: Get notified when new matching comments appear
- **Auto-scroll**: Newest comments appear at the top of the feed
- **Comment Type Indicators**: Visual indicators for user comments vs timestamp comments
- **Responsive Design**: Works on different screen sizes and YouTube layouts

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. Download or clone this repository to your local machine
2. Open Google Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now appear in your extensions list

### Method 2: Install from Chrome Web Store (When Published)

*Coming soon - extension will be published to Chrome Web Store*

## Usage

### Initial Setup

1. Click the extension icon in your browser toolbar
2. Enter the YouTube username you want to track (optional)
3. Click "Save Settings"
4. Leave username empty to track only timestamp comments

### Monitoring Comments

1. Navigate to any YouTube video (`youtube.com/watch?v=...`)
2. The transparent overlay will appear at the bottom-right of the video player
3. Comments will appear based on your settings:
   - **User + Timestamps**: Shows comments from your user AND any timestamp comments
   - **User Only**: Shows only comments from your specified user
   - **Timestamps Only**: Shows only comments containing time references (0:19, 1:23, etc.)
4. Drag the overlay header to reposition it anywhere on screen

### Comment Types

The extension identifies and displays different types of comments:
- **👤⏰ User + Timestamp**: Comments from your target user that also contain timestamps
- **👤 User Only**: Comments from your target user
- **⏰ Timestamp Only**: Comments from any user containing time references

### Timestamp Detection

The extension automatically detects comments containing time patterns like:
- "0:19 That scene was amazing!"
- "At 1:23 you can see..."
- "10:45 - best part of the video"
- Any comment with MM:SS format timestamps

### Managing Settings

- Click the extension icon anytime to change the target username
- Use the "Clear" button to stop tracking
- Settings are automatically synced across browser tabs

## Technical Details

### File Structure

```
├── manifest.json          # Extension configuration
├── content.js             # Main content script for YouTube pages
├── styles.css             # Overlay styling
├── popup.html             # Settings popup interface
├── popup.js               # Popup functionality
├── popup.css              # Popup styling
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

### Key Components

**Content Script (`content.js`)**
- Runs on all YouTube video pages
- Uses MutationObserver to detect new comments
- Extracts comment data (username, text, timestamp, likes)
- Creates and manages the overlay interface
- Handles real-time filtering and display

**Popup Interface (`popup.html`, `popup.js`, `popup.css`)**
- Provides user configuration interface
- Saves settings using Chrome storage API
- Includes help and validation features

**Overlay Styles (`styles.css`)**
- Transparent, responsive design
- Smooth animations and transitions
- Accessibility-friendly interactions

### Permissions

- `activeTab`: Access current YouTube tab content
- `storage`: Save user preferences
- `https://www.youtube.com/*`: Run on YouTube pages

## Browser Compatibility

- **Google Chrome**: Fully supported (Manifest V3)
- **Microsoft Edge**: Compatible (Chromium-based)
- **Other Chromium browsers**: Should work with minor modifications

## Privacy & Security

- **Local Storage Only**: All data stored locally on your device
- **No External Requests**: Extension doesn't send data to external servers
- **Minimal Permissions**: Only requests necessary permissions
- **No User Tracking**: Extension doesn't track or collect user behavior

## Development

### Prerequisites

- Google Chrome (latest version)
- Text editor or IDE
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd youtube-comment-tracker
   ```

2. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project directory

3. Make your changes to the source files

4. Reload the extension:
   - Go to `chrome://extensions/`
   - Click the reload button for the extension
   - Refresh any YouTube pages you're testing on

### Testing

- Test on various YouTube videos with different comment loads
- Verify overlay positioning across different screen sizes
- Test username filtering with various usernames and formats
- Check performance with high comment volumes

## Troubleshooting

### Common Issues

**Extension not working on YouTube:**
- Verify the extension is enabled in `chrome://extensions/`
- Check that you're on a YouTube video page (`/watch?v=...`)
- Refresh the page after installing or updating the extension

**Comments not appearing:**
- Ensure the target username is correctly entered
- Check that the user has actually commented on the video
- Try scrolling down to load more comments on the YouTube page

**Overlay not visible:**
- Check if it was accidentally dragged off-screen
- Verify the overlay isn't hidden by clicking the extension icon
- Try disabling and re-enabling the extension

**Performance issues:**
- Try refreshing the YouTube page
- Check browser console for error messages
- Ensure you're using the latest version of Chrome

### Debug Information

To help with troubleshooting:
1. Open browser console (F12)
2. Look for any error messages
3. Note the specific YouTube video URL
4. Include your browser version and operating system

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Code Style

- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Follow modern JavaScript practices
- Test thoroughly before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### Version 1.0.0
- Initial release
- Real-time comment monitoring
- Transparent draggable overlay
- User configuration popup
- Chrome storage integration
- Responsive design

## Support

For support, bug reports, or feature requests:
- Open an issue on GitHub
- Include detailed reproduction steps
- Provide browser version and error messages

## Acknowledgments

- Built for YouTube comment tracking enthusiasts
- Inspired by live chat overlays and comment monitoring tools
- Thanks to the Chrome Extensions documentation and community

---

**Note**: This extension is not affiliated with YouTube or Google. It's an independent project designed to enhance the YouTube viewing experience.

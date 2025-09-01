# YouTube User Comment Tracker

A powerful Google Chrome extension that displays live-updating comments from specific users AND/OR comments containing timestamps on YouTube videos in a transparent, draggable overlay with real-time toast notifications.

## 🎯 Why I Created This Extension

I love watching "Daily Dose Of Internet" on YouTube where there are lots of funny moments, and I used to enjoy looking at the comments. But the main issue for me was finding relevant comments with respect to the timestamp where I was actually watching in the video.

**This extension solves that problem** and provides extensive customization options to enhance your YouTube commenting experience!

## ✨ Key Features

### 🎯 Smart Comment Tracking
- **User-specific Filtering**: Track comments from any YouTube username or channel
- **Automatic Timestamp Detection**: Finds comments with time references like "0:19", "1:23", "10:45"
- **Dual Mode Operation**: Track user comments, timestamp comments, or both simultaneously
- **Comment Type Indicators**: Visual indicators (👤⏰ User+Timestamp, 👤 User Only, ⏰ Timestamp Only)

### 🚀 Advanced Display Modes
- **Traditional Overlay**: Transparent draggable comment feed positioned relative to video player
- **Video Player Time Mode**: Real-time toast notifications that appear based on video progress
- **Smart Positioning**: Overlay auto-positions at bottom-right of video player
- **Multi-Theme Toast System**: 6 customizable toast themes with enhanced transparency
- **Rewind Detection**: Smart re-showing of timestamp comments when rewinding video

### 🔧 Technical Excellence
- **YouTube API Integration**: Fast, reliable comment fetching via YouTube Data API v3
- **Automatic Video ID Detection**: Seamlessly extracts video ID from current YouTube page
- **Real-time Monitoring**: Live detection of new comments and video time changes
- **Enhanced Performance**: Optimized comment loading with pagination and retry systems

### 🎨 User Experience
- **Draggable Interface**: Move the comment feed anywhere on screen
- **Enhanced Transparency**: Backdrop blur effects and customizable opacity
- **Responsive Design**: Works on different screen sizes and YouTube layouts
- **Clickable Timestamps**: Click any timestamp in comments to seek video to that time
- **Auto-scroll & Live Updates**: Newest comments appear at top with smooth animations

## 📦 Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Download Extension:**
   - Download or clone this repository to your local machine
   - Open Google Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the extension directory

2. **Configure API Key (Optional but Recommended):**
   - Click the extension icon in your browser toolbar
   - Enter your YouTube Data API v3 key in the popup settings
   - Follow the instructions in `API_SETUP.md` to get a YouTube Data API key
   - This enables reliable, fast comment fetching via the YouTube API

3. **Set Up Tracking:**
   - Enter the YouTube username you want to track (optional)
   - Choose your preferred display mode and sorting method
   - Click "Save Settings"

### Method 2: Install from Chrome Web Store (When Published)

*Coming soon - extension will be published to Chrome Web Store*

### 🔧 Configuration Modes

The extension works in multiple modes based on your settings:

- **API Mode** (Recommended): Uses YouTube Data API for reliable, fast comment fetching

## 🚀 Usage

### Initial Setup

1. Click the extension icon in your browser toolbar
2. Configure your preferences:
   - **API Key**: Enter your YouTube Data API key (optional but recommended)
   - **Username**: Enter the YouTube username you want to track (optional)
   - **Sort Method**: Choose how comments are sorted and displayed
   - **Toast Duration**: Set how long toast notifications appear (for Video Player Time mode)
   - **Toast Click Extension**: Set additional time added when clicking on toasts (5-30 seconds)
3. Click "Save Settings"

### Display Modes

The extension offers three powerful display modes:

#### 🔄 Traditional Overlay Mode
1. Navigate to any YouTube video (`youtube.com/watch?v=...`)
2. A transparent overlay appears at the bottom-right of the video player
3. Comments appear based on your settings:
   - **User + Timestamps**: Shows comments from your user AND any timestamp comments
   - **User Only**: Shows only comments from your specified user
   - **Timestamps Only**: Shows only comments containing time references (0:19, 1:23, etc.)
4. Drag the overlay header to reposition it anywhere on screen
5. Use the "Load More" button to fetch additional comments

#### ⏰ Video Player Time Mode (NEW!)
1. Set sort method to "Video Player Time" in extension settings
2. Play any YouTube video
3. Toast notifications automatically appear as the video progresses
4. Toasts show relevant timestamp comments at the exact moment they reference
5. **Rewind Support**: Rewinding the video allows timestamps to re-appear
6. **Smart Cooldown**: Prevents spam by enforcing 30-second cooldowns between re-shows
7. **🎵 Pause Freeze**: Toasts freeze when video is paused (visual indicators show paused state)
8. **👆 Click to Extend**: Click any toast to extend its display time by your configured amount
9. **⚙️ Configurable**: Set both base toast duration and click extension time in settings

#### 🎨 Toast Theme System
Choose from 6 beautiful toast themes:
- **Default**: Classic dark theme with red accents
- **Modern**: Sleek glass effect with subtle shadows
- **Minimal**: Clean, understated design
- **Colorful**: Vibrant gradient backgrounds
- **Dark**: Pure dark mode for late-night viewing
- **Neon**: Futuristic cyberpunk aesthetic

### Comment Types & Visual Indicators

The extension identifies and displays different types of comments with clear visual indicators:
- **👤⏰ User + Timestamp**: Comments from your target user that also contain timestamps
- **👤 User Only**: Comments from your target user without timestamps
- **⏰ Timestamp Only**: Comments from any user containing time references

### Timestamp Detection & Interaction

The extension automatically detects and enhances comments containing time patterns:
- **Formats Detected**: "0:19", "1:23", "10:45", "at 2:30", "2:15 best part"
- **Clickable Timestamps**: Click any highlighted timestamp to seek the video
- **Real-time Matching**: In Video Player Time mode, comments appear precisely when referenced
- **Smart Parsing**: Handles various timestamp formats and contexts

### Advanced Features

#### Smart Positioning System
- Overlay automatically positions relative to YouTube's video player
- Adapts to theater mode, fullscreen, and different screen sizes
- Remembers your preferred position when you drag the overlay

#### Performance Optimizations
- **Efficient API Usage**: Minimizes API calls while maximizing data retrieval
- **Background Processing**: Non-blocking comment processing
- **Memory Management**: Automatic cleanup of old toast notifications
- **Responsive Loading**: Adaptive loading based on comment volume

#### Accessibility & Usability
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Compatible**: Proper ARIA labels and semantic markup
- **High Contrast Support**: Themes work well with browser accessibility features
- **Responsive Design**: Optimized for all screen sizes and zoom levels

## 🔧 Technical Details

### Architecture Overview

The extension follows a modern Manifest V3 architecture with three main components:

#### Background Service Worker (`background.js`)
- **YouTube Data API Integration**: Secure API key management and request handling
- **Comment Processing**: Intelligent filtering, sorting, and timestamp extraction
- **Rate Limiting**: Automatic API quota management and fallback systems
- **Security**: API keys stored securely in background context, inaccessible to web pages

#### Content Script (`content.js`)
- **Video Monitoring**: Real-time video player state detection and time tracking
- **DOM Management**: Overlay creation, positioning, and responsive updates
- **Toast System**: Dynamic toast notifications with theme support and animations
- **Event Handling**: User interactions, video seeking, and rewind detection
- **Performance**: Optimized comment processing with Map-based caching

#### Popup Interface (`popup.html/js/css`)
- **Settings Management**: User-friendly configuration with live validation
- **Theme Selection**: Visual theme picker with preview capabilities
- **API Configuration**: Secure API key input with encryption and validation
- **Help System**: Comprehensive user guidance and troubleshooting

### File Structure

```
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js           # Service worker for API integration
├── content.js              # Main content script for YouTube pages
├── styles.css              # Overlay styling with theme system
├── popup.html              # Settings popup interface
├── popup.js                # Popup functionality and validation
├── popup.css               # Popup styling and responsive design
├── API_SETUP.md           # Comprehensive API configuration guide
├── icons/                  # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This comprehensive documentation
```

### Key Technical Features

#### Smart Comment Processing
- **Multi-format Timestamp Detection**: Regex patterns for various timestamp formats
- **Comment Classification**: Automatic categorization (user, timestamp, or both)
- **Real-time Filtering**: Dynamic comment filtering based on user preferences
- **Pagination Handling**: Efficient loading of large comment datasets

#### Advanced Video Time Monitoring
- **Precision Tracking**: Millisecond-accurate video time monitoring
- **Rewind Detection**: Intelligent detection of user video navigation
- **Cooldown Management**: Map-based timestamp tracking to prevent spam
- **Performance Optimization**: Minimal impact on video playback performance

#### Toast Notification System
- **Theme Engine**: Modular CSS theme system with 6 distinct styles
- **Animation Framework**: Smooth enter/exit animations with stacking support
- **Responsive Design**: Automatic positioning and sizing based on screen size
- **Accessibility**: Full keyboard navigation and screen reader support

#### Positioning & Layout System
- **Video Player Detection**: Dynamic detection of YouTube's video player container
- **Theater Mode Support**: Automatic adaptation to YouTube's layout changes
- **Fullscreen Handling**: Overlay management during fullscreen transitions
- **Responsive Positioning**: Smart positioning based on available screen space

### Performance Characteristics

#### Memory Management
- **Efficient Caching**: Map-based comment storage with automatic cleanup
- **Toast Lifecycle**: Automatic toast removal and memory deallocation
- **Event Cleanup**: Proper event listener management and removal

#### API Optimization
- **Batch Processing**: Efficient API request batching to minimize quota usage
- **Rate Limiting**: Built-in request throttling and retry mechanisms
- **Error Handling**: Comprehensive error recovery and user feedback

#### Browser Compatibility
- **Chrome**: Fully optimized for Manifest V3 (primary target)
- **Edge**: Compatible with Chromium-based Edge
- **Security**: Content Security Policy compliant
- **Privacy**: No external data transmission beyond YouTube API

### Data Flow Architecture

```
1. User Settings (Popup) → Chrome Storage → Background Service Worker
2. Background Worker → YouTube API → Comment Data Processing
3. Processed Comments → Content Script → Display Logic
4. Video Time Changes → Toast Logic → Theme Rendering
5. User Interactions → Event Handling → State Management
```

### Extension Permissions & Security

#### Required Permissions
- `activeTab`: Access current YouTube tab content for video monitoring
- `storage`: Store user preferences and API configuration securely
- `https://www.youtube.com/*`: Run content scripts on YouTube pages
- `https://www.googleapis.com/*`: Access YouTube Data API endpoints

#### Security Features
- **Isolated API Key Storage**: Keys stored in background service worker only
- **Content Security Policy**: Strict CSP preventing code injection
- **Minimal Permissions**: Only essential permissions requested
- **No External Dependencies**: Self-contained with no third-party scripts

## 🌐 Browser Compatibility

- **Google Chrome**: Fully supported (Manifest V3) - Primary target
- **Microsoft Edge**: Compatible (Chromium-based) - Fully tested
- **Brave Browser**: Compatible with minor CSS adjustments
- **Opera**: Compatible (Chromium-based) - Basic testing
- **Other Chromium browsers**: Should work with minimal modifications

### Version Requirements
- Chrome 88+ (Manifest V3 support)
- Edge 88+ (Chromium-based)

## 🔒 Privacy & Security

### Data Protection
- **Local Storage Only**: All user data stored locally on your device
- **No External Requests**: Extension only communicates with YouTube API when configured
- **Minimal Permissions**: Only requests necessary permissions for core functionality
- **No User Tracking**: Extension doesn't track, collect, or transmit user behavior
- **Secure API Storage**: API keys stored in background service worker context only

### Security Features
- **Content Security Policy**: Strict CSP prevents code injection attacks
- **API Key Isolation**: YouTube API keys never accessible to web pages
- **Background Processing**: Sensitive operations handled in secure background context
- **Permission Scoping**: Permissions limited to YouTube domains only

## 🚀 Development

### Prerequisites

- Google Chrome (latest version)
- Text editor or IDE (VS Code recommended)
- Basic knowledge of HTML, CSS, and JavaScript
- Optional: YouTube Data API v3 key for testing

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd youtube-comment-tracker
   ```

2. **Load the extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project directory

3. **Development workflow:**
   - Make your changes to source files
   - Go to `chrome://extensions/`
   - Click the reload button for the extension
   - Refresh any YouTube pages you're testing on

### Testing Guidelines

#### Core Functionality Testing
- Test on various YouTube videos with different comment loads
- Verify overlay positioning across different screen sizes
- Test username filtering with various usernames and formats
- Check performance with high comment volumes
- Validate API integration and fallback behavior

#### Video Player Time Mode Testing
- Test toast appearance timing with different video types
- Verify rewind detection and re-showing behavior
- Test cooldown system with rapid seeking
- Validate theme switching and toast animations

#### Cross-browser Testing
- Chrome: Primary development target
- Edge: Full compatibility testing
- Different screen sizes and zoom levels
- Various YouTube layout modes (theater, fullscreen)

### Code Architecture

#### Modern JavaScript Patterns
- **ES6+ Features**: Arrow functions, destructuring, async/await
- **Modular Design**: Separated concerns with clear function responsibilities
- **Error Handling**: Comprehensive try-catch blocks and graceful degradation
- **Performance**: Optimized algorithms and minimal DOM manipulation

#### CSS Architecture
- **BEM Methodology**: Block-Element-Modifier naming convention
- **Custom Properties**: CSS variables for theming and consistency
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Accessibility**: High contrast ratios and focus management

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Extension Not Working on YouTube
**Symptoms**: No overlay appears, extension seems inactive
**Solutions**:
- Verify extension is enabled in `chrome://extensions/`
- Check that you're on a YouTube video page (`/watch?v=...`)
- Refresh the page after installing or updating
- Check browser console for error messages (F12)

#### Comments Not Appearing
**Symptoms**: Overlay appears but shows no comments
**Solutions**:
- Ensure target username is correctly entered (case-sensitive)
- Verify the user has actually commented on the video
- Try different sort orders (Top, Newest, Video Player Time)
- Check if API key is configured correctly
- Scroll down on YouTube to load more comments

#### Toast Notifications Not Showing (Video Player Time Mode)
**Symptoms**: No toast notifications appear during video playback
**Solutions**:
- Ensure sort method is set to "Video Player Time"
- Verify video has timestamp-related comments
- Check that video is actually playing
- Refresh the page and wait for comments to load
- Try increasing toast timeout duration

#### Overlay Not Visible or Positioned Incorrectly
**Symptoms**: Can't see the overlay or it's in wrong position
**Solutions**:
- Check if overlay was dragged off-screen (refresh page to reset)
- Verify video player is detected correctly
- Try switching between theater mode and normal mode
- Check for conflicts with other extensions
- Ensure browser zoom is at reasonable level (50%-200%)

#### API-Related Issues
**Symptoms**: "API error" messages or slow comment loading
**Solutions**:
- Verify API key is correctly configured in popup settings
- Check YouTube Data API v3 is enabled in Google Cloud Console
- Monitor API quotas in Google Cloud Console
- Test with DOM scraping mode (leave API key empty)
- Check browser console for detailed error messages

#### Performance Issues
**Symptoms**: Slow page loading, high CPU usage, browser lag
**Solutions**:
- Try reducing toast timeout duration
- Use lower comment load limits
- Disable extension on videos with extremely high comment counts
- Check for browser console errors
- Update to latest browser version

### Debug Information Collection

For support requests, please include:
1. **Browser Information**: Version and type (Chrome/Edge/etc.)
2. **Extension Version**: Found in `chrome://extensions/`
3. **Console Errors**: Browser console messages (F12 → Console tab)
4. **Video Details**: Specific YouTube video URL where issue occurs
5. **Settings**: Current extension configuration (username, sort order, etc.)
6. **Steps to Reproduce**: Detailed description of what you were doing

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/awesome-feature`)
3. Make your changes following our coding standards
4. Test thoroughly across different scenarios
5. Commit your changes (`git commit -am 'Add awesome feature'`)
6. Push to the branch (`git push origin feature/awesome-feature`)
7. Create a Pull Request

### Coding Standards

#### JavaScript
- Use modern ES6+ syntax
- Follow consistent indentation (2 spaces)
- Add comprehensive comments for complex logic
- Use meaningful variable and function names
- Implement proper error handling

#### CSS
- Follow BEM naming convention
- Use CSS custom properties for consistency
- Ensure responsive design principles
- Maintain accessibility standards
- Test across different browsers

#### Testing Requirements
- Test all new features thoroughly
- Verify compatibility with different YouTube layouts
- Check performance impact
- Validate accessibility compliance
- Include screenshots/videos for UI changes

### Feature Requests & Bug Reports

#### Bug Reports
Please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and extension version
- Console error messages
- Screenshots if applicable

#### Feature Requests
Please include:
- Clear description of the proposed feature
- Use case and benefits
- Potential implementation approach
- UI/UX mockups if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ No liability accepted

## 📊 Changelog

### Version 1.0.0 (Latest)
- ✨ **NEW**: Video Player Time Mode with real-time toast notifications
- ✨ **NEW**: 6-theme toast system with enhanced transparency
- ✨ **NEW**: Rewind detection and smart re-showing of timestamp comments
- ✨ **NEW**: UI-based API key configuration (no more manual code editing)
- ✨ **NEW**: Advanced comment classification and visual indicators
- ✨ **NEW**: Clickable timestamps for video seeking
- 🔧 **IMPROVED**: Enhanced overlay positioning and responsiveness
- 🔧 **IMPROVED**: Optimized API usage and fallback systems
- 🔧 **IMPROVED**: Better error handling and user feedback
- 🐛 **FIXED**: Memory leaks and performance issues
- 🐛 **FIXED**: Compatibility with YouTube layout changes

### Version 0.9.0 (Beta)
- Initial release with basic comment tracking
- Traditional overlay mode
- YouTube API integration
- DOM scraping fallback

## 📞 Support & Community

### Get Help
- **GitHub Issues**: [Report bugs and request features](https://github.com/your-repo/issues)
- **Documentation**: Check this README and `API_SETUP.md`
- **Browser Console**: Check for error messages (F12)

### Community Guidelines
- Be respectful and constructive
- Search existing issues before creating new ones
- Provide detailed information for better support
- Help others when possible

### Feedback & Suggestions
We value your feedback! Let us know:
- What features you'd like to see
- How you're using the extension
- Any improvements you'd suggest
- Success stories and use cases

## 🙏 Acknowledgments

### Built With
- **Chrome Extensions API**: Manifest V3 architecture
- **YouTube Data API v3**: Comment and video data retrieval
- **Modern Web Standards**: ES6+, CSS Grid, Flexbox
- **Accessibility Standards**: WCAG 2.1 compliance

### Inspiration
- YouTube live chat overlays and comment monitoring tools
- Community feedback and feature requests
- Modern web extension best practices
- User experience research and testing

### Special Thanks
- Chrome Extensions documentation and community
- YouTube API documentation and examples
- Beta testers and early adopters
- Open source community for inspiration and guidance

---

**Note**: This extension is not affiliated with YouTube or Google. It's an independent project designed to enhance the YouTube viewing experience through better comment interaction and discovery.

⭐ **Enjoying the extension?** Consider starring the repository and sharing it with others!

# YouTube API Configuration

To use this extension with the YouTube Data API, you need to:

1. **Get a YouTube Data API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the YouTube Data API v3
   - Create credentials (API Key)
   - Restrict the API key to YouTube Data API v3 for security

2. **Configure the Extension:**
   - Open `background.js`
   - Replace `"YOUR_API_KEY_HERE"` with your actual API key
   - Example: `const YOUTUBE_API_KEY = "AIzaSyDcFhriP-example-key-here";`

3. **API Key Security:**
   - The API key is stored securely in the background service worker
   - It's not accessible from web pages or the browser console
   - Only the extension can use it to make API requests

4. **API Limits:**
   - YouTube Data API has quotas and limits
   - Default quota is 10,000 units per day
   - Each comment thread request costs about 5 units
   - The extension automatically handles rate limiting

## Example API Key Configuration:

```javascript
// In background.js
const YOUTUBE_API_KEY = "AIzaSyDcFhriP1iQhOzU-example-key-PcQrEo";
```

## Testing:
- Load the extension in Chrome
- Open a YouTube video
- Check the browser console for API request logs
- Verify comments are being fetched from the API

## Troubleshooting:
- If you see "API error" messages, check your API key
- Ensure the YouTube Data API v3 is enabled in Google Cloud Console
- Check API quotas in the Google Cloud Console
- Verify the API key has proper restrictions set

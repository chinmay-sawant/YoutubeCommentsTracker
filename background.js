// YouTube Comment Tracker - Background Service Worker
// This handles secure API calls to YouTube Data API

const YOUTUBE_API_KEY = "YOUR_API_KEY"; // Replace with your actual API key

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchComments") {
        fetchYouTubeComments(request.videoId, request.pageToken)
            .then(data => sendResponse({ status: "success", data: data }))
            .catch(error => sendResponse({ status: "error", message: error.message }));
        return true; // Indicates response will be sent asynchronously
    }
    
    if (request.action === "fetchVideoDetails") {
        fetchVideoDetails(request.videoId)
            .then(data => sendResponse({ status: "success", data: data }))
            .catch(error => sendResponse({ status: "error", message: error.message }));
        return true;
    }
});

// Fetch comments from YouTube API
async function fetchYouTubeComments(videoId, pageToken = null) {
    try {
        let apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&key=${YOUTUBE_API_KEY}&maxResults=200&order=relevance`;
        
        if (pageToken) {
            apiUrl += `&pageToken=${pageToken}`;
        }
        
        console.log('Fetching comments from YouTube API:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            // Get detailed error information
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.error?.message || `${response.status} ${response.statusText}`;
            console.error('YouTube API Error Details:', errorData);
            throw new Error(`YouTube API error: ${response.status} - ${errorMessage}`);
        }
        
        const data = await response.json();
        
        // Process comments to extract relevant information
        const processedComments = processCommentsData(data);
        
        return {
            comments: processedComments,
            nextPageToken: data.nextPageToken,
            totalResults: data.pageInfo?.totalResults || 0
        };
        
    } catch (error) {
        console.error('Error fetching YouTube comments:', error);
        throw error;
    }
}

// Fetch video details
async function fetchVideoDetails(videoId) {
    try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.items[0] || null;
        
    } catch (error) {
        console.error('Error fetching video details:', error);
        throw error;
    }
}

// Process YouTube API comment data into our format
function processCommentsData(apiData) {
    const processedComments = [];
    
    if (!apiData.items) return processedComments;
    
    apiData.items.forEach(item => {
        const snippet = item.snippet.topLevelComment.snippet;
        
        // Process main comment
        const mainComment = {
            id: item.snippet.topLevelComment.id,
            username: snippet.authorDisplayName,
            channelId: snippet.authorChannelId?.value || '',
            text: snippet.textOriginal, // Use textOriginal instead of textDisplay to avoid HTML tags
            timestamp: formatRelativeTime(snippet.publishedAt),
            publishedAt: snippet.publishedAt,
            likes: snippet.likeCount || 0,
            dislikes: 0, // YouTube API doesn't provide dislikes
            isReply: false,
            parentId: null
        };
        
        processedComments.push(mainComment);
        
        // Process replies if they exist
        if (item.replies && item.replies.comments) {
            item.replies.comments.forEach(reply => {
                const replySnippet = reply.snippet;
                const replyComment = {
                    id: reply.id,
                    username: replySnippet.authorDisplayName,
                    channelId: replySnippet.authorChannelId?.value || '',
                    text: replySnippet.textOriginal, // Use textOriginal instead of textDisplay to avoid HTML tags
                    timestamp: formatRelativeTime(replySnippet.publishedAt),
                    publishedAt: replySnippet.publishedAt,
                    likes: replySnippet.likeCount || 0,
                    dislikes: 0,
                    isReply: true,
                    parentId: mainComment.id
                };
                
                processedComments.push(replyComment);
            });
        }
    });
    
    return processedComments;
}

// Format timestamp to relative time (like "2 hours ago")
function formatRelativeTime(publishedAt) {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now - published;
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('YouTube Comment Tracker extension installed');
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    console.log('YouTube Comment Tracker service worker started');
});

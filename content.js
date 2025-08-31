// YouTube User Comment Tracker - Content Script with YouTube API Integration
(async () => {
    let targetUsername = '';
    let commentContainer = null;
    let processedComments = new Set();
    let commentsLoaded = false;
    let retryCount = 0;
    let currentVideoId = '';
    let nextPageToken = null;
    let isLoadingComments = false;
    const MAX_RETRIES = 5;
    
    // Initialize the extension
    async function initialize() {
        try {
            // Get current video ID
            currentVideoId = extractVideoId();
            if (!currentVideoId) {
                console.log('No video ID found');
                return;
            }
            
            console.log('YouTube Comment Tracker initialized for video:', currentVideoId);
            
            // Get the target username from storage
            const result = await chrome.storage.sync.get(['targetUsername']);
            targetUsername = result.targetUsername || '';
            
            // Always create overlay to show status
            createCommentOverlay();
            
            updateOverlayStatus('Loading video details...');
            
            // Load comments using YouTube API
            await loadCommentsFromAPI();
            
        } catch (error) {
            console.error('Failed to initialize comment tracker:', error);
            updateOverlayStatus('Error initializing tracker: ' + error.message);
        }
    }
    
    // Extract video ID from current YouTube URL
    function extractVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');
        console.log('Extracted video ID:', videoId);
        return videoId;
    }
    
    // Load comments using YouTube API
    async function loadCommentsFromAPI() {
        if (isLoadingComments || !currentVideoId) return;
        
        isLoadingComments = true;
        updateOverlayStatus('Fetching comments from YouTube API...');
        
        try {
            // Send message to background script to fetch comments
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: "fetchComments",
                    videoId: currentVideoId,
                    pageToken: nextPageToken
                }, resolve);
            });
            
            if (response.status === "success") {
                const { comments, nextPageToken: newPageToken, totalResults } = response.data;
                nextPageToken = newPageToken;
                
                console.log(`Loaded ${comments.length} comments from API, total: ${totalResults}`);
                updateOverlayStatus(`Processing ${comments.length} comments...`);
                
                // Process the API comments
                processAPIComments(comments);
                
                // Add load more button if there are more comments
                if (nextPageToken) {
                    addLoadMoreButton();
                }
                
                // Update status based on results
                setTimeout(() => {
                    const foundComments = commentContainer.querySelectorAll('.yt-tracker-comment');
                    if (foundComments.length === 0) {
                        const message = targetUsername ? 
                            `No matching comments found from "${targetUsername}" or with timestamps` : 
                            'No timestamp comments found';
                        updateOverlayStatus(message);
                    } else {
                        updateOverlayStatus(`Found ${foundComments.length} matching comments`);
                    }
                }, 1000);
                
                commentsLoaded = true;
                
            } else {
                throw new Error(response.message || 'Failed to fetch comments');
            }
            
        } catch (error) {
            console.error('Error loading comments from API:', error);
            retryCount++;
            
            if (retryCount < MAX_RETRIES) {
                updateOverlayStatus(`API error, retrying... (${retryCount}/${MAX_RETRIES})`);
                setTimeout(() => {
                    isLoadingComments = false;
                    loadCommentsFromAPI();
                }, 2000);
            } else {
                updateOverlayStatus('Failed to load comments via API. Please check your API key.');
            }
        } finally {
            if (retryCount >= MAX_RETRIES || commentsLoaded) {
                isLoadingComments = false;
            }
        }
    }
    
    // Process comments from YouTube API
    function processAPIComments(comments) {
        comments.forEach(comment => {
            try {
                // Check if we should include this comment
                let shouldInclude = false;
                
                // Check if targeting specific username
                if (targetUsername && isTargetUser(comment.username)) {
                    shouldInclude = true;
                }
                
                // Check for timestamp patterns
                if (hasTimestampPattern(comment.text)) {
                    shouldInclude = true;
                }
                
                if (shouldInclude && !processedComments.has(comment.id)) {
                    addCommentToOverlay(comment);
                    processedComments.add(comment.id);
                }
            } catch (error) {
                console.error('Error processing API comment:', error);
            }
        });
    }
    
    // Load more comments using pagination
    async function loadMoreComments() {
        if (isLoadingComments || !nextPageToken || !currentVideoId) return;
        
        console.log('Loading more comments with page token:', nextPageToken);
        updateOverlayStatus('Loading more comments...');
        
        try {
            isLoadingComments = true;
            
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: "fetchComments",
                    videoId: currentVideoId,
                    pageToken: nextPageToken
                }, resolve);
            });
            
            if (response.status === "success") {
                const { comments, nextPageToken: newPageToken } = response.data;
                nextPageToken = newPageToken;
                
                console.log(`Loaded ${comments.length} additional comments`);
                processAPIComments(comments);
                
                updateOverlayStatus(nextPageToken ? 
                    'More comments available - click to load' : 
                    'All comments loaded');
                    
                // Update load more button
                updateLoadMoreButton();
            }
            
        } catch (error) {
            console.error('Error loading more comments:', error);
            updateOverlayStatus('Error loading more comments');
        } finally {
            isLoadingComments = false;
        }
    }
    
    // Add/update load more button
    function addLoadMoreButton() {
        if (!commentContainer) return;
        updateLoadMoreButton();
    }
    
    function updateLoadMoreButton() {
        if (!commentContainer) return;
        
        const contentDiv = commentContainer.querySelector('.yt-tracker-content');
        let loadMoreBtn = contentDiv.querySelector('.load-more-btn');
        
        if (nextPageToken) {
            if (!loadMoreBtn) {
                loadMoreBtn = document.createElement('button');
                loadMoreBtn.className = 'load-more-btn';
                loadMoreBtn.onclick = loadMoreComments;
                contentDiv.appendChild(loadMoreBtn);
            }
            loadMoreBtn.textContent = isLoadingComments ? 'Loading...' : 'Load More Comments';
            loadMoreBtn.disabled = isLoadingComments;
        } else if (loadMoreBtn) {
            loadMoreBtn.remove();
        }
    }
    
    // Force scroll to comments section to trigger loading (fallback)
    // Update overlay status message
    function updateOverlayStatus(message) {
        if (!commentContainer) return;
        
        const contentDiv = commentContainer.querySelector('.yt-tracker-content');
        if (contentDiv) {
            let statusDiv = contentDiv.querySelector('.yt-tracker-status');
            if (!statusDiv) {
                statusDiv = document.createElement('div');
                statusDiv.className = 'yt-tracker-status';
                contentDiv.insertBefore(statusDiv, contentDiv.firstChild);
            }
            statusDiv.textContent = message;
        }
    }
    
    // Create the transparent overlay container
    function createCommentOverlay() {
        // Remove existing container if it exists
        const existing = document.getElementById('yt-comment-tracker-overlay');
        if (existing) {
            existing.remove();
        }
        
        commentContainer = document.createElement('div');
        commentContainer.id = 'yt-comment-tracker-overlay';
        commentContainer.innerHTML = `
            <div class="yt-tracker-header">
                <span class="yt-tracker-title">${targetUsername ? `Tracking: ${targetUsername}` : 'Comment Tracker'}</span>
                <button class="yt-tracker-close" title="Close tracker">×</button>
            </div>
            <div class="yt-tracker-content">
                <div class="yt-tracker-status">Loading comments...</div>
            </div>
        `;
        
        // Position relative to video player
        positionOverlayToVideoPlayer();
        
        document.body.appendChild(commentContainer);
        
        // Add close button functionality
        const closeBtn = commentContainer.querySelector('.yt-tracker-close');
        closeBtn.addEventListener('click', () => {
            commentContainer.style.display = 'none';
        });
        
        // Make container draggable
        makeDraggable(commentContainer);
        
        // Reposition when window resizes
        window.addEventListener('resize', positionOverlayToVideoPlayer);
    }
    
    // Position overlay relative to video player
    function positionOverlayToVideoPlayer() {
        if (!commentContainer) return;
        
        // Find the video player element
        const videoPlayer = document.querySelector('#movie_player, .html5-video-player, #ytd-player');
        
        if (videoPlayer) {
            const playerRect = videoPlayer.getBoundingClientRect();
            
            // Position at bottom-right of video player with some margin
            const rightMargin = 20;
            const bottomMargin = 20;
            
            commentContainer.style.position = 'fixed';
            commentContainer.style.right = `${window.innerWidth - playerRect.right + rightMargin}px`;
            commentContainer.style.bottom = `${window.innerHeight - playerRect.bottom + bottomMargin}px`;
            commentContainer.style.top = 'auto';
            
            console.log('Positioned overlay relative to video player');
        } else {
            // Fallback to bottom-right of screen
            commentContainer.style.position = 'fixed';
            commentContainer.style.right = '20px';
            commentContainer.style.bottom = '20px';
            commentContainer.style.top = 'auto';
            
            console.log('Video player not found, using screen bottom-right');
        }
    }
    
    // Make the overlay draggable
    function makeDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        const header = element.querySelector('.yt-tracker-header');
        
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
            }
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                xOffset = currentX;
                yOffset = currentY;
                
                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }
        
        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
    }
    
    // Check if comment contains timestamp patterns
    function hasTimestampPattern(text) {
        if (!text) return false;
        
        // Regex to match timestamp patterns like 0:19, 1:23, 10:45, etc.
        const timestampRegex = /\b\d{1,2}:\d{2}\b/g;
        return timestampRegex.test(text);
    }
    
    // Check if the comment is from the target user
    function isTargetUser(username) {
        if (!targetUsername || !username) return false;
        return username.toLowerCase().includes(targetUsername.toLowerCase()) ||
               targetUsername.toLowerCase().includes(username.toLowerCase());
    }
    
    // Add comment to the overlay
    function addCommentToOverlay(commentData) {
        if (!commentContainer) return;
        
        const contentDiv = commentContainer.querySelector('.yt-tracker-content');
        const statusDiv = contentDiv.querySelector('.yt-tracker-status');
        
        // Remove status message on first comment
        if (statusDiv && (statusDiv.textContent.includes('Loading') || statusDiv.textContent.includes('Processing'))) {
            statusDiv.remove();
        }
        
        // Highlight timestamps in comment text
        const highlightedText = highlightTimestamps(commentData.text);
        
        // Determine comment type for styling
        const isTargetUser = targetUsername && commentData.username.toLowerCase().includes(targetUsername.toLowerCase());
        const hasTimestamp = hasTimestampPattern(commentData.text);
        
        let commentType = '';
        if (isTargetUser && hasTimestamp) {
            commentType = 'user-timestamp';
        } else if (isTargetUser) {
            commentType = 'user-only';
        } else if (hasTimestamp) {
            commentType = 'timestamp-only';
        }
        
        // Create comment element
        const commentElement = document.createElement('div');
        commentElement.className = `yt-tracker-comment ${commentType}`;
        commentElement.innerHTML = `
            <div class="yt-comment-header">
                <span class="yt-comment-author">${escapeHtml(commentData.username)}</span>
                <span class="yt-comment-timestamp">${escapeHtml(commentData.timestamp)}</span>
                ${commentType ? `<span class="yt-comment-type">${getCommentTypeLabel(commentType)}</span>` : ''}
            </div>
            <div class="yt-comment-text">${highlightedText}</div>
            <div class="yt-comment-stats">
                <span class="yt-comment-likes">👍 ${escapeHtml(commentData.likes)}</span>
            </div>
        `;
        
        // Add to top of comments (most recent first), but after load more button
        const loadMoreBtn = contentDiv.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            contentDiv.insertBefore(commentElement, loadMoreBtn);
        } else {
            contentDiv.insertBefore(commentElement, contentDiv.firstChild);
        }
        
        // Add click handlers for timestamp links
        const timestampLinks = commentElement.querySelectorAll('.timestamp-link');
        timestampLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const timestamp = parseInt(link.getAttribute('data-timestamp'));
                seekToTimestamp(timestamp);
            });
            
            // Add keyboard support
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const timestamp = parseInt(link.getAttribute('data-timestamp'));
                    seekToTimestamp(timestamp);
                }
            });
        });
        
        // Limit to 20 comments to prevent overflow
        const comments = contentDiv.querySelectorAll('.yt-tracker-comment');
        if (comments.length > 20) {
            comments[comments.length - 1].remove();
        }
        
        // Show notification
        const notificationText = isTargetUser ? 
            `New comment from ${commentData.username}` :
            `New timestamp comment: ${commentData.text.substring(0, 50)}...`;
        showNotification(notificationText);
    }
    
    // Highlight timestamp patterns in text
    function highlightTimestamps(text) {
        if (!text) return '';
        
        const timestampRegex = /\b(\d{1,2}:\d{2})\b/g;
        return escapeHtml(text).replace(timestampRegex, (match, timestamp) => {
            // Convert timestamp to seconds
            const [minutes, seconds] = timestamp.split(':').map(Number);
            const totalSeconds = minutes * 60 + seconds;
            
            return `<span class="yt-core-attributed-string__link yt-core-attributed-string__link--call-to-action-color timestamp-link" tabindex="0" data-timestamp="${totalSeconds}" style="cursor: pointer;">${timestamp}</span>`;
        });
    }
    
    // Seek video to specific timestamp (like YouTube's native behavior)
    function seekToTimestamp(seconds) {
        try {
            // Try to find the YouTube video player
            const videoElement = document.querySelector('video');
            if (videoElement) {
                videoElement.currentTime = seconds;
                console.log(`Seeked to ${seconds} seconds`);
            } else {
                console.log('Video element not found');
            }
        } catch (error) {
            console.error('Error seeking to timestamp:', error);
        }
    }
    
    // Get label for comment type
    function getCommentTypeLabel(type) {
        switch (type) {
            case 'user-timestamp': return '👤⏰';
            case 'user-only': return '👤';
            case 'timestamp-only': return '⏰';
            default: return '';
        }
    }
    
    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'yt-tracker-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Listen for storage changes (when user updates target username)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.targetUsername) {
            const oldUsername = targetUsername;
            targetUsername = changes.targetUsername.newValue || '';
            processedComments.clear();
            commentsLoaded = false;
            retryCount = 0;
            nextPageToken = null;
            
            console.log('Username changed from', oldUsername, 'to', targetUsername);
            
            if (commentContainer) {
                const title = commentContainer.querySelector('.yt-tracker-title');
                if (title) {
                    title.textContent = targetUsername ? 
                        `Tracking: ${targetUsername}` : 
                        'Timestamp Comments';
                }
                
                // Clear existing comments and restart
                const contentDiv = commentContainer.querySelector('.yt-tracker-content');
                contentDiv.innerHTML = '<div class="yt-tracker-status">Reloading comments...</div>';
                
                // Re-load comments with new settings
                setTimeout(() => {
                    loadCommentsFromAPI();
                }, 500);
            }
        }
    });
    
    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initialize, 1000);
        });
    } else {
        setTimeout(initialize, 1000);
    }
    
    // Re-initialize when navigating to new video (YouTube SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            if (url.includes('/watch')) {
                console.log('Navigation detected, reinitializing...');
                processedComments.clear();
                commentsLoaded = false;
                retryCount = 0;
                nextPageToken = null;
                isLoadingComments = false;
                setTimeout(initialize, 3000); // Wait longer for new page to load
            }
        }
    }).observe(document, { subtree: true, childList: true });
    
})();

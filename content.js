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
    let currentSortOrder = 'top'; // Default sort order
    let allComments = []; // Store all comments for client-side sorting
    let videoPlayerTimeComments = []; // Store all comments for video player time mode
    let videoTimeInterval = null; // Interval for checking video time
    let lastCheckedTime = -1; // Last checked video time
    let activeToasts = []; // Track active toast notifications
    let shownTimestamps = new Set(); // Track which timestamps have been shown to prevent duplicates
    let toastTimeout = 10; // Toast display duration in seconds (default: 10)
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
            const result = await chrome.storage.sync.get(['targetUsername', 'sortOrder', 'toastTimeout']);
            targetUsername = result.targetUsername || '';
            currentSortOrder = result.sortOrder || 'top';
            toastTimeout = result.toastTimeout || 10;
            
            // Create overlay (but hide it if in video player time mode)
            createCommentOverlay();
            
            // Handle different sort modes
            if (currentSortOrder === 'video-player-time') {
                // Hide overlay for video player time mode
                if (commentContainer) {
                    commentContainer.style.display = 'none';
                }
                updateOverlayStatus('Video time monitoring mode - overlay hidden');
                await loadCommentsForVideoPlayerTime();
            } else {
                // Show overlay for other modes
                if (commentContainer) {
                    commentContainer.style.display = 'block';
                }
                updateOverlayStatus('Loading video details...');
                await loadCommentsFromAPI();
            }
            
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
    
    // Get current video player time and duration
    function getVideoPlayerTime() {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            const currentTime = Math.floor(videoElement.currentTime);
            const duration = Math.floor(videoElement.duration);
            return { currentTime, duration };
        }
        return { currentTime: 0, duration: 0 };
    }
    
    // Convert seconds to timestamp format (e.g., 65 -> "1:05")
    function formatTimestamp(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Generate systematic timestamp patterns for the entire video duration
    function generateTimeRangeStrings(currentTime, duration) {
        const timePatterns = [];
        
        // Generate individual timestamps for every 5 seconds (optimized for API search)
        // This covers all possible timestamp mentions efficiently
        for (let i = 0; i <= Math.ceil(duration); i += 5) {
            const timestamp = Math.min(i, duration);
            timePatterns.push(formatTimestamp(timestamp));
        }
        
        // Add some common range patterns that might appear in comments
        timePatterns.push(`0:00-${formatTimestamp(duration)}`); // Full video
        
        // Add minute markers for longer videos
        for (let minutes = 1; minutes <= Math.floor(duration / 60); minutes++) {
            timePatterns.push(`${minutes}:00`);
        }
        
        console.log(`Generated ${timePatterns.length} timestamp patterns for ${formatTimestamp(duration)} video`);
        return timePatterns;
    }
    
    // Create and manage toast notifications
    function createToast(comment, timestamp) {
        const toast = document.createElement('div');
        toast.className = 'yt-timestamp-toast';
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-timestamp">${timestamp}</span>
                <span class="toast-likes">👍 ${comment.likes}</span>
            </div>
            <div class="toast-author">@${comment.username}</div>
            <div class="toast-content">${comment.text.substring(0, 200)}${comment.text.length > 200 ? '...' : ''}</div>
        `;
        
        // Position toast
        positionToast(toast);
        
        // Add to document
        document.body.appendChild(toast);
        
        // Add to active toasts array
        activeToasts.push(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('toast-visible'), 10);
        
        // Auto remove after configured timeout
        setTimeout(() => {
            removeToast(toast);
        }, toastTimeout * 1000); // Convert seconds to milliseconds
        
        console.log(`Created toast for timestamp ${timestamp}:`, comment.username);
        
        return toast;
    }
    
    // Position toast in top-right, stacking them vertically
    function positionToast(toast) {
        const topMargin = 20;
        const rightMargin = 20;
        const toastHeight = 120; // Estimated toast height
        const spacing = 10;
        
        // Calculate vertical position based on existing toasts
        const verticalOffset = activeToasts.length * (toastHeight + spacing);
        
        toast.style.position = 'fixed';
        toast.style.top = `${topMargin + verticalOffset}px`;
        toast.style.right = `${rightMargin}px`;
        toast.style.zIndex = '10001';
    }
    
    // Remove toast and reposition remaining toasts
    function removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        
        // Remove from active toasts array
        const index = activeToasts.indexOf(toast);
        if (index > -1) {
            activeToasts.splice(index, 1);
        }
        
        // Animate out
        toast.classList.add('toast-removing');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            // Reposition remaining toasts
            repositionToasts();
        }, 300);
    }
    
    // Reposition all active toasts
    function repositionToasts() {
        const topMargin = 20;
        const toastHeight = 120;
        const spacing = 10;
        
        activeToasts.forEach((toast, index) => {
            if (toast && toast.parentNode) {
                const verticalOffset = index * (toastHeight + spacing);
                toast.style.top = `${topMargin + verticalOffset}px`;
            }
        });
    }
    
    // Check if timestamp matches current video time
    function isTimestampRelevant(timestamp, currentTime) {
        // Parse timestamp format (e.g., "1:30" -> 90 seconds)
        const parts = timestamp.split(':');
        if (parts.length !== 2) return false;
        
        const minutes = parseInt(parts[0]);
        const seconds = parseInt(parts[1]);
        if (isNaN(minutes) || isNaN(seconds)) return false;
        
        const timestampSeconds = minutes * 60 + seconds;
        
        // Show toast only when video time reaches or passes the timestamp (within 3 seconds)
        // This prevents showing toasts too early
        return currentTime >= timestampSeconds && currentTime <= timestampSeconds + 3;
    }
    
    // Extract timestamps from comment text
    function extractTimestampsFromComment(commentText) {
        // Regex to match timestamp patterns like "1:30", "12:45", "0:05"
        const timestampRegex = /\b(\d{1,2}):(\d{2})\b/g;
        const timestamps = [];
        let match;
        
        while ((match = timestampRegex.exec(commentText)) !== null) {
            timestamps.push(match[0]);
        }
        
        return timestamps;
    }
    
    // Monitor video time and show relevant toasts
    function startVideoTimeMonitoring() {
        if (videoTimeInterval) {
            clearInterval(videoTimeInterval);
        }
        
        // Reset tracking for fresh start
        shownTimestamps.clear();
        lastCheckedTime = -1;
        
        console.log('Starting video time monitoring with', videoPlayerTimeComments.length, 'comments loaded');
        
        videoTimeInterval = setInterval(() => {
            if (currentSortOrder !== 'video-player-time') {
                console.log('Sort order changed, stopping video time monitoring');
                stopVideoTimeMonitoring();
                return;
            }
            
            const { currentTime } = getVideoPlayerTime();
            const currentTimeRounded = Math.floor(currentTime);
            
            // Check every second, but only log and process if time actually changed
            if (currentTimeRounded === lastCheckedTime) {
                return;
            }
            
            lastCheckedTime = currentTimeRounded;
            console.log(`Checking for relevant comments at time: ${formatTimestamp(currentTimeRounded)}`);
            
            // Find comments with timestamps relevant to current time
            const relevantComments = videoPlayerTimeComments.filter(comment => {
                const timestamps = extractTimestampsFromComment(comment.text);
                return timestamps.some(timestamp => isTimestampRelevant(timestamp, currentTime));
            });
            
            console.log(`Found ${relevantComments.length} relevant comments for current time`);
            
            // Sort by likes and show top 3 most relevant
            relevantComments
                .sort((a, b) => b.likes - a.likes)
                .slice(0, 3)
                .forEach(comment => {
                    const timestamps = extractTimestampsFromComment(comment.text);
                    const relevantTimestamp = timestamps.find(timestamp => 
                        isTimestampRelevant(timestamp, currentTime)
                    );
                    
                    if (relevantTimestamp) {
                        // Create unique key for this timestamp + comment combination
                        const timestampKey = `${relevantTimestamp}-${comment.id}`;
                        
                        // Check if we haven't already shown this specific timestamp for this comment
                        if (!shownTimestamps.has(timestampKey)) {
                            const toast = createToast(comment, relevantTimestamp);
                            if (toast) {
                                toast.setAttribute('data-comment-id', comment.id);
                                toast.setAttribute('data-timestamp', relevantTimestamp);
                                
                                // Mark this timestamp as shown
                                shownTimestamps.add(timestampKey);
                                
                                console.log(`Created toast for ${relevantTimestamp}: ${comment.username}`);
                            }
                        }
                    }
                });
            
        }, 1000); // Check every 1 second
        
        console.log('Started video time monitoring for toasts');
    }
    
    // Stop video time monitoring
    function stopVideoTimeMonitoring() {
        if (videoTimeInterval) {
            clearInterval(videoTimeInterval);
            videoTimeInterval = null;
        }
        
        // Clear all active toasts
        activeToasts.forEach(toast => removeToast(toast));
        activeToasts = [];
        
        // Reset shown timestamps tracking
        shownTimestamps.clear();
        lastCheckedTime = -1;
        
        console.log('Stopped video time monitoring');
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
                    pageToken: nextPageToken,
                    sortOrder: currentSortOrder
                }, resolve);
            });
            
            if (response.status === "success") {
                const { comments, nextPageToken: newPageToken, totalResults } = response.data;
                nextPageToken = newPageToken;
                
                console.log(`Loaded ${comments.length} comments from API, total: ${totalResults}`);
                updateOverlayStatus(`Processing ${comments.length} comments...`);
                
                // Add load more button if there are more comments (before processing comments)
                if (nextPageToken) {
                    addLoadMoreButton();
                }
                
                // Process the API comments
                processAPIComments(comments);
                
                // Update status based on results
                setTimeout(() => {
                    const foundComments = commentContainer.querySelectorAll('.yt-tracker-comment');
                    let statusMessage = '';
                    
                    if (foundComments.length === 0) {
                        if (currentSortOrder === 'top') {
                            statusMessage = 'No comments with timestamps found';
                        } else if (currentSortOrder === 'top-no-timestamps') {
                            statusMessage = 'No comments without timestamps found';
                        } else {
                            statusMessage = 'No comments found';
                        }
                    } else {
                        const sortDescription = {
                            'top': 'timestamp comments',
                            'top-no-timestamps': 'comments without timestamps',
                            'newest': 'newest comments'
                        };
                        statusMessage = `Showing ${foundComments.length} ${sortDescription[currentSortOrder] || 'comments'}`;
                    }
                    
                    updateOverlayStatus(statusMessage);
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
    
    // Load comments for video player time sorting
    async function loadCommentsForVideoPlayerTime() {
        if (isLoadingComments || !currentVideoId) return;
        
        isLoadingComments = true;
        updateOverlayStatus('Setting up video time monitoring...');
        
        try {
            // Get current video time and duration
            const { currentTime, duration } = getVideoPlayerTime();
            
            if (duration === 0) {
                updateOverlayStatus('Unable to get video duration. Please try again.');
                isLoadingComments = false;
                return;
            }
            
            updateOverlayStatus(`Loading all comments for video time monitoring...`);
            
            // Fetch ALL comments once and process locally for better performance
            console.log('Fetching all comments for video time monitoring...');
            
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: "fetchComments",
                    videoId: currentVideoId,
                    pageToken: null,
                    sortOrder: 'relevance'
                }, resolve);
            });
            
            if (response.status === "success") {
                let allComments = response.data.comments;
                
                // Continue fetching additional pages to get more comments
                let nextPageToken = response.data.nextPageToken;
                let totalFetched = allComments.length;
                const maxComments = 2000; // Reasonable limit
                
                while (nextPageToken && totalFetched < maxComments) {
                    const pageResponse = await new Promise((resolve) => {
                        chrome.runtime.sendMessage({
                            action: "fetchComments",
                            videoId: currentVideoId,
                            pageToken: nextPageToken,
                            sortOrder: 'relevance'
                        }, resolve);
                    });
                    
                    if (pageResponse.status === "success") {
                        allComments.push(...pageResponse.data.comments);
                        nextPageToken = pageResponse.data.nextPageToken;
                        totalFetched = allComments.length;
                        
                        updateOverlayStatus(`Loading comments... (${totalFetched} loaded)`);
                    } else {
                        break;
                    }
                }
                
                // Filter comments that contain timestamps
                const timeRelatedComments = allComments.filter(comment => 
                    hasTimestampPattern(comment.text)
                );
                
                // Store comments for video time monitoring
                videoPlayerTimeComments = timeRelatedComments;
                
                console.log(`Loaded ${allComments.length} total comments, ${timeRelatedComments.length} contain timestamps`);
                
                // Clear the overlay and show monitoring status
                clearComments();
                updateOverlayStatus(`Video time monitoring active! Toasts will appear based on video progress.\n\nLoaded ${timeRelatedComments.length} timestamp comments from ${allComments.length} total comments.`);
                
                // Start monitoring video time and showing toasts
                startVideoTimeMonitoring();
                
                console.log('Video time monitoring setup complete');
                commentsLoaded = true;
            } else {
                console.error('API error:', response.message);
                updateOverlayStatus('Error loading comments for time monitoring: ' + response.message);
            }
        } catch (error) {
            console.error('Error setting up video player time monitoring:', error);
            updateOverlayStatus('Failed to setup video time monitoring. Please try again.');
        } finally {
            isLoadingComments = false;
        }
    }
    
    // Process comments from YouTube API
    function processAPIComments(comments) {
        console.log(`Processing ${comments.length} API comments with sort order: ${currentSortOrder}`);
        
        // Filter comments based on sort order
        let filteredComments = comments;
        
        if (currentSortOrder === 'top') {
            // Show only comments with timestamps
            filteredComments = comments.filter(comment => hasTimestampPattern(comment.text));
            console.log(`Filtered to ${filteredComments.length} comments with timestamps`);
        } else if (currentSortOrder === 'top-no-timestamps') {
            // Show only comments without timestamps
            filteredComments = comments.filter(comment => !hasTimestampPattern(comment.text));
            console.log(`Filtered to ${filteredComments.length} comments without timestamps`);
        }
        // For 'newest', show all comments (no filtering needed)
        
        filteredComments.forEach(comment => {
            try {
                // Additional logic for special handling
                const isFromTargetUser = targetUsername && isTargetUser(comment.username);
                const hasTimestamps = hasTimestampPattern(comment.text);
                
                if (!processedComments.has(comment.id)) {
                    // Add metadata to comment for styling
                    comment.isFromTargetUser = isFromTargetUser;
                    comment.hasTimestamps = hasTimestamps;
                    
                    console.log('Adding comment to overlay:', comment.username, comment.text.substring(0, 50));
                    addCommentToOverlay(comment, false); // false = not a real-time comment, no notification
                    processedComments.add(comment.id);
                } else if (processedComments.has(comment.id)) {
                    console.log('Skipping duplicate comment:', comment.id);
                }
            } catch (error) {
                console.error('Error processing API comment:', error);
            }
        });
        
        console.log(`Total processed comments now: ${processedComments.size}`);
    }
    
    // Load more comments using pagination
    async function loadMoreComments() {
        if (isLoadingComments || !nextPageToken || !currentVideoId) {
            console.log('Load more blocked:', { isLoadingComments, nextPageToken, currentVideoId });
            return;
        }
        
        console.log('Loading more comments with page token:', nextPageToken);
        isLoadingComments = true;
        updateLoadMoreButton(); // Update button to show loading state
        
        try {
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: "fetchComments",
                    videoId: currentVideoId,
                    pageToken: nextPageToken,
                    sortOrder: currentSortOrder
                }, resolve);
            });
            
            if (response.status === "success") {
                const { comments, nextPageToken: newPageToken } = response.data;
                nextPageToken = newPageToken;
                
                console.log(`Loaded ${comments.length} additional comments. Next token:`, nextPageToken);
                processAPIComments(comments);
                
                // Update load more button
                updateLoadMoreButton();
                
                // Remove status message if it exists
                const statusDiv = commentContainer.querySelector('.yt-tracker-status');
                if (statusDiv && statusDiv.textContent.includes('Loading')) {
                    statusDiv.remove();
                }
            } else {
                console.error('Failed to load more comments:', response.message);
            }
            
        } catch (error) {
            console.error('Error loading more comments:', error);
        } finally {
            isLoadingComments = false;
            updateLoadMoreButton(); // Update button state
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
                loadMoreBtn.addEventListener('click', loadMoreComments);
                contentDiv.appendChild(loadMoreBtn);
                
                console.log('Load more button created and added to contentDiv');
                console.log('ContentDiv children after adding load more button:', contentDiv.children.length);
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
        
        // Add scroll-based loading
        addScrollBasedLoading();
        
        // Reposition when window resizes
        window.addEventListener('resize', positionOverlayToVideoPlayer);
        
        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', positionOverlayToVideoPlayer);
        document.addEventListener('webkitfullscreenchange', positionOverlayToVideoPlayer);
        document.addEventListener('mozfullscreenchange', positionOverlayToVideoPlayer);
        document.addEventListener('MSFullscreenChange', positionOverlayToVideoPlayer);
        
        // Listen for YouTube player changes (controls visibility, etc.)
        const playerObserver = new MutationObserver(() => {
            // Debounce the positioning to avoid too many calls
            clearTimeout(window.repositionTimeout);
            window.repositionTimeout = setTimeout(positionOverlayToVideoPlayer, 100);
        });
        
        // Observe changes in the player container
        const playerContainer = document.querySelector('#movie_player, .html5-video-player, #ytd-player');
        if (playerContainer) {
            playerObserver.observe(playerContainer, {
                attributes: true,
                attributeFilter: ['class', 'style'],
                childList: true,
                subtree: false
            });
        }
        
        // Also observe body class changes for theater mode
        const bodyObserver = new MutationObserver(() => {
            clearTimeout(window.repositionTimeout);
            window.repositionTimeout = setTimeout(positionOverlayToVideoPlayer, 100);
        });
        
        bodyObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    // Clear all comments from the overlay
    function clearComments() {
        if (!commentContainer) return;
        
        const contentDiv = commentContainer.querySelector('.yt-tracker-content');
        if (!contentDiv) return;
        
        // Remove all comment elements
        const commentElements = contentDiv.querySelectorAll('.yt-tracker-comment');
        commentElements.forEach(el => el.remove());
        
        // Remove load more button
        const loadMoreBtn = contentDiv.querySelector('.load-more-btn');
        if (loadMoreBtn) loadMoreBtn.remove();
        
        console.log('Comments cleared from overlay');
    }
    
    // Position overlay relative to video player
    function positionOverlayToVideoPlayer() {
        if (!commentContainer) return;
        
        // Check if we're in fullscreen mode
        const isFullscreen = !!(document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement);
        
        // Check if we're in theater mode
        const isTheaterMode = document.body.classList.contains('theater') || 
                              document.querySelector('.ytd-watch-flexy[theater]');
        
        // Find the video player element
        const videoPlayer = document.querySelector('#movie_player, .html5-video-player, #ytd-player');
        
        // Add/remove fullscreen class for CSS styling
        if (isFullscreen) {
            commentContainer.classList.add('fullscreen-mode');
        } else {
            commentContainer.classList.remove('fullscreen-mode');
        }
        
        if (videoPlayer) {
            const playerRect = videoPlayer.getBoundingClientRect();
            
            if (isFullscreen) {
                // In fullscreen: position at bottom-right, just above fullscreen button
                const rightMargin = 60; // Space for fullscreen button and some margin
                const bottomMargin = 60; // Above the controls bar
                
                commentContainer.style.position = 'fixed';
                commentContainer.style.right = `${rightMargin}px`;
                commentContainer.style.bottom = `${bottomMargin}px`;
                commentContainer.style.top = 'auto';
                commentContainer.style.zIndex = '9999999'; // Very high z-index for fullscreen
                
                console.log('Positioned overlay for fullscreen mode (bottom-right)');
            } else if (isTheaterMode) {
                // Theater mode: position at right side of video player
                const rightMargin = 50;
                const topMargin = 80; // Account for YouTube header
                
                commentContainer.style.position = 'fixed';
                commentContainer.style.right = `${window.innerWidth - playerRect.right + rightMargin}px`;
                commentContainer.style.top = `${topMargin}px`;
                commentContainer.style.bottom = 'auto';
                commentContainer.style.zIndex = '999999';
                
                console.log('Positioned overlay for theater mode');
            } else {
                // Normal mode: position at bottom-right of video player, above fullscreen button
                const rightMargin = 60; // Space for fullscreen button
                const bottomMargin = 60; // Above the controls bar
                
                commentContainer.style.position = 'fixed';
                commentContainer.style.right = `${window.innerWidth - playerRect.right + rightMargin}px`;
                commentContainer.style.bottom = `${window.innerHeight - playerRect.bottom + bottomMargin}px`;
                commentContainer.style.top = 'auto';
                commentContainer.style.zIndex = '999999';
                
                console.log('Positioned overlay relative to video player (normal mode)');
            }
        } else {
            // Fallback positioning
            if (isFullscreen) {
                commentContainer.style.position = 'fixed';
                commentContainer.style.right = '60px';
                commentContainer.style.bottom = '60px';
                commentContainer.style.top = 'auto';
                commentContainer.style.zIndex = '9999999';
            } else {
                commentContainer.style.position = 'fixed';
                commentContainer.style.right = '20px';
                commentContainer.style.bottom = '20px';
                commentContainer.style.top = 'auto';
                commentContainer.style.zIndex = '999999';
            }
            
            console.log('Video player not found, using fallback positioning');
        }
    }
    
    // Make the overlay draggable
    function makeDraggable(element) {
        let isDragging = false;
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;
        let xOffset = 0;
        let yOffset = 0;
        
        const header = element.querySelector('.yt-tracker-header');
        
        // Add visual feedback for drag state
        header.style.cursor = 'grab';
        
        header.addEventListener('mousedown', dragStart, { passive: false });
        document.addEventListener('mousemove', drag, { passive: false });
        document.addEventListener('mouseup', dragEnd);
        
        // Touch events for mobile support
        header.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', dragEnd);
        
        function dragStart(e) {
            // Handle both mouse and touch events
            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            
            initialX = clientX - xOffset;
            initialY = clientY - yOffset;
            
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
                header.style.cursor = 'grabbing';
                
                // Add dragging class for visual feedback
                element.classList.add('dragging');
                
                // Disable transitions during drag for smoother movement
                element.style.transition = 'none';
                
                // Add slight scale effect for visual feedback
                element.style.transform = `translate(${xOffset}px, ${yOffset}px) scale(1.02)`;
            }
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                
                // Handle both mouse and touch events
                const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                
                currentX = clientX - initialX;
                currentY = clientY - initialY;
                
                xOffset = currentX;
                yOffset = currentY;
                
                // Use requestAnimationFrame for smoother animation
                requestAnimationFrame(() => {
                    element.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.02)`;
                });
            }
        }
        
        function dragEnd() {
            if (isDragging) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                
                header.style.cursor = 'grab';
                
                // Remove dragging class
                element.classList.remove('dragging');
                
                // Re-enable transitions and remove scale effect
                element.style.transition = 'transform 0.2s ease-out';
                element.style.transform = `translate(${currentX}px, ${currentY}px) scale(1)`;
                
                // Reset transition after animation completes
                setTimeout(() => {
                    element.style.transition = '';
                }, 200);
            }
        }
    }
    
    // Add scroll-based loading functionality
    function addScrollBasedLoading() {
        if (!commentContainer) return;
        
        const contentDiv = commentContainer.querySelector('.yt-tracker-content');
        if (!contentDiv) return;
        
        contentDiv.addEventListener('scroll', () => {
            // Check if scrolled to bottom (within 10px)
            const isAtBottom = contentDiv.scrollTop + contentDiv.clientHeight >= contentDiv.scrollHeight - 10;
            
            if (isAtBottom && nextPageToken && !isLoadingComments) {
                console.log('Reached bottom, loading more comments...');
                loadMoreComments();
            }
        });
        
        console.log('Scroll-based loading added to comment container');
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
    function addCommentToOverlay(commentData, shouldShowNotification = false) {
        console.log('addCommentToOverlay called for:', commentData.username);
        
        if (!commentContainer) {
            console.error('Comment container not found!');
            return;
        }
        
        const contentDiv = commentContainer.querySelector('.yt-tracker-content');
        if (!contentDiv) {
            console.error('Content div not found!');
            return;
        }
        
        const statusDiv = contentDiv.querySelector('.yt-tracker-status');
        
        // Remove status message on first comment
        if (statusDiv && (statusDiv.textContent.includes('Loading') || statusDiv.textContent.includes('Processing'))) {
            statusDiv.remove();
        }
        
        // Highlight timestamps in comment text
        const highlightedText = highlightTimestamps(commentData.text);
        
        // Determine comment type for styling using the metadata we added
        const isTargetUser = commentData.isFromTargetUser || false;
        const hasTimestamp = commentData.hasTimestamps || false;
        
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
        
        // Add comments before the load more button (so they appear above it)
        const loadMoreBtn = contentDiv.querySelector('.load-more-btn');
        
        console.log('Adding comment. Load more button exists:', !!loadMoreBtn);
        
        if (loadMoreBtn) {
            console.log('Inserting comment before load more button');
            contentDiv.insertBefore(commentElement, loadMoreBtn);
        } else {
            console.log('No load more button, appending to end');
            contentDiv.appendChild(commentElement);
        }
        
        console.log('Comment element added to overlay. Current comment count:', contentDiv.querySelectorAll('.yt-tracker-comment').length);
        
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
        
        // Show notification only for real-time comments, not paginated ones
        if (shouldShowNotification) {
            const notificationText = isTargetUser ? 
                `New comment from ${commentData.username}` :
                `New comment: ${commentData.text.substring(0, 50)}...`;
            console.log('Showing notification for real-time comment');
            showNotification(notificationText);
        } else {
            console.log('Skipping notification for paginated comment');
        }
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
                    if (currentSortOrder === 'video-player-time') {
                        loadCommentsForVideoPlayerTime();
                    } else {
                        loadCommentsFromAPI();
                    }
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
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'settingsUpdated') {
            const { username, sortOrder, apiKey, toastTimeout: newToastTimeout } = request.settings;
            
            console.log('Settings updated from popup:', { username, sortOrder, apiKey, toastTimeout: newToastTimeout });
            
            // Update current settings
            const oldSortOrder = currentSortOrder;
            targetUsername = username || '';
            currentSortOrder = sortOrder || 'top';
            toastTimeout = newToastTimeout || 10;
            
            // Update overlay title
            if (commentContainer) {
                const titleSpan = commentContainer.querySelector('.yt-tracker-title');
                if (titleSpan) {
                    titleSpan.textContent = targetUsername ? `Tracking: ${targetUsername}` : 'Comment Tracker';
                }
                
                // If sort order changed, reload comments
                if (oldSortOrder !== currentSortOrder) {
                    // If switching away from video-player-time, stop monitoring
                    if (oldSortOrder === 'video-player-time' && currentSortOrder !== 'video-player-time') {
                        stopVideoTimeMonitoring();
                        // Show overlay when switching away from video player time
                        if (commentContainer) {
                            commentContainer.style.display = 'block';
                        }
                    }
                    
                    // If switching to video-player-time, hide overlay
                    if (currentSortOrder === 'video-player-time') {
                        if (commentContainer) {
                            commentContainer.style.display = 'none';
                        }
                    }
                    
                    // Clear and reload with new sort order
                    clearComments();
                    processedComments.clear();
                    nextPageToken = null;
                    commentsLoaded = false;
                    
                    // Handle video player time sorting differently
                    if (currentSortOrder === 'video-player-time') {
                        loadCommentsForVideoPlayerTime();
                    } else {
                        loadCommentsFromAPI();
                    }
                }
            }
            
            sendResponse({ status: 'success' });
        }
    });
    
})();

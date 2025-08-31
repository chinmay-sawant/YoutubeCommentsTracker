// YouTube User Comment Tracker - Content Script
(async () => {
    let targetUsername = '';
    let commentContainer = null;
    let processedComments = new Set();
    let observer = null;
    let commentsLoaded = false;
    let retryCount = 0;
    const MAX_RETRIES = 10;
    
    // Initialize the extension
    async function initialize() {
        try {
            // Get the target username from storage
            const result = await chrome.storage.sync.get(['targetUsername']);
            targetUsername = result.targetUsername || '';
            
            console.log('YouTube Comment Tracker initialized with username:', targetUsername);
            
            // Always create overlay to show status
            createCommentOverlay();
            
            if (!targetUsername) {
                updateOverlayStatus('Please set a username in the extension popup');
                return;
            }
            
            // Force load comments section and start monitoring
            await forceLoadComments();
            
            // Start monitoring for comments
            startCommentMonitoring();
            
            // Wait a bit for comments to load, then process
            setTimeout(() => {
                processExistingComments();
            }, 2000);
            
        } catch (error) {
            console.error('Failed to initialize comment tracker:', error);
            updateOverlayStatus('Error initializing tracker');
        }
    }
    
    // Force scroll to comments section to trigger loading
    async function forceLoadComments() {
        console.log('Attempting to force load comments...');
        
        // Wait for page to be ready
        await waitForElement('#comments', 5000);
        
        // Scroll to comments section to trigger loading
        const commentsSection = document.querySelector('#comments');
        if (commentsSection) {
            commentsSection.scrollIntoView({ behavior: 'smooth' });
            
            // Wait a bit then scroll back to top
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 1000);
            
            console.log('Scrolled to comments section');
        }
        
        // Try to click "Show more" or load more comments
        setTimeout(() => {
            const showMoreBtn = document.querySelector('#comments button[aria-label*="Show"], #comments button[aria-label*="more"], ytd-button-renderer button');
            if (showMoreBtn && showMoreBtn.textContent.toLowerCase().includes('show')) {
                showMoreBtn.click();
                console.log('Clicked show more comments');
            }
        }, 1500);
    }
    
    // Wait for element to appear
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }
    
    // Update overlay status message
    function updateOverlayStatus(message) {
        if (!commentContainer) return;
        
        const contentDiv = commentContainer.querySelector('.yt-tracker-content');
        if (contentDiv) {
            contentDiv.innerHTML = `<div class="yt-tracker-status">${message}</div>`;
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
    
    // Start monitoring for new comments using MutationObserver
    function startCommentMonitoring() {
        // Disconnect existing observer
        if (observer) {
            observer.disconnect();
        }
        
        console.log('Starting comment monitoring...');
        
        observer = new MutationObserver((mutations) => {
            let foundNewComments = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if new comment elements were added
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Look for comment elements in the added node
                            const commentElements = node.querySelectorAll ? 
                                node.querySelectorAll('ytd-comment-thread-renderer, ytd-comment-renderer, #comment, .comment') : [];
                            
                            if (commentElements.length > 0) {
                                foundNewComments = true;
                                // Add delay to ensure comment data is fully loaded
                                setTimeout(() => {
                                    processCommentElements(commentElements);
                                }, 500);
                            }
                            
                            // Check if the node itself is a comment element
                            if (node.matches && 
                                node.matches('ytd-comment-thread-renderer, ytd-comment-renderer, #comment, .comment')) {
                                foundNewComments = true;
                                setTimeout(() => {
                                    processCommentElements([node]);
                                }, 500);
                            }
                        }
                    });
                }
            });
            
            if (foundNewComments && !commentsLoaded) {
                commentsLoaded = true;
                updateOverlayStatus('Comments loaded! Searching for matches...');
            }
        });
        
        // Start observing the entire document for comments
        observer.observe(document, {
            childList: true,
            subtree: true
        });
        
        // Also set up a periodic check in case MutationObserver misses something
        setInterval(() => {
            if (document.querySelector('ytd-comment-thread-renderer, ytd-comment-renderer')) {
                processExistingComments();
            }
        }, 5000);
    }
    
    // Process existing comments on page load with retry logic
    function processExistingComments() {
        const commentElements = document.querySelectorAll('ytd-comment-thread-renderer, ytd-comment-renderer, #comment, .comment');
        
        if (commentElements.length === 0) {
            retryCount++;
            if (retryCount < MAX_RETRIES) {
                console.log(`No comments found, retrying... (${retryCount}/${MAX_RETRIES})`);
                updateOverlayStatus(`Loading comments... (${retryCount}/${MAX_RETRIES})`);
                setTimeout(processExistingComments, 2000);
                return;
            } else {
                updateOverlayStatus('No comments found on this video');
                return;
            }
        }
        
        console.log(`Found ${commentElements.length} comment elements`);
        commentsLoaded = true;
        updateOverlayStatus('Searching through comments...');
        
        processCommentElements(commentElements);
        
        // Update status based on results
        setTimeout(() => {
            const foundComments = commentContainer.querySelectorAll('.yt-tracker-comment');
            if (foundComments.length === 0) {
                updateOverlayStatus(targetUsername ? 
                    `No comments found from "${targetUsername}"` : 
                    'No timestamp comments found');
            }
        }, 1000);
    }
    
    // Process comment elements and filter by target username or timestamp patterns
    function processCommentElements(elements) {
        elements.forEach((element) => {
            try {
                const commentData = extractCommentData(element);
                if (commentData) {
                    let shouldInclude = false;
                    
                    // Check if targeting specific username
                    if (targetUsername && isTargetUser(commentData.username)) {
                        shouldInclude = true;
                    }
                    
                    // Check for timestamp patterns (like "0:19", "1:23", "10:45")
                    if (hasTimestampPattern(commentData.text)) {
                        shouldInclude = true;
                    }
                    
                    if (shouldInclude && !processedComments.has(commentData.id)) {
                        addCommentToOverlay(commentData);
                        processedComments.add(commentData.id);
                    }
                }
            } catch (error) {
                console.error('Error processing comment element:', error);
            }
        });
    }
    
    // Check if comment contains timestamp patterns
    function hasTimestampPattern(text) {
        if (!text) return false;
        
        // Regex to match timestamp patterns like 0:19, 1:23, 10:45, etc.
        const timestampRegex = /\b\d{1,2}:\d{2}\b/g;
        return timestampRegex.test(text);
    }
    
    // Extract comment data from YouTube comment element
    function extractCommentData(element) {
        try {
            // Find the main comment content (handle both thread and reply comments)
            const commentRenderer = element.querySelector('ytd-comment-renderer') || element;
            
            // Extract username
            const authorElement = commentRenderer.querySelector('#author-text span, #author-text a, .ytd-comment-renderer #author-text');
            const username = authorElement ? authorElement.textContent.trim() : '';
            
            // Extract comment text
            const contentElement = commentRenderer.querySelector('#content-text, .ytd-comment-renderer #content-text');
            const text = contentElement ? contentElement.textContent.trim() : '';
            
            // Extract timestamp
            const timestampElement = commentRenderer.querySelector('#published-time-text a, .published-time-text a, #published-time-text');
            const timestamp = timestampElement ? timestampElement.textContent.trim() : '';
            
            // Extract like count
            const likeElement = commentRenderer.querySelector('#vote-count-middle, .vote-count-middle, #vote-count-left');
            const likes = likeElement ? (likeElement.textContent.trim() || '0') : '0';
            
            // Create unique ID for the comment
            const id = `${username}_${timestamp}_${text.substring(0, 50)}`;
            
            if (!username || !text) {
                return null;
            }
            
            return {
                id,
                username,
                text,
                timestamp,
                likes,
                dislikes: '0' // YouTube removed public dislike counts
            };
        } catch (error) {
            console.error('Error extracting comment data:', error);
            return null;
        }
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
        if (statusDiv) {
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
        
        // Add to top of comments (most recent first)
        contentDiv.insertBefore(commentElement, contentDiv.firstChild);
        
        // Limit to 15 comments to prevent overflow
        const comments = contentDiv.querySelectorAll('.yt-tracker-comment');
        if (comments.length > 15) {
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
        return escapeHtml(text).replace(timestampRegex, '<span class="timestamp-highlight">$1</span>');
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
    
    // Show brief notification
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
                if (targetUsername) {
                    contentDiv.innerHTML = '<div class="yt-tracker-status">Searching for comments...</div>';
                    // Re-process existing comments with new username
                    setTimeout(() => {
                        processExistingComments();
                    }, 500);
                } else {
                    contentDiv.innerHTML = '<div class="yt-tracker-status">Showing timestamp comments</div>';
                    // Still show timestamp comments even without username
                    setTimeout(() => {
                        processExistingComments();
                    }, 500);
                }
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
                setTimeout(initialize, 3000); // Wait longer for new page to load
            }
        }
    }).observe(document, { subtree: true, childList: true });
    
})();

// Tab switching functionality
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`.tab-button[onclick="switchTab('${tabName}')"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Existing search engine functionality
async function performSearch() {
    const searchInput = document.getElementById('searchInput').value;
    const resultsContainer = document.getElementById('results');
    
    if (!searchInput) return;

    resultsContainer.innerHTML = 'Searching...';

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(searchInput)}`);
        const data = await response.json();

        displayResults(data);
    } catch (error) {
        resultsContainer.innerHTML = 'An error occurred while searching. Please try again.';
        console.error('Search error:', error);
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    if (!data.results || data.results.length === 0) {
        resultsContainer.innerHTML = 'No results found.';
        return;
    }

    data.results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.className = 'result-item';
        resultElement.innerHTML = `
            <h2><a href="${result.link}" target="_blank">${result.title}</a></h2>
            <div class="url">${result.link}</div>
            <p>${result.description}</p>
        `;
        resultsContainer.appendChild(resultElement);
    });
}

// New YouTube search functionality
async function searchYoutube() {
    const query = document.getElementById('youtubeInput').value;
    const resultsContainer = document.getElementById('youtube-results');
    
    if (!query) {
        resultsContainer.innerHTML = '<div class="youtube-video">Please enter a search term</div>';
        return;
    }

    resultsContainer.innerHTML = '<div class="youtube-video">Loading...</div>';

    try {
        const response = await fetch(`/youtube-search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        // Debug log
        console.log('Search response:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }

        if (!Array.isArray(data)) {
            throw new Error('Invalid response format');
        }

        displayYoutubeResults(data);
    } catch (error) {
        console.error('YouTube search error:', error);
        resultsContainer.innerHTML = `
            <div class="youtube-video error">
                <p>An error occurred while searching:</p>
                <p>${error.message}</p>
                <p>Please try again later.</p>
            </div>`;
    }
}

function displayYoutubeResults(data) {
    const resultsContainer = document.getElementById('youtube-results');
    resultsContainer.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
        resultsContainer.innerHTML = '<div class="youtube-video">No results found.</div>';
        return;
    }

    data.forEach(video => {
        if (!video || !video.id) return;

        const videoElement = document.createElement('div');
        videoElement.className = 'youtube-video';
        videoElement.onclick = () => playVideo(video.id);
        
        const thumbnailUrl = video.thumbnail?.url || 
            `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

        const title = video.title || 'No Title';
        const views = video.viewCount || '0';
        const publishDate = video.publishDate || 'No date';
        const channelTitle = video.channelTitle || '';

        videoElement.innerHTML = `
            <div class="thumbnail-container">
                <img 
                    src="${thumbnailUrl}" 
                    alt="${title}" 
                    onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22><rect width=%2216%22 height=%229%22 fill=%22%23ddd%22/></svg>'"
                    loading="lazy"
                >
                <div class="play-button">▶️</div>
            </div>
            <div class="video-info">
                <div class="video-title">${title}</div>
                <div class="channel-name">${channelTitle}</div>
                <div class="video-stats">
                    <span>👁️ ${formatNumber(views)} views</span>
                    <span>📅 ${publishDate}</span>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(videoElement);
    });
}

function playVideo(videoId) {
    const playerContainer = document.getElementById('video-player');
    
    // First add the wrapper and close button
    playerContainer.innerHTML = `
        <div class="video-player-wrapper">
            <button class="close-video" onclick="closeVideo(event)">✕</button>
            <iframe
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                title="YouTube video player"
            ></iframe>
        </div>
    `;
    
    // Then make it visible
    playerContainer.classList.add('active');
    
    // Scroll to player
    playerContainer.scrollIntoView({ behavior: 'smooth' });
}

// Update the close function to prevent event bubbling
function closeVideo(event) {
    if (event) {
        event.stopPropagation(); // Prevent event bubbling
    }
    const playerContainer = document.getElementById('video-player');
    playerContainer.classList.remove('active');
    playerContainer.innerHTML = '';
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
}

// Add this function to load trending videos
async function loadTrendingVideos() {
    const resultsContainer = document.getElementById('youtube-results');
    const homeButton = document.querySelector('.home-button');
    const trendingButton = document.querySelector('.trending-button');
    
    // Update button states
    homeButton.classList.add('active');
    trendingButton.classList.remove('active');
    
    // Clear video player if it's active
    const playerContainer = document.getElementById('video-player');
    playerContainer.classList.remove('active');
    playerContainer.innerHTML = '';

    resultsContainer.innerHTML = '<div class="youtube-video">Loading trending videos...</div>';

    try {
        const response = await fetch('/trending-videos');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load trending videos');
        }

        displayYoutubeResults(data);
    } catch (error) {
        console.error('Error loading trending videos:', error);
        resultsContainer.innerHTML = `
            <div class="youtube-video error">
                <p>Failed to load trending videos</p>
                <p>${error.message}</p>
            </div>`;
    } finally {
        homeButton.classList.remove('loading');
    }
}

// Add this function to create the background animation
function createBackgroundAnimation() {
    const container = document.createElement('div');
    container.className = 'background-animation';
    document.body.appendChild(container);

    // Create multiple particles
    for (let i = 0; i < 50; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random initial position
    const startX = Math.random() * window.innerWidth;
    particle.style.left = `${startX}px`;
    particle.style.bottom = '-20px';
    
    // Random size
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random animation duration and delay
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 10;
    particle.style.animation = `float-particle ${duration}s ${delay}s infinite linear`;
    
    container.appendChild(particle);
}

// Add this to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    loadTrendingVideos();
    createBackgroundAnimation();
}); 

async function loadTopTrending() {
    const resultsContainer = document.getElementById('youtube-results');
    const homeButton = document.querySelector('.home-button');
    const trendingButton = document.querySelector('.trending-button');
    
    // Update button states
    homeButton.classList.remove('active');
    trendingButton.classList.add('active');
    
    // Clear video player if it's active
    const playerContainer = document.getElementById('video-player');
    playerContainer.classList.remove('active');
    playerContainer.innerHTML = '';

    resultsContainer.innerHTML = '<div class="youtube-video">Loading top trending videos...</div>';

    try {
        const response = await fetch('/top-trending');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load trending videos');
        }

        displayYoutubeResults(data);
    } catch (error) {
        console.error('Error loading top trending:', error);
        resultsContainer.innerHTML = `
            <div class="youtube-video error">
                <p>Failed to load trending videos</p>
                <p>${error.message}</p>
            </div>`;
    } finally {
        trendingButton.classList.remove('active');
    }
} 
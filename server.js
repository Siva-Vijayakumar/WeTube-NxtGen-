const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Add CORS headers for production
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files with caching
app.use(express.static('public', {
    maxAge: '1h',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        const response = await axios.get('https://google-search74.p.rapidapi.com/', {
            params: {
                query: query,
                limit: 10,
                related_keywords: true
            },
            headers: {
                'x-rapidapi-host': 'google-search74.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY
            }
        });

        if (!response.data) {
            throw new Error('Invalid API response');
        }

        res.json(response.data);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: 'An error occurred while fetching search results',
            details: error.message 
        });
    }
});

app.get('/youtube-search', async (req, res) => {
    try {
        const query = req.query.q;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        console.log('Searching YouTube for:', query);

        const response = await axios.get('https://yt-api.p.rapidapi.com/search', {
            params: { 
                query: query,
            },
            headers: {
                'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY
            }
        });

        console.log('API Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (!response.data || !response.data.data) {
            throw new Error('Invalid response structure');
        }

        const videos = response.data.data;
        const transformedData = videos
            .filter(video => video.type === 'video')
            .map(video => {
                // Get the best quality thumbnail
                const thumbnails = video.thumbnails || [];
                const bestThumbnail = thumbnails.reduce((best, current) => {
                    // Try to get the highest quality thumbnail
                    if (!best || (current.height > best.height)) {
                        return current;
                    }
                    return best;
                }, null);

                return {
                    id: video.videoId,
                    title: video.title,
                    description: video.description,
                    thumbnail: {
                        url: bestThumbnail?.url || video.thumbnail?.url || ''
                    },
                    viewCount: video.viewCount || '0',
                    publishDate: video.publishedTimeText || ''
                };
            });

        console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
        console.log('Thumbnail example:', transformedData[0]?.thumbnail?.url); // Debug log
        res.json(transformedData);
    } catch (error) {
        console.error('YouTube API Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        res.status(500).json({ 
            error: 'An error occurred while fetching YouTube data',
            details: error.message,
            status: error.response?.status
        });
    }
});

app.get('/trending-videos', async (req, res) => {
    try {
        // List of Tamil YouTube channels and their IDs
        const tamilChannels = [
            { query: 'Village Cooking Channel latest' },
            { query: 'Madhan Gowri latest' },
            { query: 'A2D Channel latest' },
            { query: 'Tech Superstar tamil latest' },
            { query: 'Mad Brothers tamil latest' },
            { query: 'Out of Focus tamil latest' },
            { query: 'C4ETech tamil latest' }
        ];

        // Randomly select 3 channels to fetch videos from
        const selectedChannels = tamilChannels
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        // Fetch videos from selected channels
        const videoPromises = selectedChannels.map(channel =>
            axios.get('https://yt-api.p.rapidapi.com/search', {
                params: {
                    query: channel.query,
                    limit: 7 // Fetch 7 videos per channel
                },
                headers: {
                    'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY
                }
            })
        );

        const responses = await Promise.all(videoPromises);
        
        // Combine and transform all video results
        let allVideos = [];
        responses.forEach(response => {
            if (response.data && response.data.data) {
                const videos = response.data.data
                    .filter(video => video.type === 'video')
                    .map(video => ({
                        id: video.videoId,
                        title: video.title,
                        description: video.description,
                        thumbnail: {
                            url: video.thumbnails?.[0]?.url || ''
                        },
                        viewCount: video.viewCount || '0',
                        publishDate: video.publishedTimeText || '',
                        channelTitle: video.channelTitle || ''
                    }));
                allVideos = allVideos.concat(videos);
            }
        });

        // Shuffle the videos for variety
        allVideos.sort(() => 0.5 - Math.random());

        console.log(`Fetched ${allVideos.length} Tamil videos`);
        res.json(allVideos);

    } catch (error) {
        console.error('Tamil Videos API Error:', error);
        res.status(500).json({ 
            error: 'An error occurred while fetching Tamil videos',
            details: error.message
        });
    }
});

app.get('/top-trending', async (req, res) => {
    try {
        const response = await axios.get('https://yt-api.p.rapidapi.com/trending', {
            params: { 
                geo: 'IN', // Set to India for Tamil content
                type: 'video',
                limit: 20
            },
            headers: {
                'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY
            }
        });

        if (!response.data || !response.data.data) {
            throw new Error('Invalid API response structure');
        }

        const videos = response.data.data
            .filter(video => video.type === 'video')
            .slice(0, 20) // Ensure we only get top 20
            .map(video => ({
                id: video.videoId,
                title: video.title,
                description: video.description,
                thumbnail: {
                    url: video.thumbnails?.[0]?.url || ''
                },
                viewCount: video.viewCount || '0',
                publishDate: video.publishedTimeText || '',
                channelTitle: video.channelTitle || ''
            }));

        console.log(`Fetched ${videos.length} trending videos`);
        res.json(videos);

    } catch (error) {
        console.error('Top Trending API Error:', error);
        res.status(500).json({ 
            error: 'An error occurred while fetching trending videos',
            details: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something broke!',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
}); 
async function performSearch() {
    const searchInput = document.getElementById('searchInput').value;
    const resultsContainer = document.getElementById('results');
    
    if (!searchInput) return;

    resultsContainer.innerHTML = '<div class="result-item">Searching...</div>';

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(searchInput)}`);
        const data = await response.json();
        console.log('Search results:', data); // Debug log
        displayResults(data);
    } catch (error) {
        resultsContainer.innerHTML = '<div class="result-item">An error occurred while searching. Please try again.</div>';
        console.error('Search error:', error);
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    // Check if data exists and has results
    if (!data || !data.results || data.results.length === 0) {
        resultsContainer.innerHTML = '<div class="result-item">No results found.</div>';
        return;
    }

    // Loop through the search results
    data.results.forEach(result => {
        // Make sure we have a valid URL
        const url = result.url || result.link || '#';
        const title = result.title || 'No Title';
        const description = result.description || result.snippet || 'No description available';

        const resultElement = document.createElement('div');
        resultElement.className = 'result-item';
        
        resultElement.innerHTML = `
            <h2>
                <a href="${url}" target="_blank" rel="noopener noreferrer">
                    ${title}
                </a>
            </h2>
            <div class="url">${url}</div>
            <p>${description}</p>
        `;
        
        resultsContainer.appendChild(resultElement);
    });
} 
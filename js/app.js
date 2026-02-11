/**
 * NeonBeat App Logic
 */

// State
let state = {
    followedArtists: new Set(),
    activeTab: 'view-timeline',
    sortCriteria: 'popularity', // 'popularity', 'name', 'debut'
    filterMode: 'all' // 'all', 'following'
};

// DOM Elements
const views = {
    timeline: document.getElementById('view-timeline'),
    explore: document.getElementById('view-explore'),
    artists: document.getElementById('view-artists')
};

const containers = {
    timeline: document.getElementById('timeline-container'),
    explore: document.getElementById('explore-grid'),
    artists: document.getElementById('artist-list')
};

const sortButtons = document.querySelectorAll('.btn-sort');

const modal = {
    el: document.getElementById('modal-release'),
    backdrop: document.querySelector('.modal-backdrop'),
    closeBtn: document.querySelector('.close-modal'),
    cover: document.getElementById('modal-cover'),
    title: document.getElementById('modal-title'),
    artist: document.getElementById('modal-artist'),
    meta: document.getElementById('modal-meta'),
    links: {
        youtube: document.getElementById('link-youtube'),
        apple: document.getElementById('link-apple'),
        spotify: document.getElementById('link-spotify'),
        amazon: document.getElementById('link-amazon')
    }
};

// Initialization
async function init() {
    try {
        console.log('🚀 App initialization started');
        loadState();
        setupNavigation();
        setupSortControls();
        setupModal();

        // Render initial views with placeholders
        console.log('🎨 Initial render...');
        renderAll();

        // Load artist images in background
        console.log('📸 Loading artist images in background...');
        loadArtistImages((artist) => {
            updateArtistImageInUI(artist);
        }).catch(err => console.error('Background image load error:', err));

        console.log('✅ App initialization complete');
    } catch (error) {
        console.error('CRITICAL: App failed to initialize:', error);
        // Display on screen if possible
        const errBanner = document.createElement('div');
        errBanner.style.padding = '20px';
        errBanner.style.color = '#ff6b6b';
        errBanner.innerHTML = `<h2>Launch Failed</h2><p>${error.message}</p>`;
        document.body.prepend(errBanner);
    }
}

// Helper to update specific artist image in the DOM without full re-render
function updateArtistImageInUI(artist) {
    const item = document.querySelector(`.artist-item[data-artist-name="${artist.name}"]`);
    if (item) {
        const img = item.querySelector('.artist-avatar');
        if (img && img.src !== artist.image) {
            img.src = artist.image;
        }
    }
}

// State Management
function loadState() {
    // Load followed artists from localStorage
    const saved = localStorage.getItem('followedArtists');

    if (saved) {
        try {
            const followedList = JSON.parse(saved);
            state.followedArtists = new Set(followedList);
            console.log('Loaded followed artists from localStorage:', followedList);
        } catch (e) {
            console.error('Failed to parse localStorage data:', e);
            // Fallback to mock data on error
            initializeDefaultFollows();
        }
    } else {
        // First time visit - initialize from mock data defaults
        initializeDefaultFollows();
        console.log('First visit - initialized with default follows');
    }
}

function initializeDefaultFollows() {
    // Initialize from mock data default follows
    artists.forEach(artist => {
        if (artist.isFollowed) {
            state.followedArtists.add(artist.id);
        }
    });
    // Save to localStorage immediately
    saveState();
}

function saveState() {
    const followedList = [...state.followedArtists];
    localStorage.setItem('followedArtists', JSON.stringify(followedList));
    localStorage.setItem('lastSync', new Date().toISOString());
    console.log('Saved followed artists to localStorage:', followedList);
}

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetId = item.dataset.target;
            switchTab(targetId);
        });
    });
}

function setupSortControls() {
    // Sort Buttons
    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            sortButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.sortCriteria = btn.dataset.sort;
            renderArtists();
        });
    });

    // Filter Buttons - updated to use btn-sort class for consistent design
    const filterButtons = document.querySelectorAll('button[data-filter]');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filterMode = btn.dataset.filter;
            renderArtists();
        });
    });
}

function switchTab(viewId) {
    // Update State
    state.activeTab = viewId;

    // Update Views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');

    // Update Nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.target === viewId) {
            item.classList.add('active');
        }
    });

    // Re-render if necessary
    if (viewId === 'view-timeline') {
        // Only re-render if we suspect changes (e.g. follows changed) or if empty
        // For simplicity in this v1 connected to API, we'll re-fetch to ensure freshness
        // In production, we should cache this.
        renderTimeline();
    } else if (viewId === 'view-explore') {
        renderExplore();
    }
}

// Render Logic
function renderAll() {
    renderTimeline();
    renderExplore();
    renderArtists();
}

async function renderTimeline() {
    const container = containers.timeline;

    const followedIds = Array.from(state.followedArtists);
    const followedArtistsList = artists.filter(a => state.followedArtists.has(a.id));

    if (followedArtistsList.length === 0) {
        container.innerHTML = '';
        document.getElementById('timeline-empty').classList.remove('hidden');
        return;
    } else {
        document.getElementById('timeline-empty').classList.add('hidden');
    }

    // specific loading state
    container.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Updating timeline...</div>';

    try {
        // Fetch releases for all followed artists
        const promises = followedArtistsList.map(artist => fetchArtistReleases(artist));
        const results = await Promise.all(promises);
        const allFetchedReleases = results.flat();

        container.innerHTML = '';

        if (allFetchedReleases.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 2rem;">No releases found.</div>';
            return;
        }

        // Group by Date
        const grouped = groupByDate(allFetchedReleases);

        // Sort dates descending
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(date => {
            const group = grouped[date];
            const dateEl = document.createElement('div');
            dateEl.className = 'timeline-date-group';

            // Date Label
            const dateLabel = document.createElement('div');
            dateLabel.className = 'timeline-date-label';
            dateLabel.textContent = formatDate(date);
            dateEl.appendChild(dateLabel);

            // Cards
            group.forEach(release => {
                const card = createReleaseCard(release);
                dateEl.appendChild(card);
            });

            container.appendChild(dateEl);
        });
    } catch (err) {
        console.error('Timeline render error:', err);
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #ff6b6b;">Failed to load releases.</div>';
    }
}

async function renderExplore() {
    const container = containers.explore;

    // Check if already populated to avoid re-fetching on every tab switch (simple cache)
    if (container.children.length > 0 && !container.querySelector('.fa-spinner')) return;

    container.innerHTML = '<div style="text-align:center; padding: 2rem; width: 100%; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Loading trending releases...</div>';

    // Fetch for top 5 popular artists as "Trending"
    const topArtists = [...artists].sort((a, b) => b.popularity - a.popularity).slice(0, 5);

    try {
        const promises = topArtists.map(artist => fetchArtistReleases(artist));
        const results = await Promise.all(promises);
        const allReleases = results.flat().sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = '';

        allReleases.forEach(release => {
            const card = createReleaseCard(release);
            card.style.marginLeft = '0';
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #ff6b6b;">Failed to load explore.</div>';
    }
}

function renderArtists() {
    const container = containers.artists;
    container.innerHTML = '';

    let allArtists = [...artists]; // Create copy

    // Filter logic
    if (state.filterMode === 'following') {
        allArtists = allArtists.filter(a => state.followedArtists.has(a.id));
    }

    // Sort logic
    if (state.sortCriteria === 'name') {
        allArtists.sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.sortCriteria === 'debut') {
        allArtists.sort((a, b) => new Date(a.debutDate) - new Date(b.debutDate));
    } else {
        // Popularity (Default)
        allArtists.sort((a, b) => b.popularity - a.popularity);
    }

    allArtists.forEach(artist => {
        const item = document.createElement('div');
        item.className = 'artist-item';
        item.dataset.artistName = artist.name; // Add this for efficient updating

        const isFollowing = state.followedArtists.has(artist.id);

        item.innerHTML = `
            <div class="artist-info">
                <img src="${artist.image}" alt="${artist.name}" class="artist-avatar" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=random&color=fff&size=200';">
                <div style="display:flex; flex-direction:column;">
                    <span class="artist-name">${artist.name}</span>
                    <span style="font-size:0.7rem; color: #a0a0b0;">Debut: ${artist.debutDate.split('-')[0]}</span>
                </div>
            </div>
            <button class="btn-follow ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${artist.id}')">
                ${isFollowing ? 'Following' : 'Follow'}
            </button>
        `;

        container.appendChild(item);
    });
}

// Components
function createReleaseCard(release) {
    const artist = artists.find(a => a.id === release.artistId);

    const card = document.createElement('div');
    card.className = 'release-card';
    card.onclick = () => openModal(release);

    const isNew = isRecent(release.date);

    card.innerHTML = `
        <div style="position: relative;">
            <img src="${release.image}" alt="${release.title}" class="card-cover">
            ${isNew ? '<span class="release-badge badge-new">NEW</span>' : ''}
        </div>
        <div class="card-info">
            <h3 class="card-title">${release.title}</h3>
            <p class="card-artist">${artist ? artist.name : 'Unknown Artist'}</p>
        </div>
    `;

    return card;
}

// Actions
window.toggleFollow = function (artistId) {
    if (state.followedArtists.has(artistId)) {
        state.followedArtists.delete(artistId);
    } else {
        state.followedArtists.add(artistId);
    }

    saveState();
    renderArtists(); // Re-render button state
    // Don't re-render timeline immediately to avoid jarring shifts, wait for tab switch or explicit refresh
};

// Modal Logic
function setupModal() {
    modal.closeBtn.addEventListener('click', closeModal);
    modal.backdrop.addEventListener('click', closeModal);
}

async function openModal(release) {
    modal.el.classList.add('active');

    // Modern Loading State
    const modalBody = document.getElementById('modal-release-body');
    modalBody.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height:300px;">
            <p style="font-size: 1.2rem; color: var(--text-muted);">Loading...</p>
        </div>
    `;

    // Fetch Details
    const details = await fetchAlbumDetails(release.id);

    if (!details) {
        modalBody.innerHTML = '<p class="error">Failed to load details.</p>';
        return;
    }

    const { collection, tracks } = details;

    // Build Split Layout
    const releaseYear = new Date(release.date).getFullYear();
    const totalDurationMs = tracks.reduce((acc, t) => acc + t.durationMs, 0);
    const totalDurationMin = Math.ceil(totalDurationMs / 60000);

    modalBody.innerHTML = `
        <div class="album-detail-view">
            <!-- Left: Album Info -->
            <div class="album-info-side">
                <img src="${release.image}" alt="${release.title}" class="album-cover-large">
                <h2 class="album-title-large">${collection.collectionName}</h2>
                <p class="album-artist-large">${collection.artistName}</p>
                <div class="album-meta-large">
                    <span class="album-type"><i class="fa-solid fa-compact-disc"></i> ${collection.collectionType === 'Collection' ? 'Album' : 'Single'}</span>
                    <span>${releaseYear}</span>
                    <span>${tracks.length} Songs</span>
                    <span>${totalDurationMin} min</span>
                </div>
                
                <div class="album-actions">
                    <a href="${collection.collectionViewUrl}" target="_blank" class="btn-streaming apple">
                        <i class="fa-brands fa-apple"></i> Apple Music
                    </a>
                    <a href="${release.links.spotify}" target="_blank" class="btn-streaming spotify">
                        <i class="fa-brands fa-spotify"></i> Spotify
                    </a>
                    <a href="${release.links.youtube}" target="_blank" class="btn-streaming youtube">
                        <i class="fa-brands fa-youtube"></i> YouTube Music
                    </a>
                    <a href="${release.links.amazon}" target="_blank" class="btn-streaming amazon">
                        <i class="fa-brands fa-amazon"></i> Amazon Music
                    </a>
                    <div class="action-row">
                        <button class="btn-icon"><i class="fa-regular fa-heart"></i></button>
                        <button class="btn-icon"><i class="fa-solid fa-share-nodes"></i></button>
                    </div>
                </div>
            </div>

            <!-- Right: Tracklist -->
            <div class="album-tracks-side">
                <div class="tracklist">
                    ${tracks.map((track, index) => `
                        <div class="track-item" onclick="window.open('${collection.collectionViewUrl}', '_blank')">
                            <span class="track-num">${index + 1}</span>
                            <div class="track-info">
                                <span class="track-title">${track.title}</span>
                                <span class="track-artist">${track.artist}</span> <!-- distinct artist for complilations -->
                            </div>
                            <span class="track-duration">${formatDuration(track.durationMs)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Helper for duration
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function closeModal() {
    modal.el.classList.remove('active');
}

// Utilities
function groupByDate(list) {
    return list.reduce((groups, item) => {
        const date = item.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(item);
        return groups;
    }, {});
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function isRecent(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 30; // "New" if within 30 days
}

// Start App
document.addEventListener('DOMContentLoaded', init);

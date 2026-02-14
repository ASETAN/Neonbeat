/**
 * Neonbeat App Logic
 */

// State
let state = {
    followedArtists: new Set(),
    activeTab: 'view-timeline',
    sortCriteria: 'name', // 'popularity', 'name', 'debut'
    filterMode: 'all', // 'all', 'following'
    preferredApp: 'apple' // 'apple', 'spotify', 'youtube', 'amazon'
};

// DOM Elements
const views = {
    timeline: document.getElementById('view-timeline'),
    explore: document.getElementById('view-explore'),
    artists: document.getElementById('view-artists'),
    artistDetail: document.getElementById('view-artist-detail')
};

const containers = {
    timeline: document.getElementById('timeline-container'),
    explore: document.getElementById('explore-grid'),
    artists: document.getElementById('artist-list'),
    artistDetail: document.getElementById('artist-detail-container')
};

const sortButtons = document.querySelectorAll('button[data-sort]');

const modal = {
    el: document.getElementById('modal-release'),
    backdrop: document.querySelector('.modal-backdrop'),
    closeBtn: document.querySelector('.close-modal'),
    cover: document.getElementById('modal-cover'),
    title: document.getElementById('modal-title'),
    artist: document.getElementById('modal-artist'),
    meta: document.getElementById('modal-meta'),
    links: {
        amazon: document.getElementById('link-amazon')
    }
};

const settingsModal = {
    el: document.getElementById('modal-settings'),
    closeBtn: document.getElementById('close-settings'),
    inputs: document.querySelectorAll('input[name="music-app"]'),
    trigger: document.getElementById('btn-settings'),
    backdrop: document.querySelector('#modal-settings .modal-backdrop')
};

// Initialization
async function init() {
    try {
        console.log('🚀 App initialization started');
        loadState();
        setupNavigation();
        setupSortControls();
        setupNavigation();
        setupSortControls();
        setupModal();
        setupSettings();
        setupSwipeToClose();

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
        document.body.prepend(errBanner);
    }
}

// Helper for Loader
function showLoader(container, text = 'Loading...') {
    // Check if loader already exists
    let loader = container.querySelector('.loader-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'loader-overlay';
        loader.innerHTML = `
            <div class="loader-ring-wrapper">
                <div class="neon-ring"></div>
            </div>
            <div class="loader-text">${text}</div>
        `;
        container.appendChild(loader);
    } else {
        // Update text
        loader.querySelector('.loader-text').textContent = text;
        loader.style.display = 'flex'; // Show if hidden
    }
}

function hideLoader(container) {
    const loader = container.querySelector('.loader-overlay');
    if (loader) {
        loader.remove(); // Or style.display = 'none' if we want to reuse DOM
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

    const savedApp = localStorage.getItem('preferredApp');
    if (savedApp) {
        state.preferredApp = savedApp;
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
    localStorage.setItem('preferredApp', state.preferredApp);
    console.log('Saved state', state);
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

    // Back Button for Artist Detail
    const btnBackArtist = document.getElementById('btn-back-artist');
    if (btnBackArtist) {
        btnBackArtist.addEventListener('click', () => {
            closeArtistDetail();
        });
    }
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

            // User Requirement: Force A-Z sort when "All" is selected
            if (state.filterMode === 'all') {
                state.sortCriteria = 'name';

                // Update UI for sort buttons
                sortButtons.forEach(b => {
                    b.classList.toggle('active', b.dataset.sort === 'name');
                });
            }

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

async function renderTimeline(forceRefresh = false) {
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

    // Check if we already have content to avoid re-fetching on every tab switch
    // Only fetch if empty, forced, or it's been a long time (optional, simpler is just check empty)
    if (!forceRefresh && container.querySelectorAll('.timeline-date-group').length > 0) {
        // We have data, don't re-render.
        return;
    }

    // Loading State
    showLoader(container, 'Updating timeline...');

    try {
        // Fetch releases for all followed artists
        const promises = followedArtistsList.map(artist => fetchArtistReleases(artist));
        const results = await Promise.all(promises);
        const allFetchedReleases = results.flat();

        hideLoader(container);

        container.innerHTML = ''; // Only clear NOW

        if (allFetchedReleases.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 2rem;">No releases found.</div>';
            return;
        }

        // Group by Date
        const grouped = groupByDate(allFetchedReleases);
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
        hideLoader(container);
        console.error('Timeline render error:', err);
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #ff6b6b;">Failed to load releases.</div>';
    }
}

async function renderExplore() {
    const container = containers.explore;

    // Check if already populated to avoid re-fetching on every tab switch (simple cache)
    if (container.children.length > 0 && !container.querySelector('.fa-spinner')) return;

    showLoader(container, 'Loading trending...');

    showLoader(container, 'Loading recent releases...');

    // Fetch for ALL artists (New Requirement: All registered artists, last 1 month)
    const allArtists = [...artists];
    const ONE_MONTH_AGO = new Date();
    ONE_MONTH_AGO.setMonth(ONE_MONTH_AGO.getMonth() - 1);

    try {
        // We might want to chunk this if there are too many artists, but for ~60 it's fine.
        const promises = allArtists.map(artist => fetchArtistReleases(artist));
        const results = await Promise.all(promises);

        // Flatten and Filter
        const allReleases = results.flat()
            .filter(release => new Date(release.date) >= ONE_MONTH_AGO)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        hideLoader(container);
        container.innerHTML = ''; // Clear only after success

        allReleases.forEach(release => {
            const card = createReleaseCard(release, true);
            card.style.marginLeft = '0';
            container.appendChild(card);
        });
    } catch (err) {
        hideLoader(container);
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
            <div class="artist-info" onclick="openArtistDetail('${artist.id}')" style="cursor: pointer; flex: 1;">
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
function createReleaseCard(release, showDate = false) {
    const artist = artists.find(a => a.id === release.artistId);

    const card = document.createElement('div');
    card.className = 'release-card';
    card.onclick = () => openModal(release);

    const badgeStatus = getReleaseStatus(release.date);
    let badgeHtml = '';
    if (badgeStatus === 'upcoming') {
        badgeHtml = '<span class="release-badge badge-upcoming" style="background: #7bdcb5; color: #000;">UPCOMING</span>';
    } else if (badgeStatus === 'new') {
        badgeHtml = '<span class="release-badge badge-new">NEW</span>';
    }

    card.innerHTML = `
        <div style="position: relative;">
            <img src="${release.image}" alt="${release.title}" class="card-cover">
            <br> <!-- Spacer -->
            ${badgeHtml}
        </div>
        <div class="card-info">
            <h3 class="card-title">${release.title}</h3>
            <p class="card-artist">
                ${artist ? artist.name : 'Unknown Artist'}
                ${showDate ? `<span style="font-size: 0.85em; opacity: 0.7; margin-left: 5px;">${formatDate(release.date)}</span>` : ''}
            </p>
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
    // BUT we must clear it so next visit fetches the new artist list
    containers.timeline.innerHTML = '';
};

// Modal Logic
function setupModal() {
    modal.closeBtn.addEventListener('click', closeModal);
    modal.backdrop.addEventListener('click', closeModal);
}

async function openModal(release) {
    console.log('openModal called for:', release.id);
    modal.el.classList.add('active');

    // Modern Loading State
    // Unified Loading State:
    // 1. Show Modal Container (which has backdrop)
    // 2. Hide Content via CSS (.loading)
    // 3. Show Loader on the Modal Container (fullscreen overlay effect)

    modal.el.classList.add('loading');

    // Attach loader to the modal container (fullscreen)
    showLoader(modal.el, 'Loading details...');

    // Fetch Details
    const details = await fetchAlbumDetails(release.id);

    hideLoader(modal.el);

    if (!details) {
        // If failed, maybe show error in a toast or just close? 
        // For now, let's just close to avoid stuck state, or alert.
        console.error("Failed to load details");
        closeModal();
        return;
    }

    // Prepare Content
    const { collection, tracks } = details;

    // ... (Build Split Layout HTML) - same as before
    // Build Split Layout
    const releaseYear = new Date(release.date).getFullYear();
    const totalDurationMs = tracks.reduce((acc, t) => acc + t.durationMs, 0);
    const totalDurationMin = Math.ceil(totalDurationMs / 60000);

    const modalBody = document.getElementById('modal-release-body');
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
                        <i class="fa-brands fa-apple"></i> <span>Apple Music</span>
                    </a>
                    <a href="${release.links.spotify}" target="_blank" class="btn-streaming spotify">
                        <i class="fa-brands fa-spotify"></i> <span>Spotify</span>
                    </a>
                    <a href="${release.links.youtube}" target="_blank" class="btn-streaming youtube">
                        <i class="fa-brands fa-youtube"></i> <span>YouTube Music</span>
                    </a>
                    <a href="${release.links.amazon}" target="_blank" class="btn-streaming amazon">
                        <i class="fa-brands fa-amazon"></i> <span>Amazon Music</span>
                    </a>
                </div>
            </div>

            <!-- Right: Tracklist -->
            <div class="album-tracks-side">
                <div class="tracklist">
                    ${tracks.map((track, index) => `
                        <div class="track-item" onclick="openTrack(this, '${track.title.replace(/'/g, "\\'")}', '${track.artist.replace(/'/g, "\\'")}', '${collection.collectionViewUrl}', '${collection.collectionName.replace(/'/g, "\\'")}' )">
                            <span class="track-num">${index + 1}</span>
                            <div class="track-info">
                                <span class="track-title">${track.title}</span>
                                <span class="track-artist">${track.artist}</span>
                            </div>
                            <!-- Mobile visual cue -->
                            <i class="fa-solid fa-play track-play-icon"></i>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    // Show Content with animation (remove loading class)
    modal.el.classList.remove('loading');
}

// Helper for duration
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function closeModal() {
    modal.el.classList.remove('active');
    modal.el.classList.remove('loading'); // Ensure reset
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

function getReleaseStatus(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    // Reset time components for accurate date comparison
    date.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        // Future date -> UPCOMING
        return 'upcoming';
    } else if (diffDays >= 0 && diffDays <= 7) {
        // Today or within last 7 days -> NEW
        return 'new';
    }
    return 'none';
}

// Start App
// Artist Detail Logic
async function openArtistDetail(artistId) {
    const artist = artists.find(a => a.id === artistId);
    if (!artist) return;

    // Set Header
    document.getElementById('artist-detail-name').textContent = artist.name;

    // Show View (Overlay)
    views.artistDetail.classList.add('active');

    // Render Timeline for this artist
    const container = containers.artistDetail;
    // Clear previous artist's data immediately to avoid confusion?
    // Or overlay?
    // If we overlay, user sees old artist while loading new.
    // Let's clear for now as it's a "navigation".
    container.innerHTML = '';
    showLoader(container, 'Loading releases...');

    try {
        const releases = await fetchArtistReleases(artist);
        hideLoader(container);

        // ... (rest of logic handles empty container)
        container.innerHTML = '';

        if (releases.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 2rem;">No releases found.</div>';
            return;
        }

        // Group by Date (reuse existing logic or just list?)
        // Let's use the timeline grouping for consistency
        const grouped = groupByDate(releases);
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(date => {
            const group = grouped[date];
            const dateEl = document.createElement('div');
            dateEl.className = 'timeline-date-group';

            const dateLabel = document.createElement('div');
            dateLabel.className = 'timeline-date-label';
            dateLabel.textContent = formatDate(date);
            dateEl.appendChild(dateLabel);

            group.forEach(release => {
                const card = createReleaseCard(release);
                dateEl.appendChild(card);
            });
            container.appendChild(dateEl);
        });

    } catch (e) {
        hideLoader(container);
        console.error(e);
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #ff6b6b;">Failed to load.</div>';
    }
}

function closeArtistDetail() {
    views.artistDetail.classList.remove('active');
}

// Settings Logic
function setupSettings() {
    if (settingsModal.trigger) {
        settingsModal.trigger.addEventListener('click', () => {
            // Set current value
            settingsModal.inputs.forEach(input => {
                if (input.value === state.preferredApp) {
                    input.checked = true;
                }
            });
            settingsModal.el.classList.add('active');
        });
    }

    if (settingsModal.closeBtn) settingsModal.closeBtn.addEventListener('click', closeSettings);
    if (settingsModal.backdrop) settingsModal.backdrop.addEventListener('click', closeSettings);

    settingsModal.inputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.preferredApp = e.target.value;
            saveState();
            // Optional: Close on selection? No, let user explicity close.
        });
    });
}

function closeSettings() {
    settingsModal.el.classList.remove('active');
}

// Track Opening Logic
window.openTrack = function (el, title, artist, appleUrl, albumName) {
    const query = encodeURIComponent(`${artist} ${title}`);
    const albumQuery = encodeURIComponent(`${artist} ${albumName}`);
    let url = '';

    // Add visual feedback
    el.style.backgroundColor = 'rgba(255,0,85,0.2)';
    setTimeout(() => { el.style.backgroundColor = ''; }, 300);

    switch (state.preferredApp) {
        case 'spotify':
            url = `https://open.spotify.com/search/${query}`;
            break;
        case 'youtube':
            url = `https://music.youtube.com/search?q=${query}`;
            break;
        case 'amazon':
            url = `https://music.amazon.com/search/${query}`;
            break;
        case 'apple':
        default:
            // For Apple, we have a direct link often, but it goes to album.
            // If we have a trackId it would be better, but simple album link is fine.
            // We can also search if we prefer.
            url = appleUrl || `https://music.apple.com/jp/search?term=${query}`;
            break;
    }

    window.open(url, '_blank');
};

// Swipe to Close Logic for Modal
function setupSwipeToClose() {
    const content = document.querySelector('#modal-release .modal-content');
    let startY = 0;
    let isDragging = false;

    // Bind to the entire content for "swipe anywhere"
    // We must handle scroll conflict: only drag if scrollTop is 0 and pulling down

    content.addEventListener('touchstart', (e) => {
        // Only allow drag initiation if we are at the top
        if (content.scrollTop <= 0) {
            startY = e.touches[0].clientY;
            isDragging = true;
            // We don't disable transition here yet, to allow normal scroll start
        } else {
            isDragging = false;
        }
    }, { passive: true });

    content.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        // Only handle dragging DOWN (positive diff)
        if (diff > 0) {
            // Check again if we are at top (in case momentum scrolling happened)
            if (content.scrollTop <= 0) {
                // Prevent default only if we are actually dragging the modal to avoid pull-to-refresh
                if (e.cancelable) e.preventDefault();

                content.style.transition = 'none';
                content.style.transform = `translateY(${diff}px)`;
            } else {
                isDragging = false; // We scrolled down, cancel drag
            }
        } else {
            // Scrolling up - let efficient native scroll handle it
            isDragging = false;
        }
    }, { passive: false }); // Non-passive to allow preventDefault

    content.addEventListener('touchend', (e) => {
        if (!isDragging) return;

        // Check current transform to see if we moved enough
        // We can't rely just on touch position since we might have cancelled drag
        const style = window.getComputedStyle(content);
        const matrix = new WebKitCSSMatrix(style.transform);
        const diff = matrix.m42; // TranslateY value

        isDragging = false;
        content.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        if (diff > 100) { // Threshold to close
            closeModal();
            setTimeout(() => {
                content.style.transform = '';
            }, 300);
        } else {
            // Snap back
            content.style.transform = '';
        }
    });
}

// Start App
document.addEventListener('DOMContentLoaded', init);

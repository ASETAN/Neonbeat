/**
 * Mock Data for NeonBeat
 */

const artistNames = [
    "BLACKPINK", "TWICE", "NewJeans", "aespa", "(G)I-DLE", "IVE", "Red Velvet", "ITZY", "BABYMONSTER", "Girls’ Generation",
    "LE SSERAFIM", "IU", "2NE1", "MAMAMOO", "Kep1er", "STAYC", "Apink", "NMIXX", "OH MY GIRL", "KARA",
    "f(x)", "IZ*ONE", "EVERGLOW", "Dreamcatcher", "LOONA", "WJSN", "fromis_9", "EXID", "SISTAR", "T-ARA",
    "AOA", "Wonder Girls", "Miss A", "VIVIZ", "ILLIT", "tripleS", "H1-KEY", "SECRET", "CLC", "Billlie",
    "Weeekly", "FIFTY FIFTY", "Rocket Punch", "CSR", "LIGHTSUM", "PURPLE KISS", "EL7Z UP", "Cherry Bullet", "woo!ah!", "KISS OF LIFE",
    "BTS", "SEVENTEEN", "EXO", "Stray Kids", "BIGBANG", "NCT 127", "NCT DREAM", "TXT (TOMORROW X TOGETHER)", "ENHYPEN", "Super Junior",
    "SHINee", "ATEEZ", "Wanna One", "MONSTA X", "iKON", "GOT7", "TREASURE", "ZEROBASEONE", "TVXQ", "RIIZE",
    "BOYNEXTDOOR", "THE BOYZ", "INFINITE", "2PM", "BTOB", "ASTRO", "SF9", "VIXX", "PENTAGON", "Highlight",
    "CRAVITY", "ONEUS", "ONF", "Xdinary Heroes", "FTISLAND", "CNBLUE", "WINNER", "AB6IX", "TEMPEST", "TWS",
    "EVNNE", "PLAVE", "Golden Child", "CIX", "DRIPPIN", "KINGDOM", "TO1", "MCND", "MIRAE", "WEi"
];

// Curated images for top artists - REMOVED due to CORS issues with Spotify CDN
// All images will be fetched from iTunes API instead
const artistImages = {
    // Empty - all images will be fetched from iTunes API
};

// Map specific artists to their iTunes Artist ID to ensure accuracy (e.g. IVE K-Pop vs others)
const specialArtistIds = {
    "IVE": "1594159996"
};

// Generate Artists List
const artists = artistNames.map((name, index) => {
    // Mock debut dates (random year between 2015-2023)
    const year = 2015 + Math.floor(Math.random() * 9);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    const debutDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Mock popularity (random 1-100)
    // Give top artists higher popularity for demo
    let popularity = Math.floor(Math.random() * 60) + 20;
    if (["NewJeans", "BTS", "TWICE", "IVE", "SEVENTEEN", "Stray Kids"].includes(name)) {
        popularity += 40; // Boost top groups
    }

    return {
        id: `a${index + 1}`,
        name: name,
        itunesId: specialArtistIds[name] || null,
        image: artistImages[name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200`,
        isFollowed: ["NewJeans", "BTS", "TWICE", "IVE"].includes(name), // Default follows
        debutDate: debutDate,
        popularity: popularity
    };
});

// iTunes Search API Access
async function fetchArtistReleases(artist) {
    try {
        let url;

        // Use Lookup API if we have a specific ID (more accurate)
        if (artist.itunesId) {
            url = `https://itunes.apple.com/lookup?id=${artist.itunesId}&entity=album&limit=100&sort=recent&country=JP`;
        } else {
            // Fallback to Search API
            const query = encodeURIComponent(artist.name);
            url = `https://itunes.apple.com/search?term=${query}&country=JP&media=music&entity=album&limit=200&sort=recent`;
        }

        const response = await fetch(url);

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        let rawResults = data.results;

        // If using lookup, the first result might be the artist object, so filter for collections
        if (artist.itunesId) {
            rawResults = rawResults.filter(item => item.wrapperType === 'collection');
        } else {
            // For search, filter by name
            // Filter out items that don't match the artist name strictly
            // Use a more relaxed check for short names like "Twice" to avoid being excluded by "Twice (Japan)" etc unwantedly
            const targetName = artist.name.toLowerCase().replace(/\s/g, '');

            rawResults = rawResults.filter(item => {
                if (!item.artistName) return false;
                const itemArtist = item.artistName.toLowerCase().replace(/\s/g, '');
                // Check exact match or starts with or "Twice" inside (but dangerous for generic words, luckily Twice is specific enough in Music context usually)
                return itemArtist === targetName || itemArtist.includes(targetName) || targetName.includes(itemArtist);
            });
        }

        // SORT by date descending manually because API sort is unreliable
        rawResults.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

        // Slice to top 10
        const topReleases = rawResults.slice(0, 10);

        return topReleases.map(item => {
            return {
                id: String(item.collectionId),
                artistId: artist.id,
                title: item.collectionName,
                date: item.releaseDate, // ISO String
                type: item.collectionType === 'Album' && item.trackCount < 7 ? 'EP/Single' : 'Album',
                image: item.artworkUrl100.replace('100x100', '600x600'), // Upgrade quality
                links: {
                    apple: item.collectionViewUrl,
                    youtube: `https://music.youtube.com/search?q=${encodeURIComponent(item.collectionName + ' ' + item.artistName)}`,
                    spotify: `https://open.spotify.com/search/${encodeURIComponent(item.collectionName)}`
                }
            };
        });
    } catch (error) {
        console.error(`Failed to fetch releases for ${artist.name}:`, error);
        return [];
    }
}

// Fetch Album Details (Tracks)
async function fetchAlbumDetails(collectionId) {
    try {
        const response = await fetch(`https://itunes.apple.com/lookup?id=${collectionId}&entity=song&country=JP`);

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        // results[0] is the collection itself, the rest are tracks
        const collection = data.results[0];
        const tracks = data.results.slice(1);

        return {
            collection: collection,
            tracks: tracks.map(track => ({
                trackNumber: track.trackNumber,
                title: track.trackName,
                durationMs: track.trackTimeMillis,
                previewUrl: track.previewUrl,
                artist: track.artistName
            }))
        };
    } catch (error) {
        console.error(`Failed to fetch details for album ${collectionId}:`, error);
        return null;
    }
}

// Fetch Artist Image from iTunes API
async function fetchArtistImageFromiTunes(artistName) {
    try {
        const query = encodeURIComponent(artistName);
        const url = `https://itunes.apple.com/search?term=${query}&country=JP&media=music&entity=musicArtist&limit=5`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Find the best match (exact or closest match)
            const targetName = artistName.toLowerCase().replace(/\s/g, '');
            let bestMatch = data.results[0];

            for (const result of data.results) {
                if (result.artistName) {
                    const resultName = result.artistName.toLowerCase().replace(/\s/g, '');
                    if (resultName === targetName || resultName.includes(targetName)) {
                        bestMatch = result;
                        break;
                    }
                }
            }

            // Get artwork URL and upgrade to higher resolution
            if (bestMatch.artworkUrl100) {
                return bestMatch.artworkUrl100.replace('100x100', '600x600');
            } else if (bestMatch.artworkUrl60) {
                return bestMatch.artworkUrl60.replace('60x60', '600x600');
            }
        }

        return null;
    } catch (error) {
        console.error(`Failed to fetch image for ${artistName}:`, error);
        return null;
    }
}

// Load all artist images with caching
async function loadArtistImages() {
    const CACHE_KEY = 'artistImages_v1';
    const TIMESTAMP_KEY = 'artistImages_timestamp';
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    console.log('🎭 loadArtistImages() called');

    // Check cache validity
    const cachedImages = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(TIMESTAMP_KEY);

    if (cachedImages && cachedTimestamp) {
        const age = Date.now() - new Date(cachedTimestamp).getTime();
        if (age < CACHE_DURATION) {
            // Use cached images
            const imageMap = JSON.parse(cachedImages);
            console.log('✅ Using cached artist images:', Object.keys(imageMap).length, 'artists');

            // Apply cached images to artists
            artists.forEach(artist => {
                if (imageMap[artist.name]) {
                    artist.image = imageMap[artist.name];
                }
            });

            return;
        } else {
            console.log('⏰ Cache expired, fetching new images');
        }
    } else {
        console.log('🆕 No cache found, fetching images for the first time');
    }

    // Fetch new images
    console.log('🌐 Fetching artist images from iTunes API...');
    const imageMap = {};
    let fetchedCount = 0;
    let skippedCount = 0;

    // Fetch images for all artists
    const fetchPromises = artists.map(async (artist) => {
        // Use hardcoded image if available (these are high quality Spotify images)
        if (artistImages[artist.name]) {
            artist.image = artistImages[artist.name];
            imageMap[artist.name] = artistImages[artist.name];
            skippedCount++;
            return;
        }

        // Fetch from iTunes API
        const imageUrl = await fetchArtistImageFromiTunes(artist.name);
        if (imageUrl) {
            artist.image = imageUrl;
            imageMap[artist.name] = imageUrl;
            fetchedCount++;
            console.log(`  ✓ ${artist.name}`);
        } else {
            // Keep placeholder
            imageMap[artist.name] = artist.image;
            console.log(`  ⚠ ${artist.name} - no image found, using placeholder`);
        }
    });

    await Promise.all(fetchPromises);

    // Save to cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(imageMap));
    localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
    console.log(`✅ Artist images cached: ${fetchedCount} fetched, ${skippedCount} from hardcoded, ${artists.length} total`);
}

// Helper to access artist list
function getArtists() {
    return artists;
}

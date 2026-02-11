/**
 * NeonBeat Static Data
 * Generated via Admin Dashboard
 */

// This list should be populated using the Admin Tool (admin.html)
// For now, we seed it with critical artists using VERIFIED IDs
const artists = [
    {
        "id": "a1",
        "name": "IVE",
        "itunesId": "1594159996",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/05/c2/f7/05c2f741-2856-42d4-1a35-185cb52613d9/cover.jpg/600x600bb.jpg",
        "isFollowed": true,
        "debutDate": "2021-12-01",
        "popularity": 85
    },
    {
        "id": "a2",
        "name": "NewJeans",
        "itunesId": "1634560799",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/0c/3f/910c3f7e-ecc7-1011-3957-30dbca74a621/196922466795.jpg/600x600bb.jpg",
        "isFollowed": true,
        "debutDate": "2022-07-22",
        "popularity": 90
    },
    {
        "id": "a3",
        "name": "LE SSERAFIM",
        "itunesId": "1620611425",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/4a/14/c1/4a14c19d-7738-f80e-b83c-1b7029524029/cover.jpg/600x600bb.jpg",
        "isFollowed": false,
        "debutDate": "2022-05-02",
        "popularity": 80
    },
    {
        "id": "a4",
        "name": "aespa",
        "itunesId": "1540309605",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/d9/0b/c6/d90bc663-e3c3-3760-234b-ba0416955030/cover.jpg/600x600bb.jpg",
        "isFollowed": false,
        "debutDate": "2020-11-17",
        "popularity": 82
    },
    {
        "id": "a5",
        "name": "TWICE",
        "itunesId": "1056529729",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d9/33/83/d933833d-53d9-482a-4394-0d53c6eade04/cover.jpg/600x600bb.jpg",
        "isFollowed": true,
        "debutDate": "2015-10-20",
        "popularity": 88
    },
    {
        "id": "a6",
        "name": "BTS",
        "itunesId": "550302450",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/9d/a8/12/9da81250-b389-c44d-5282-e567df484437/cover.jpg/600x600bb.jpg",
        "isFollowed": true,
        "debutDate": "2013-06-13",
        "popularity": 95
    },
    {
        "id": "a7",
        "name": "SEVENTEEN",
        "itunesId": "993414920",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/a5/d8/d5/a5d8d5df-6a3f-5d07-6bcf-97d8ba1512ba/PLEDIS_SEVENTEEN_FML.jpg/600x600bb.jpg",
        "isFollowed": false,
        "debutDate": "2015-05-26",
        "popularity": 85
    },
    {
        "id": "a8",
        "name": "Stray Kids",
        "itunesId": "1306346740",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2a/39/3a/2a393aad-73a7-e549-0125-9c94f59392e2/cover.jpg/600x600bb.jpg",
        "isFollowed": false,
        "debutDate": "2018-03-25",
        "popularity": 88
    }
];

// Re-export function to access list
function getArtists() {
    return artists;
}

// ----------------------------------------------------------------------
// Simplified Logic: No Image Fetching Required (Images are Static)
// ----------------------------------------------------------------------

async function loadArtistImages(onProgress) {
    console.log('✅ Static images loaded instantly.');
    artists.forEach(a => {
        if (onProgress) onProgress(a);
    });
}

// ----------------------------------------------------------------------
// iTunes Search API Access (Robust with Vercel Support)
// ----------------------------------------------------------------------

// JSONP Helper to bypass CORS with timeout
function jsonp(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_' + Math.round(100000 * Math.random());
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('JSONP request timed out'));
        }, timeout);

        function cleanup() {
            clearTimeout(timeoutId);
            if (window[callbackName]) delete window[callbackName];
            if (script.parentNode) document.body.removeChild(script);
        }

        window[callbackName] = function (data) {
            cleanup();
            resolve(data);
        };

        const script = document.createElement('script');
        script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
        script.onerror = () => {
            cleanup();
            reject(new Error('JSONP request failed'));
        };
        document.body.appendChild(script);
    });
}

async function fetchArtistReleases(artist) {
    try {
        if (!artist.itunesId) {
            console.warn(`Skipping releases for ${artist.name} (No ID)`);
            return [];
        }

        // Use Vercel API Proxy if available
        const isVercel = window.location.hostname.includes('vercel.app');
        let data;

        if (isVercel) {
            // Use Vercel API Proxy
            const url = `/api/lookup?id=${artist.itunesId}&entity=album&limit=20&sort=recent&country=JP`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('API Network response was not ok');
            data = await response.json();
        } else {
            // Use JSONP locally
            const url = `https://itunes.apple.com/lookup?id=${artist.itunesId}&entity=album&limit=20&sort=recent&country=JP`;
            data = await jsonp(url);
        }

        if (!data.results || data.results.length === 0) return [];

        // Filter and Map
        // Results[0] is Artist, rest are Albums
        const releases = data.results
            .filter(item => item.wrapperType === 'collection')
            .map(item => ({
                id: String(item.collectionId),
                artistId: artist.id,
                title: item.collectionName,
                date: item.releaseDate, // ISO String
                type: item.collectionType === 'Album' && item.trackCount < 7 ? 'EP/Single' : 'Album',
                image: item.artworkUrl100.replace('100x100', '600x600'), // Upgrade quality
                links: {
                    apple: item.collectionViewUrl,
                    youtube: `https://music.youtube.com/search?q=${encodeURIComponent(item.collectionName + ' ' + item.artistName)}`,
                    spotify: `https://open.spotify.com/search/${encodeURIComponent(item.collectionName)}`,
                    amazon: `https://music.amazon.com/search/${encodeURIComponent(item.collectionName + ' ' + item.artistName)}`
                }
            }));

        // Sort by Date
        return releases.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    } catch (error) {
        console.error(`Failed to fetch releases for ${artist.name}:`, error);
        return [];
    }
}

async function fetchAlbumDetails(collectionId) {
    try {
        const isVercel = window.location.hostname.includes('vercel.app');
        let data;

        if (isVercel) {
            const url = `/api/lookup?id=${collectionId}&entity=song&country=JP`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('API Network response was not ok');
            data = await response.json();
        } else {
            const url = `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&country=JP`;
            data = await jsonp(url);
        }

        if (!data.results || data.results.length === 0) return null;

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

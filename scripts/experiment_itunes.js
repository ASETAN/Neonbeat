var https = require('https');

const artistId = '1203816887'; // TWICE
const configs = [
    { country: 'JP', lang: null, label: 'JP Store (Default)' },
    { country: 'US', lang: null, label: 'US Store (Default)' },
    { country: 'KR', lang: null, label: 'KR Store (Default)' },
    { country: 'US', lang: 'ko_kr', label: 'US Store + KR Lang' },
    { country: 'JP', lang: 'en_us', label: 'JP Store + EN Lang' },
    { country: 'KR', lang: 'en_us', label: 'KR Store + EN Lang' }
];

function fetchItunes(config) {
    return new Promise((resolve, reject) => {
        let url = `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=3&country=${config.country}`;
        if (config.lang) url += `&lang=${config.lang}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const albums = json.results.filter(r => r.wrapperType === 'collection').map(r => r.collectionName);
                    resolve({ label: config.label, albums: albums });
                } catch (e) {
                    resolve({ label: config.label, error: e.message });
                }
            });
        }).on('error', (err) => resolve({ label: config.label, error: err.message }));
    });
}

async function run() {
    console.log('Running iTunes API Experiment for TWICE...');
    for (const config of configs) {
        const result = await fetchItunes(config);
        console.log(`\n--- ${result.label} ---`);
        if (result.error) {
            console.log('Error:', result.error);
        } else {
            result.albums.forEach(a => console.log(`- ${a}`));
        }
    }
}

run();

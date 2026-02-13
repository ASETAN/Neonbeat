export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const params = url.searchParams;

    // Extract query parameters
    const term = params.get('term');
    const country = params.get('country') || 'JP';
    const entity = params.get('entity') || 'album';
    const limit = params.get('limit') || '50';
    const sort = params.get('sort') || 'recent';
    const attribute = params.get('attribute') || '';

    if (!term) {
        return new Response(JSON.stringify({ error: 'Missing term parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=${entity}&limit=${limit}&sort=${sort}`;
    if (attribute) {
        itunesUrl += `&attribute=${attribute}`;
    }

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    try {
        const response = await fetch(itunesUrl, { headers });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`iTunes API Error: ${response.status} ${response.statusText} - ${text}`);
        }

        const text = await response.text();
        if (!text) {
            throw new Error('iTunes API returned empty response');
        }

        const data = JSON.parse(text);
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

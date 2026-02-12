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

    try {
        const response = await fetch(itunesUrl);
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const params = url.searchParams;

    // Extract query parameters
    const id = params.get('id');
    const entity = params.get('entity') || 'album';
    const limit = params.get('limit') || '200';
    const sort = params.get('sort') || 'recent';
    const country = params.get('country') || 'JP';

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const itunesUrl = `https://itunes.apple.com/lookup?id=${id}&entity=${entity}&limit=${limit}&sort=${sort}&country=${country}`;

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

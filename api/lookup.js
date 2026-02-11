export default async function handler(request, response) {
    const { id, entity, limit, sort, country } = request.query;
    const url = `https://itunes.apple.com/lookup?id=${id}&entity=${entity}&limit=${limit}&sort=${sort}&country=${country}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}

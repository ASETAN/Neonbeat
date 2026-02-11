export default async function handler(request, response) {
    const { term, country, entity, limit, sort } = request.query;
    const url = `https://itunes.apple.com/search?term=${term}&country=${country}&entity=${entity}&limit=${limit}&sort=${sort}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}

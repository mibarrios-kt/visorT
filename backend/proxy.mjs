import express from 'express';
import fetch from 'node-fetch';
import https from 'https';

const app = express();

const agent = new https.Agent({
    rejectUnauthorized: false
});

app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url || !url.startsWith('https://fews.ideam.gov.co/visorfews/data/series/jsonH/')) {
        return res.status(400).json({error: 'URL inválida'});
    }
    try {
        const response = await fetch(url, { agent });
        if (!response.ok) {
            return res.status(response.status).json({error: 'Error al obtener el JSON', status: response.status});
        }
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({error: 'No se pudo obtener el JSON', details: err.message});
    }
});

app.listen(3001, () => console.log('Proxy escuchando en http://localhost:3001'));
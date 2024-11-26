import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 3000;
const WSS_PORT = 3001;

// CORS'u etkinleştir
app.use(cors());

// Hedef URL'nin temeli
const baseUrl = 'https://livetiming.formula1.com';

// WebSocket sunucusunu oluştur
const wss = new WebSocketServer({ port: WSS_PORT });
console.log(`WebSocket sunucusu ws://localhost:${WSS_PORT} adresinde çalışıyor`);

// WebSocket bağlantılarını dinle
wss.on('connection', (ws) => {
    console.log('Yeni WebSocket bağlantısı');

    ws.on('message', async (message) => {
        try {
            // İstemciden gelen hedef path'i çöz
            const targetPath = message.toString();

            // Eğer path '/' ile başlamıyorsa, otomatik olarak ekle
            const formattedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
            const targetUrl = `${baseUrl}${formattedPath}`;

            console.log(`Proxy yönlendiriyor (WebSocket): ${targetUrl}`);

            // Hedef URL'ye istek gönder
            const response = await fetch(targetUrl);

            // Gelen içerik türünü al
            const contentType = response.headers.get('content-type');

            // İçeriğe göre işlem yap
            if (contentType && contentType.includes('application/json')) {
                // JSON ise ayrıştır ve istemciye gönder
                const data = await response.json();
                ws.send(JSON.stringify({ type: 'json', data }));
            } else {
                // JSON değilse ham veriyi istemciye gönder
                const buffer = await response.buffer();
                ws.send(JSON.stringify({ type: 'binary', contentType }));
                ws.send(buffer);
            }
        } catch (error) {
            console.error('Hata oluştu (WebSocket):', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Bir hata oluştu' }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket bağlantısı kapandı');
    });
});

// HTTP sunucusu
app.get('/', (req, res) => {
    res.send('WebSocket sunucusu için ws://localhost:3001 adresine bağlanın');
});

app.listen(PORT, () => {
    console.log(`HTTP sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});

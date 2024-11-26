import fetch from 'node-fetch';
import { WebSocketServer } from 'ws';

const WSS_PORT = 3001; // WebSocket sunucusu portu

// WebSocket sunucusunu oluştur
const wss = new WebSocketServer({ port: WSS_PORT });
console.log(`WebSocket sunucusu ws://localhost:${WSS_PORT} adresinde çalışıyor`);

// Hedef URL'nin temeli
const baseUrl = 'https://livetiming.formula1.com';

// WebSocket bağlantılarını dinle
wss.on('connection', (ws) => {
    console.log('Yeni WebSocket bağlantısı kuruldu');

    // Mesaj alındığında
    ws.on('message', async (message) => {
        try {
            const targetPath = message.toString();
            const targetUrl = `${baseUrl}${targetPath}`;

            console.log(`Proxy yönlendiriyor (WebSocket): ${targetUrl}`);

            // Hedef URL'ye istek gönder
            const response = await fetch(targetUrl);
            const contentType = response.headers.get('content-type');

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

    // WebSocket bağlantısı kapandığında
    ws.on('close', () => {
        console.log('WebSocket bağlantısı kapandı');
    });
});

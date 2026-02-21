const https = require('https');
const http = require('http');
const fs = require('fs');
// Load environment from .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
envFile.split('\n').forEach(line => {
    const match = line.trim().match(/^([^=]+)=(.*)$/);
    if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/\r$/, '');
    }
});

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = 'http://localhost:3000/api/telegram/webhook';

if (!TOKEN || TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('Please set TELEGRAM_BOT_TOKEN in .env.local');
    process.exit(1);
}

console.log('🔄 Starting Telegram local polling...');
console.log('⚡ Forwarding to: ' + WEBHOOK_URL);
console.log('✅ Bot is running! Open Telegram and type /start');

let offset = 0;

function fetchUpdates() {
    const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.ok && response.result.length > 0) {
                    for (const update of response.result) {
                        offset = update.update_id + 1;
                        forwardToWebhook(update);
                    }
                }
            } catch (err) {
                console.error('Error parsing telegram response:', err.message);
            }
            // Poll again immediately
            fetchUpdates();
        });
    }).on('error', (err) => {
        console.error('Network error checking updates:', err.message);
        setTimeout(fetchUpdates, 5000); // Retry after 5s
    });
}

function forwardToWebhook(update) {
    const updateData = JSON.stringify(update);
    console.log(`[>>] Received Update ${update.update_id} - Forwarding...`);

    const req = http.request(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(updateData)
        }
    }, (res) => {
        if (res.statusCode !== 200) {
            console.error(`[<<] Webhook returned status ${res.statusCode}`);
        } else {
            console.log(`[<<] Successfully answered.`);
        }
    });

    req.on('error', (err) => {
        console.error(`[!!] Could not connect to dev server (${WEBHOOK_URL}). Is it running?`);
    });

    req.write(updateData);
    req.end();
}

// Remove previously set webhook to enable polling
https.get(`https://api.telegram.org/bot${TOKEN}/deleteWebhook`, () => {
    fetchUpdates();
});

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8080;
const WWW_DIR = path.resolve(__dirname, 'www');

const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.ico':'image/x-icon','.svg':'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(WWW_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startTunnel();
});

function startTunnel() {
  try {
    const localtunnel = require('localtunnel');
    localtunnel({ port: PORT }).then(async (tunnel) => {
      const url = tunnel.url;
      console.log('\n=== URL PÚBLICA:', url, '===');
      buildApk(url);
    }).catch((e) => {
      console.error('Tunnel error:', e.message);
      process.exit(1);
    });
  } catch (e) {
    console.error('Failed to start tunnel:', e.message);
    process.exit(1);
  }
}

function buildApk(publicUrl) {
  const manifestUrl = publicUrl.replace(/\/$/, '') + '/manifest.json';
  console.log('Manifest URL:', manifestUrl);
  
  const payload = JSON.stringify({ url: manifestUrl });
  const options = {
    hostname: 'pwabuilder.com',
    port: 443,
    path: '/api/package',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  };

  const req = https.request(options, (res) => {
    console.log('PWABuilder API Status:', res.statusCode);
    if (res.statusCode === 200) {
      const filePath = path.resolve(__dirname, 'bats-tarot.apk');
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log('\n✓ APK generado:', filePath, `(${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB)`);
        process.exit(0);
      });
    } else {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.error('API Error:', body);
        process.exit(1);
      });
    }
  });
  req.on('error', (e) => { console.error('Request failed:', e.message); process.exit(1); });
  req.write(payload);
  req.end();
}

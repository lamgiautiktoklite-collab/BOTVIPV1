const http = require('http');

function startServer(port) {
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<h1>🔱 Hệ thống Vô Cực Ma Thần đang Trực Tuyến 🔱</h1>');
        res.end();
    }).listen(port, () => {
        console.log(`🌐 Server Keep-Alive đang chạy tại Port: ${port}`);
    });
}

module.exports = startServer;

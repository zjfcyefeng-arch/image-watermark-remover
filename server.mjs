/**
 * 本地开发静态文件服务器
 * 将 /public 目录 serve 在端口 3000
 * 同时将 /api/* 请求代理到 wrangler dev (端口 8787)
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

const PORT = 3000;
const PUBLIC_DIR = join(process.cwd(), 'public');
const WRANGLER_URL = 'http://localhost:8787';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // 代理 API 请求到 wrangler dev
  if (pathname.startsWith('/api/')) {
    try {
      const proxyUrl = `${WRANGLER_URL}${pathname}`;
      console.log(`  🔄 ${req.method} ${pathname} -> wrangler`);

      const body = await readBody(req);
      const proxyRes = await fetch(proxyUrl, {
        method: req.method,
        headers: {
          'Content-Type': req.headers.get('content-type') || 'application/json',
          ...Object.fromEntries(
            Object.entries(req.headers)
              .filter(([k]) => !['host', 'content-length', 'connection'].includes(k.toLowerCase()))
          )
        },
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? body : undefined,
      });

      const data = await readBody(proxyRes);
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
      
      // 处理 CORS 预检
      if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
      }

      res.writeHead(proxyRes.status, {
        'Content-Type': 'application/json',
        ...corsHeaders,
      });
      res.end(data);
    } catch (err) {
      console.error(`  ❌ API 错误: ${err.message}`);
      res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: false, error: 'API_SERVICE_UNAVAILABLE', message: 'wrangler dev 未运行' }));
    }
    return;
  }

  // 静态文件服务
  let filePath = join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await readFile(filePath);

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1>');
    } else {
      console.error(`  ❌ 文件错误: ${err.message}`);
      res.writeHead(500);
      res.end('Server Error');
    }
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = createServer(handleRequest);
server.listen(PORT, () => {
  console.log('');
  console.log('🚀 本地开发服务器已启动!');
  console.log(`   前端: http://localhost:${PORT}`);
  console.log(`   API:  http://localhost:8787`);
  console.log('');
  console.log('等待 wrangler dev 启动...');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请先停止其他服务`);
  } else {
    console.error('❌ 服务器错误:', err);
  }
  process.exit(1);
});

#!/bin/bash
# 本地开发启动脚本
# 1. 启动 wrangler dev (Worker API on port 8787)
# 2. 启动静态文件服务器 (port 3000)，代理 API 到 wrangler

cd "$(dirname "$0")"

echo "=========================================="
echo "  🖼️ WatermarkAI 本地开发环境"
echo "=========================================="

# 检查 .dev.vars 是否存在
if [ ! -f .dev.vars ]; then
  echo ""
  echo "⚠️  警告: .dev.vars 文件不存在"
  echo "   请复制 .dev.vars.example 为 .dev.vars 并填入你的 API Key"
  echo "   cp .dev.vars.example .dev.vars"
  echo ""
  echo "   如果不创建 .dev.vars，Worker 将无法调用 SiliconFlow API"
  echo ""
fi

# 启动 wrangler dev
echo ""
echo "🔧 启动 Wrangler Worker (端口 8787)..."
npx wrangler dev --port 8787 &
WRANGLER_PID=$!

# 等待 wrangler 启动
echo "   等待 Worker 启动..."
sleep 4

# 启动静态文件服务器
echo ""
echo "🌐 启动静态文件服务器 (端口 3000)..."
node server.mjs &
SERVER_PID=$!

echo ""
echo "=========================================="
echo "  ✅ 启动完成!"
echo ""
echo "   前端: http://localhost:3000"
echo "   API:  http://localhost:8787"
echo ""
echo "   按 Ctrl+C 停止所有服务"
echo "=========================================="

# 等待信号
wait

# Image Watermark Remover

> AI 去除图片水印工具 - 极简、免费、快速

**在线体验**: https://image-watermark-remover.pages.dev

## 核心功能

- 🎯 **智能去水印** - 涂抹区域，AI 自动识别并去除
- ⚡ **极速处理** - 3-10 秒完成
- 💾 **不存储** - 图片直传内存，用完即走
- 🆓 **完全免费** - 无需注册，即用即走

## 技术栈

| 层级 | 技术 |
|-----|-----|
| 前端 | Vanilla JS + Fabric.js |
| 后端 | Cloudflare Worker |
| AI API | SiliconFlow (LaMa Cleaner) |

## 快速开发

```bash
# 安装 wrangler
npm install -g wrangler

# 本地开发
wrangler dev

# 部署
wrangler deploy
```

## MVP 需求文档

详见 [MVP-REQ.md](./MVP-REQ.md)

## License

MIT

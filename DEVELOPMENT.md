# 🚧 开发进度记录

> 最后更新：2026-03-26

## 当前状态

| 项目 | 状态 | 说明 |
|-----|------|-----|
| GitHub 仓库 | ✅ 已创建 | https://github.com/zjfcyefeng-arch/image-watermark-remover |
| 前端页面 | ✅ 已完成 | `/public/index.html` |
| Worker 后端 | ✅ 已修复 | `/src/worker.js` 已更新为 Minimax/Image-01 + /v1/images/edits |
| API Key | ✅ 已获取 | 硅基流动 API Key 已保存（需安全存储） |

---

## 📁 项目文件结构

```
image-watermark-remover/
├── MVP-REQ.md          ← MVP 需求文档
├── README.md           ← 项目说明
├── wrangler.toml       ← Cloudflare 部署配置
├── src/
│   └── worker.js       ← Cloudflare Worker 后端
└── public/
    └── index.html      ← 前端页面（Fabric.js）
```

---

## 🔧 已修复问题 (2026-03-26)

### ❌ 旧版问题
- 模型用错：`Qwen/Qwen2.5-VL-72B-Instruct` 是视觉理解模型，不适合 inpainting
- API 端点用错：用了 `/v1/chat/completions` 而非图片编辑端点
- 没有传 mask：无法指定要去除水印的区域

### ✅ 新版修复
- **模型**: `Minimax/Image-01`
- **API 端点**: `POST /v1/images/edits`
- **请求格式**: `multipart/form-data` (image + mask + prompt)
- **功能**: 传入原图和 Mask 图，让模型去掉 Mask 区域的内容（正是去水印！）

---

## 🔧 待完成任务

### 高优先级
- [ ] 获取 Cloudflare API Token（部署必需品）
- [ ] 部署 Worker 到 Cloudflare：`wrangler deploy`
- [ ] 配置 `SILICONFLOW_API_KEY` 密钥
- [ ] 完整流程测试：上传 → 标注 → 处理 → 下载

### 中优先级
- [ ] 确认 Minimax/Image-01 的 /v1/images/edits 实际响应格式
- [ ] 添加错误处理和 Loading 状态
- [ ] 若 API 为异步模式（返回 task_id），需前端轮询逻辑

### 低优先级
- [ ] 添加对比滑块效果
- [ ] 支持更多图片格式
- [ ] 添加使用说明

---

## 🔑 安全注意事项

**⚠️ 绝对不要把以下内容提交到 GitHub：**
- `SILICONFLOW_API_KEY`
- Cloudflare API Token
- 任何敏感密钥

**正确做法：**
```bash
# 通过 wrangler secret 注入
wrangler secret put SILICONFLOW_API_KEY
```

---

## 🛠 继续开发命令

```bash
# 1. 克隆仓库（如果还没克隆）
git clone https://github.com/zjfcyefeng-arch/image-watermark-remover.git
cd image-watermark-remover

# 2. 安装依赖
npm install -g wrangler

# 3. 登录 Cloudflare
wrangler login

# 4. 部署 Worker
wrangler deploy

# 5. 配置 API Key
wrangler secret put SILICONFLOW_API_KEY
# 输入你的 SiliconFlow API Key

# 6. 本地开发
wrangler dev
```

---

## 📝 SiliconFlow + MiniMax API 信息

| 项目 | 内容 |
|-----|------|
| API 地址 | https://api.siliconflow.cn |
| 端点 | POST /v1/images/edits |
| 模型 | Minimax/Image-01 |
| 请求格式 | multipart/form-data (image, mask, prompt) |
| 免费额度 | 需确认（SiliconFlow 平台） |
| 文档 | https://platform.minimaxi.com/docs/guides/image-generation |

---

## 🔗 相关链接

- GitHub 仓库：https://github.com/zjfcyefeng-arch/image-watermark-remover
- 硅基流动：https://siliconflow.cn
- MiniMax 开放平台：https://platform.minimaxi.com/
- Cloudflare Workers：https://developers.cloudflare.com/workers/
- Fabric.js 文档：https://fabricjs.com/

---

*此文件用于记录开发进度，方便下次继续*

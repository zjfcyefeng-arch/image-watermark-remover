/**
 * Image Watermark Remover - Cloudflare Worker
 * 
 * 接收图片和mask，调用 SiliconFlow API 进行去水印处理
 */

// SiliconFlow API 配置
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const API_KEY = ''; // 从环境变量读取

export default {
  async fetch(request, env, ctx) {
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();
      const image = formData.get('image');
      const mask = formData.get('mask');

      if (!image || !mask) {
        return jsonResponse({ success: false, error: 'MISSING_IMAGE_OR_MASK' }, 400);
      }

      // 转换图片为 base64
      const imageBuffer = await image.arrayBuffer();
      const imageBase64 = arrayBufferToBase64(imageBuffer);
      const imageDataUrl = `data:${image.type};base64,${imageBase64}`;

      // 转换 mask 为 base64
      const maskBuffer = await mask.arrayBuffer();
      const maskBase64 = arrayBufferToBase64(maskBuffer);
      const maskDataUrl = `data:${mask.type};base64,${maskBase64}`;

      // 调用 SiliconFlow API
      const apiKey = env.SILICONFLOW_API_KEY || API_KEY;
      if (!apiKey) {
        return jsonResponse({ success: false, error: 'API_KEY_NOT_SET' }, 500);
      }

      const startTime = Date.now();
      
      const response = await fetch(SILICONFLOW_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-VL-72B-Instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '你是一个图像修复专家。请去除图片中的水印，只返回处理后的图片。'
                },
                {
                  type: 'image_url',
                  image_url: { url: imageDataUrl }
                }
              ]
            }
          ],
          stream: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SiliconFlow API error:', errorText);
        return jsonResponse({ 
          success: false, 
          error: 'API_ERROR',
          message: errorText 
        }, response.status);
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      // 解析返回的图片
      let resultImage = null;
      if (result.choices && result.choices[0] && result.choices[0].message) {
        const content = result.choices[0].message.content;
        // 尝试提取 base64 图片
        const base64Match = content.match(/data:image\/\w+;base64,[A-Za-z0-9+/=]+/);
        if (base64Match) {
          resultImage = base64Match[0];
        }
      }

      if (!resultImage) {
        return jsonResponse({ 
          success: false, 
          error: 'NO_IMAGE_IN_RESPONSE' 
        }, 500);
      }

      return jsonResponse({
        success: true,
        result_url: resultImage,
        processing_time_ms: processingTime
      });

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ 
        success: false, 
        error: 'INTERNAL_ERROR',
        message: error.message 
      }, 500);
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

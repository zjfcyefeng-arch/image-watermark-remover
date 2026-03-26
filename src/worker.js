/**
 * Image Watermark Remover - Cloudflare Worker
 * 
 * 接收图片和mask，调用 SiliconFlow API 进行去水印处理
 * API: POST /v1/images/edits (MiniMax Image-01 模型)
 */

// SiliconFlow Images Edits API
const SILICONFLOW_IMAGES_EDITS_URL = 'https://api.siliconflow.cn/v1/images/edits';

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
      const prompt = formData.get('prompt') || '去除图片中的水印或不需要的内容，保持图片自然';

      if (!image || !mask) {
        return jsonResponse({ success: false, error: 'MISSING_IMAGE_OR_MASK' }, 400);
      }

      // 获取 API Key
      const apiKey = env.SILICONFLOW_API_KEY;
      if (!apiKey) {
        return jsonResponse({ success: false, error: 'API_KEY_NOT_SET' }, 500);
      }

      const startTime = Date.now();

      // 构建 multipart/form-data 请求
      const apiFormData = new FormData();
      apiFormData.append('model', 'Minimax/Image-01');
      apiFormData.append('image', image, 'image.png');
      apiFormData.append('mask', mask, 'mask.png');
      apiFormData.append('prompt', prompt);

      const response = await fetch(SILICONFLOW_IMAGES_EDITS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: apiFormData,
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

      // 解析返回结果
      // MiniMax/SiliconFlow 图片编辑API返回格式: { task_id, status, ... }
      // 异步模式需要轮询，这里尝试解析同步返回或异步任务
      let resultImage = null;

      if (result.data && result.data[0] && result.data[0].url) {
        // 同步返回图片URL
        resultImage = result.data[0].url;
      } else if (result.data && result.data[0] && result.data[0].b64_json) {
        // base64 格式
        resultImage = `data:image/png;base64,${result.data[0].b64_json}`;
      } else if (result.task_id) {
        // 异步任务，返回task_id供前端轮询
        return jsonResponse({
          success: true,
          task_id: result.task_id,
          async_mode: true,
          processing_time_ms: processingTime
        });
      }

      if (!resultImage) {
        console.error('Unexpected API response:', JSON.stringify(result));
        return jsonResponse({ 
          success: false, 
          error: 'NO_IMAGE_IN_RESPONSE',
          debug: result 
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



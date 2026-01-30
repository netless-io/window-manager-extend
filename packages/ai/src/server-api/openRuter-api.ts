import { Request } from '../types';
export async function getOpenRouterAllModels() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`获取模型列表失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || !data.data) {
      throw new Error('响应数据格式错误');
    }

    data.total = data.data.length;
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    if (error instanceof Error && error.message.includes('ERR_CONNECTION_CLOSED')) {
      throw new Error('连接已关闭，请检查网络连接或稍后重试');
    }
    throw error;
  }
}
export async function getOpenRouterFreeModels() {
  const allModels = await getOpenRouterAllModels();
  const freeModels = allModels.data.filter((model: any) => model.id.indexOf(':free') !== -1);
  return {
    data: freeModels,
    total: freeModels.length,
  };
}
export async function getOpenRouterModelsByQuery(query: {
    input_modalities?: 'image' | 'text';
    output_modalities?: 'text' | 'image';
    q?:string;
    isFree?: boolean;  
}) {
  const allModels = await getOpenRouterAllModels();
  const filteredModels = allModels.data.filter((model: any) => {
    let isResult = true;
    if(query.isFree) {
      isResult = isResult && model.id.indexOf(':free') !== -1;
    }
    if (query.input_modalities) {
      isResult = isResult && model.architecture.input_modalities.includes(query.input_modalities);
    }
    if (query.output_modalities) {
      isResult = isResult && model.architecture.output_modalities.includes(query.output_modalities);
    }
    if (query.q) {
      isResult = isResult && (model.id.includes(query.q) || model.name.includes(query.q) || model.description.includes(query.q));
    }
    return isResult;
  });
  return {
    data: filteredModels,
    total: filteredModels.length,
  };
}
export type ChatRequest = Required<Pick<Request, 'messages' | 'model'>>
export async function chat(params: ChatRequest, apiKey: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...params,
    }),
    mode: 'cors',
  });
  const result = await response.json();
  return result;
}
export async function chatStream(params: ChatRequest, apiKey: string, onMessage: (message: string) => void, controller?: AbortController) {
  controller?.abort();
  let response: Response | null = null;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        stream: true,
      }),
      mode: 'cors',
      signal: controller?.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Stream cancelled');
    } else {
      throw error;
    }
  }
  if (!response) {
    return;
  }
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Append new chunk to buffer
      buffer += decoder.decode(value, { stream: true });
      // Process complete lines from buffer
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const lineEnd = buffer.indexOf('\n');
        if (lineEnd === -1) break;
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0].delta.content;
            if (content) {
              onMessage(content);
            }
          } catch (e) {
            // Ignore invalid JSON
          }
        }
      }
    }
  } finally {
    reader.cancel();
  }
}
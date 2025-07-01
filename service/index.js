/* eslint-disable @typescript-eslint/no-var-requires */
const OSS = require('ali-oss');
const fetch = require('node-fetch');
const { OSS_CONFIG, UPLOAD_CONFIG, CONVERSION_CONFIG } = require('./config.js');

// 创建 OSS 客户端
console.log('🔧 正在创建 OSS 客户端...');
const client = new OSS(OSS_CONFIG);
console.log('✅ OSS 客户端创建成功');

// 获取文件扩展名
function getFileExtension(filename, mimeType) {
  if (filename.includes('.')) {
    return filename.split('.').pop().toLowerCase();
  }
  
  // 根据MIME类型推断扩展名
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
  };
  
  return mimeMap[mimeType.toLowerCase()] || 'bin';
}
// 生成OSS签名
function generateOSSSignature(requestData) {
  console.log('🔧 生成OSS签名...', requestData, requestData.filename, requestData.type);
  
  // 生成唯一的文件名
  const fileExt = getFileExtension(requestData.filename, requestData.type);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const filename = `${timestamp}_${random}.${fileExt}`;
  
  // 使用OSS客户端生成签名URL（允许PUT方法）
  const url = client.signatureUrl(filename, {
    method: 'PUT',
    expires: 3600, // 签名过期时间，单位秒
    'Content-Type': requestData.type,
    secure: true, // 强制使用 HTTPS
  });
  
  
  const result = {
    accessKeyId: OSS_CONFIG.accessKeyId,
    policy: '', // 使用签名URL时不需要policy
    signature: '', // 使用签名URL时不需要单独的signature
    dir: UPLOAD_CONFIG.UPLOAD_PATH,
    host: `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.region}.aliyuncs.com`,
    expire: Date.now() + 3600 * 1000, // 1小时后过期
    signedUrl: url, // 签名后的URL
    filename: filename, // 生成的文件名
  };
  
  console.log('✅ OSS签名生成成功');
  console.log('📋 签名URL:', url);
  return result;
}

// 文件转换函数（调用第三方API）
async function convertFile(requestData) {
  
  if (!requestData.fileUrl || !requestData.region) {
    throw new Error('缺失参数: fileUrl 或 region');
  }
  
  console.log(`🔄 开始转换文件 api: ${CONVERSION_CONFIG.CONVERSION_API_URL}, sdk Token: ${CONVERSION_CONFIG.CONVERSION_SDK_TOKEN}, region: ${requestData.region}, fileUrl: ${requestData.fileUrl}, convertType: ${requestData.convertType}`);

  try {
    // 这里调用第三方文件转换API
    // 示例：调用在线转换服务
    const response = await fetch(CONVERSION_CONFIG.CONVERSION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'region': requestData.region,
        'token': CONVERSION_CONFIG.CONVERSION_SDK_TOKEN,
      },
      body: JSON.stringify({
        resource: requestData.fileUrl,
        type: requestData.convertType,
        preview: true,
        imageCompressionLevel: 2,
        outputFormat: requestData.outputFormat,
      }),
    });

    if (!response.ok) {
      throw new Error(`文件转换失败: ${response.status}, ${result.message}`);
    }
    
    const result = await response.json();

    if (result.status === 'Fail') {
      throw new Error(`转换API返回错误: ${result.status}`);
    }

    console.log('✅ 发起文件转换成功');
    return result;
  } catch (error) {
    console.error('❌ 文件转换失败:', error);
    throw error;
  }
}

// 获取task token
async function generateTaskToken(uuid, region) {
  console.log(`🔄 开始生成tasktoken, uuid: ${uuid}, region: ${region}, URL: ${CONVERSION_CONFIG.CONVERSION_TASK_API_URL}/${uuid}`);
  if (!uuid) {
    throw new Error('缺失参数: uuid');
  }
  
  try {
    // 这里调用第三方文件转换API
    // 示例：调用在线转换服务
    const response = await fetch(`${CONVERSION_CONFIG.CONVERSION_TASK_API_URL}/${uuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'region': region,
        'token': CONVERSION_CONFIG.CONVERSION_SDK_TOKEN,
      },
      body: JSON.stringify({
        role: 'writer',
        lifespan: 0,
      }),
    });
    
    if (!response.ok) {
      console.log(JSON.stringify(response));
      throw new Error(`生成task token 失败: ${response.status}`);
    }
    
    const result = await response.json();

    console.log('✅ 生成tasktoken成功');
    return result;
  } catch (error) {
    console.error('❌ 文件转换失败:', error);
    throw error;
  }
}

function respSuccess(resp, data) {
  resp.send(JSON.stringify({
    'code': '0', 'message': 'success', 'data': data,
  }));
}

function respError(resp, code, message) {
  resp.setStatusCode(400);
  resp.send(JSON.stringify({
    'code': code, 'message': message,
  }));
}

async function handleOss(data, resp) {
  const signature = generateOSSSignature(data);
  respSuccess(resp, signature);
  return;
}

async function handleConvert(data, resp) {
  // 文件转换逻辑
  const result = await convertFile(data);
  const taskToken = await generateTaskToken(result.uuid, data.region);
  result.taskToken = taskToken;
  respSuccess(resp, result);
  return;
}

exports.handler = async (req, resp) => {
  try {
    if (req.method === 'POST') {
      const dataStr = req.body.toString('utf8');
      const data = JSON.parse(dataStr);
      if (data.action === 'getOSSSignature') {
        await handleOss(data, resp);
        return;
      }
      if (data.action === 'convert') {
        await handleConvert(data, resp);
        return;
      }
      throw { code: 103, message: 'Unknown action', data: [data] };
    } else {
      throw { code: 103, message: 'Unknown method', data: [req.method] };
    }
  } catch (e) {
    console.error('❌ 错误:', e);
    respError(resp, e.code || 103, e.message || 'Unknown error');
  }
};

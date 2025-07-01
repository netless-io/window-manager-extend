// OSS 配置
const OSS_CONFIG = {
  region: process.env.OSS_REGION,
  accessKeyId: process.env.ALI_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALI_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  secure: true, // 强制使用 HTTPS
};

// 文件上传配置
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 默认10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES 
    ? process.env.ALLOWED_FILE_TYPES.split(',') 
    : ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads/',
  ENABLE_CDN: process.env.ENABLE_CDN === 'true',
  CDN_DOMAIN: process.env.CDN_DOMAIN,
};

// 文件转换服务配置
const CONVERSION_CONFIG = {
  CONVERSION_SDK_TOKEN: process.env.CONVERSION_SDK_TOKEN,
  CONVERSION_API_URL: 'https://api.netless.link/v5/projector/tasks',
  CONVERSION_TASK_API_URL: 'https://api.netless.link/v5/tokens/tasks',
};

module.exports = { OSS_CONFIG, UPLOAD_CONFIG, CONVERSION_CONFIG }; 
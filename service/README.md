# 文件上传服务

基于阿里云函数计算的文件上传和转换服务，支持直接上传到OSS和文件格式转换。

## 功能特性

- ✅ 文件类型区分（图片、PPT、PDF等）
- ✅ 获取OSS签名用于前端直接上传
- ✅ 直接上传文件到阿里云OSS
- ✅ 图片文件格式转换
- ✅ CORS支持
- ✅ 完整的错误处理和日志记录

## 项目结构

```
service/
├── index.js          # 主函数入口
├── config.js         # 配置文件
├── package.json      # 依赖配置
├── deploy.sh         # 部署脚本
├── test.js           # 测试文件
└── README.md         # 说明文档
```

## 环境变量配置

在阿里云函数计算中配置以下环境变量：

```bash
# OSS配置
ALI_ACCESS_KEY_ID=your_access_key_id
ALI_ACCESS_KEY_SECRET=your_access_key_secret
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=your_bucket_name
OSS_ENDPOINT=your_custom_endpoint  # 可选

# 上传配置
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# CDN配置（可选）
ENABLE_CDN=true
CDN_DOMAIN=your_cdn_domain

# 文件转换配置（可选）
CONVERSION_API_URL=https://api.example.com/convert
CONVERSION_API_KEY=your_api_key
```

## API接口

### 1. 获取OSS签名 (GET)

**请求：**
```http
GET https://white-be-backup-kcvjblzard.cn-hangzhou.fcapp.run
```

**响应：**
```json
{
  "success": true,
  "accessKeyId": "your_access_key_id",
  "policy": "base64_encoded_policy",
  "signature": "base64_encoded_signature",
  "dir": "uploads/",
  "host": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com",
  "expire": 1640995200000
}
```

### 2. 文件转换 (POST)

**请求：**
```http
POST https://white-be-backup-kcvjblzard.cn-hangzhou.fcapp.run
Content-Type: application/json

{
  "action": "convert",
  "fileUrl": "https://example.com/image.jpg"
}
```

**响应：**
```json
{
  "success": true,
  "convertedUrl": "https://example.com/converted-image.webp",
  "originalUrl": "https://example.com/image.jpg"
}
```

### 3. CORS预检 (OPTIONS)

**请求：**
```http
OPTIONS https://white-be-backup-kcvjblzard.cn-hangzhou.fcapp.run
```

**响应：**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## 前端使用示例

```typescript
import { uploadFile } from './server-api/uploadfile';

// 上传文件
const file = document.getElementById('fileInput').files[0];
const result = await uploadFile(file);

if (result.success) {
  console.log('原始文件URL:', result.url);
  if (result.convertedUrl) {
    console.log('转换后文件URL:', result.convertedUrl);
  }
} else {
  console.error('上传失败:', result.error);
}
```

## 部署步骤

1. **安装依赖：**
   ```bash
   npm install
   ```

2. **配置环境变量：**
   在阿里云函数计算控制台配置必要的环境变量。

3. **部署到阿里云函数计算：**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **测试部署：**
   ```bash
   npm test
   ```

## 本地开发

1. **安装依赖：**
   ```bash
   npm install
   ```

2. **运行测试：**
   ```bash
   npm test
   ```

3. **查看日志：**
   测试时会输出详细的调试信息。

## 注意事项

1. **安全性：** 确保OSS访问密钥的安全性，建议使用RAM用户的最小权限原则。

2. **文件大小：** 默认最大文件大小为10MB，可根据需要调整。

3. **文件类型：** 支持的文件类型可在配置中自定义。

4. **转换服务：** 文件转换功能需要配置第三方API，可根据实际需求选择服务提供商。

5. **CDN：** 如使用CDN，需要确保CDN域名已正确配置。

## 故障排除

### 常见问题

1. **OSS上传失败：**
   - 检查OSS配置是否正确
   - 确认Bucket权限设置
   - 验证AccessKey权限

2. **文件转换失败：**
   - 检查转换API配置
   - 确认API密钥有效性
   - 查看转换服务日志

3. **CORS错误：**
   - 确认函数已正确配置CORS头
   - 检查前端请求头设置

### 日志查看

在阿里云函数计算控制台可以查看详细的执行日志，包括：
- 请求处理过程
- 错误信息
- 性能统计
- 调试输出

## 更新日志

- **v1.0.0** - 初始版本，支持基本的上传和转换功能 
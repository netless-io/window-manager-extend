import { Region } from "../region";

// 文件类型定义
export interface FileType {
  type: 'image' | 'document' | 'media' | 'other';
  category: 'image' | 'ppt' | 'pptx' | 'pdf' | 'docx' | 'doc' | 'other' | 'mp4' | 'mp3' | 'avi' | 'mov';
  extension: string;
}

// OSS签名响应类型
export interface OSSSignature {
  accessKeyId: string;
  policy: string;
  signature: string;
  dir: string;
  host: string;
  expire: number;
  signedUrl: string; // 签名后的URL
  filename: string; // 生成的文件名
}

export type ImagesDefinition = {
  [key: string]: {
    url: string;
    width: number;
    height: number;
  }
}

// 文件上传响应类型
export interface UploadResponse {
  success: boolean;
  kind: 'Image' | 'MediaPlayer' | 'Slide' | 'PDFjs' | 'Presentation' | 'DocsViewer' | 'Custom' | 'Error';
  url?: string;
  taskId?: string;
  convertedUrl?: string;
  error?: string;
  taskToken?: any;
  images?: ImagesDefinition;
}

// 文件类型判断函数
export const getFileType = (file: File): FileType => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // media 类型
  const mediaExtensions = ['mp4', 'mp3', 'avi', 'mov'];
  if (mediaExtensions.includes(extension)) {
    return {
      type: 'media',
      category: extension as 'mp4' | 'mp3' | 'avi' | 'mov',
      extension
    };
  }
  
  // 图片类型
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (imageExtensions.includes(extension)) {
    return {
      type: 'image',
      category: 'image',
      extension
    };
  }
  
  // PPT类型
  const pptExtensions = ['ppt', 'pptx', 'pdf', 'docx', 'doc'];
  if (pptExtensions.includes(extension)) {
    return {
      type: 'document',
      category: extension as 'ppt' | 'pptx' | 'pdf' | 'docx' | 'doc',
      extension
    };
  }

  // 其他类型
  return {
    type: 'other',
    category: 'other',
    extension
  };
};

// 获取OSS签名
export const getOSSSignature = async (file: File): Promise<OSSSignature> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
  
  try {
    // 使用代理URL，避免跨域问题
    const response = await fetch('https://getosssignature-white-be-backup-dhyeefqsaw.cn-hangzhou.fcapp.run', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, type: file.type, action: 'getOSSSignature' }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`获取OSS签名失败: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('🔑 获取OSS签名成功', result);
    
    // 检查响应格式
    if (result.code === '0' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || '响应格式错误');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw error;
  }
};

// 直接上传文件到OSS
export const uploadToOSS = async (file: File, signature: OSSSignature): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

  try {
    const response = await fetch(signature.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file,
      signal: controller.signal,
    });
    console.log('🔑 上传到OSS 响应', response);

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`上传到OSS失败: ${response.status}`);
    }

    // 返回文件URL
    return `${signature.host}/${signature.filename}`;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('上传超时，请检查网络连接');
    }
    throw error;
  }
};

export const getConvertType = (fileType: FileType)=>{
  if(fileType.category === 'pptx'){
    return 'dynamic';
  }
  return 'static';
}

// 发起文件转换
export const startConvertFile = async (fileType: FileType, fileUrl: string, region: Region, outputFormat: 'png' | 'jpg' | 'jpeg' | 'qpdf'): Promise<{
  uuid: string;
  type: 'dynamic' | 'static';
  status: 'Waiting' | 'Converting' | 'Finished' | 'Fail';
  taskToken: any;
}> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
  
  try {
    // 使用代理URL，避免跨域问题
    const response = await fetch('https://getosssignature-white-be-backup-dhyeefqsaw.cn-hangzhou.fcapp.run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        fileUrl: fileUrl,
        action: 'convert',
        convertType: getConvertType(fileType),
        region,
        outputFormat,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`文件转换失败: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 检查响应格式
    if (result.code === '0' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || '转换响应格式错误');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('转换请求超时，请检查网络连接');
    }
    throw error;
  }
};

export type QueryConvertFileResult = {
  uuid: string;
  status: 'Waiting' | 'Converting' | 'Finished' | 'Fail';
  type: 'dynamic' | 'static';
  prefix: string;
  images?: any;
}

// 查询文件转换状态
export const queryConvertFile = async (uuid: string, region: Region, taskToken: string): Promise<QueryConvertFileResult> => {
  console.log(`🔄 查询文件转换状态===>start`);
  try {
    const response = await fetch(`https://api.netless.link/v5/projector/tasks/${uuid}`, {
      method: 'GET',
      headers: {
        'token': taskToken,
        'region': region,
      },
    });

    if (!response.ok) {
      throw new Error(`查询文件转换状态失败: ${response.status}`);
    }

    const result = await response.json();
    console.log(`🔄 查询文件转换状态===>end`, result);
    return result;
  } catch (error) { 
    console.log(`🔄 查询文件转换状态===>error`, error);
    return {
      uuid,
      status: 'Fail',
      type: 'static',
      prefix: '',
      images: [],
    };
  }
}

export const queryConvertFileLoop = async (uuid: string, region: Region, taskToken: string, resolve: (_result: QueryConvertFileResult) => void): Promise<void> => {
  setTimeout(() => {
    queryConvertFile(uuid, region, taskToken).then((result)=>{
      if (result.status === 'Finished' || result.status === 'Fail') {
        resolve(result);
      } else {
        queryConvertFileLoop(uuid, region, taskToken, resolve);
      }
    });
  }, 2000);
}


// 主上传函数
export const uploadImage = async (image: File) => {
  try {
    // 1. 获取OSS签名
    console.log('🔑 获取OSS签名...');
    const signature = await getOSSSignature(image);
    console.log('✅ OSS签名获取成功');
  
    // 2. 直接上传文件到OSS
    console.log('📤 上传文件到OSS...');
    const fileUrl = await uploadToOSS(image, signature);
    console.log(`✅ 文件上传成功: ${fileUrl}`);

    return fileUrl;
  } catch (error) {
    console.error('❌ 上传文件失败:', error);
    throw error;
  }
};
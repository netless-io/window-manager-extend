import React, { useContext, useMemo, useState } from 'react';
import { AiChatRecordItem, PanelContext } from './panel';
import { AIPanelController } from '../controller';
import { Select, Flex, Button, Input } from 'antd';
import { isArray } from 'lodash';
import { DeleteOutlined, SyncOutlined, UpOutlined, DownOutlined, ImportOutlined } from '@ant-design/icons';
import { Message, TextContent } from '../types';
import { markdown } from 'markdown';

/**
 * 判断文本是否是 Markdown 格式
 * @param text 要检查的文本
 * @returns 如果是 Markdown 格式返回 true，否则返回 false
 */
function isMarkdown(text: string | undefined | null): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Markdown 常见特征模式
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m,                    // 标题 (# ## ###)
    /^\s*[-*+]\s+.+$/m,                  // 无序列表 (- * +)
    /^\s*\d+\.\s+.+$/m,                  // 有序列表 (1. 2. 3.)
    /```[\s\S]*?```/,                    // 代码块 (```)
    /`[^`]+`/,                           // 行内代码 (`)
    /\[([^\]]+)\]\(([^)]+)\)/,           // 链接 ([text](url))
    /\*\*[^*]+\*\*/,                     // 粗体 (**text**)
    /\*[^*]+\*/,                         // 斜体 (*text*)
    /^>\s+.+$/m,                         // 引用 (>)
    /^\|.+\|$/m,                         // 表格 (|)
    /^[-*_]{3,}$/m,                      // 分隔线 (--- ***)
    /!\[([^\]]*)\]\(([^)]+)\)/,          // 图片 (![alt](url))
  ];

  // 检查是否包含至少一个 Markdown 特征
  return markdownPatterns.some(pattern => pattern.test(text));
}

function ChatStreamText({ text, controller }: { text: string, controller: AIPanelController}) {
  const { i18n } = useContext(PanelContext);
  return (
    <div className={controller.c('chat-app-record-item-reasoning-simple')}>
      <span className={controller.c('chat-app-record-item-reasoning-label')}>{i18n['reasoning']}：</span>
      <p className={controller.c('chat-app-record-item-reasoning-text')}>{text}</p>
      <span className="cursor">|</span>
    </div>
  );
}

/**
 * ChatOutput 组件：将 markdown 格式的文本转换为 HTML 并渲染
 */
function ChatOutput({ text, controller }: { text: string, controller: AIPanelController }) {
  // 将 markdown 转换为 HTML
  const htmlContent = useMemo(() => {
    try {
      return markdown.toHTML(text);
    } catch (error) {
      console.error('[ChatOutput] Markdown 转换失败:', error);
      // 如果转换失败，返回转义的文本
      return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [text]);

  return (
    <div 
      className={controller.c('chat-app-record-item-output-text')}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

function CollapsibleReasoningText({ text, controller }: { text: string, controller: AIPanelController }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { i18n } = useContext(PanelContext);
  const maxPreviewLength = 50; // 预览文本的最大长度
  
  // 如果文本较短，不需要折叠，直接显示
  if (!text || text.length <= maxPreviewLength) {
    return (
      <div className={controller.c('chat-app-record-item-reasoning-simple')}>
        <span className={controller.c('chat-app-record-item-reasoning-label')}>{i18n['reasoning']}：</span>
        <p className={controller.c('chat-app-record-item-reasoning-text')}>{text}</p>
      </div>
    );
  }
  
  const previewText = text.slice(0, maxPreviewLength);
  
  return (
    <div className={controller.c('chat-app-record-item-reasoning-container')}>
      <div 
        className={controller.c('chat-app-record-item-reasoning-header')} 
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <span className={controller.c('chat-app-record-item-reasoning-label')}>{i18n['reasoning']}</span>
        <span className={controller.c('chat-app-record-item-reasoning-toggle')}>
          {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </span>
      </div>
      <div className={controller.c('chat-app-record-item-reasoning-content')}>
        {isExpanded ? (
          <p className={controller.c('chat-app-record-item-reasoning-text')}>{text}</p>
        ) : (
          <p className={controller.c('chat-app-record-item-reasoning-text')}>
            {previewText}
            <span className={controller.c('chat-app-record-item-reasoning-ellipsis')}>...</span>
            <span className={controller.c('chat-app-record-item-reasoning-hint')}>{i18n['more']}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function ChatRecordItem({ item, controller, onReChat, onDelete, onMarkmap }: { item: AiChatRecordItem, controller: AIPanelController, onReChat: () => void, onDelete: () => void, onMarkmap: () => void }) {

  return <div className={controller.c(`chat-app-record-item-${item.role}`)}>
    {isArray(item.content) && item.content.map((c, index)=> {
      if (c.type === 'image_url') {
        // 支持两种格式：imageUrl (驼峰) 和 image_url (下划线)
        const imageUrl = (c as any).imageUrl?.url || (c as any).image_url?.url;
        if (imageUrl) {
          return <img className={controller.c('chat-app-record-item-image')} key={`image-${index}`} src={imageUrl} />;
        }
        return null;
      }
      if (c.type === 'reasoning_text') {
        return <CollapsibleReasoningText key={`reasoning-${index}`} text={c.text} controller={controller} />;
      }
      if (c.type === 'output_text') {
        return <ChatOutput key={`output-${index}`} text={c.text} controller={controller} />;
      }
      return <p className={controller.c('chat-app-record-item-text')} key={`text-${index}`}>{c.text}</p>;
    })}
    {
      item.role === 'user' && <div className={controller.c('chat-app-record-item-user-actions')}>
        <SyncOutlined onClick={() => {
          onReChat();
        }}/>
        <DeleteOutlined onClick={() => {
          onDelete();
        }}/>
      </div>
    }
    {
      item.role !== 'user' && <div className={controller.c('chat-app-record-item-assistant-actions')}>
        <ImportOutlined onClick={() => {
          onMarkmap();
        }}/>
        {/* <CopyOutlined onClick={() => {
          onCopy();
        }}/> */}
        <DeleteOutlined onClick={() => {
          onDelete();
        }}/>
      </div>
    }
  </div>;
}

export const ChatApp = (props: {
    activeAiChatId: string
    setActiveMode: (mode: string) => void
    controller: AIPanelController
    record: AiChatRecordItem[] | ''
}) => {
  const { activeAiChatId, record, controller, setActiveMode } = props;
  const { isCliping, isAutoCliping,  openrouter, activeMode, i18n } = useContext(PanelContext);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputText, setInputText] = useState('');
  const [streamText, setStreamText] = useState('');
  
  // 转换函数：将内部格式转换为 OpenRouter API 格式
  const convertContentForOpenRouter = (item: any): any => {
    if (!item || typeof item !== 'object') {
      return null;
    }
    
    // 文本内容
    if (item.type === 'text' && item.text) {
      return { type: 'text', text: item.text };
    }
    
    // 图片内容：支持两种格式，统一转换为 OpenRouter SDK 期望的格式
    if (item.type === 'image_url') {
      // 支持内部格式 imageUrl (驼峰) 或 image_url (下划线)
      const url = item.imageUrl?.url || item.image_url?.url;
      if (url) {
        // OpenRouter SDK 期望使用 imageUrl (驼峰命名)
        const converted = {
          type: 'image_url',
          imageUrl: {
            url: url,
          },
        };
        return converted;
      } else {
        console.warn('[Chat] 转换函数: 图片内容缺少 URL', item);
        return null;
      }
    }
    
    // reasoning_text 和 output_text 不应该发送给 API，它们只用于显示
    if (item.type === 'reasoning_text' || item.type === 'output_text') {
      return null;
    }
    console.warn('[Chat] 转换函数: 未知的内容类型', item);
    return null;
  };
  
  // 转换消息历史为 OpenRouter API 格式
  const convertMessageHistoryForOpenRouter = (record: AiChatRecordItem[]): Message[] => {
    const convertedMessages: Message[] = [];
    
    for (const item of record) {
      if (typeof item.content === 'string') {
        // 字符串内容直接使用
        if (item.role === 'user' || item.role === 'assistant' || item.role === 'system') {
          convertedMessages.push({
            role: item.role,
            content: item.content,
          } as Message);
        }
      } else if (isArray(item.content)) {
        if (item.role === 'assistant') {
          // Assistant 消息：提取 output_text 作为 content（字符串格式）
          // reasoning_text 不发送给 API，只用于显示
          const outputTextContent = item.content.find((c: any) => c.type === 'output_text');
          if (outputTextContent && 'text' in outputTextContent && outputTextContent.text) {
            convertedMessages.push({
              role: 'assistant',
              content: outputTextContent.text,
            } as Message);
          }
          // 如果没有 output_text，跳过这条消息（只包含 reasoning_text）
        } else if (item.role === 'user') {
          // User 消息：转换数组内容（支持图片和文本）
          const convertedContent = item.content
            .map(convertContentForOpenRouter)
            .filter((item: any) => item !== null);
          
          // OpenRouter 建议：文本在前，图片在后
          const textItems = convertedContent.filter((item: any) => item.type === 'text');
          const imageItems = convertedContent.filter((item: any) => item.type === 'image_url');
          const sortedContent = [...textItems, ...imageItems];
          
          // 如果转换后没有内容，跳过这条消息
          if (sortedContent.length === 0) {
            continue;
          }
          
          convertedMessages.push({
            role: 'user',
            content: sortedContent,
          } as Message);
        }
      }
    }
    
    return convertedMessages;
  };
  
  const sent = async (_item?: AiChatRecordItem) => {
    // 检查 _item 是否是事件对象，如果是则忽略
    if (_item && (
      _item.constructor?.name === 'SyntheticBaseEvent' ||
      _item.constructor?.name === 'SyntheticEvent' ||
      _item instanceof Event ||
      typeof (_item as any).preventDefault === 'function' ||
      typeof (_item as any).stopPropagation === 'function' ||
      !('role' in _item) || !('content' in _item)
    )) {
      // 这是一个事件对象，不是有效的消息项，将其设为 undefined
      _item = undefined;
    }
    
    if (!openrouter || (!inputText.trim() && !_item?.content?.length)) {
      return;
    }
    setIsStreaming(true);
    setStreamText(''); // 重置流式文本
    // 获取当前记录，如果不存在则创建新数组
    const currentRecord = isArray(record) ? [...record] : [];
    let lastMessage: Message | undefined;
    if(!_item) {
      const prompt = inputText.trim();
      const content = controller.inputUserPrompts.get(activeAiChatId) as any;
      // 构建消息内容（用于保存到数据库）
      let messageContent: any[];
      if (content) {
        currentRecord.pop();
        if (isArray(content) && content.length > 0) {
          messageContent = [...content, { type: 'text', text: prompt }];
        } else {
          messageContent = [{ type: 'text', text: prompt }];
        }
      } else {
        // 如果没有之前的内容，只使用文本
        messageContent = [{ type: 'text', text: prompt }];
      }
      // 用于发送给 OpenRouter 的消息（转换后的格式）
      // 转换并过滤掉 null 值（无效的内容项）
      const convertedContent = messageContent
        .map(convertContentForOpenRouter)
        .filter((item: any) => item !== null);
      
      // OpenRouter 建议：文本在前，图片在后
      // 将内容重新排序：文本内容在前，图片内容在后
      const textItems = convertedContent.filter((item: any) => item.type === 'text');
      const imageItems = convertedContent.filter((item: any) => item.type === 'image_url');
      const sortedContent = [...textItems, ...imageItems];
          
      // 确保至少有一个文本内容
      if (sortedContent.length === 0 || textItems.length === 0) {
        sortedContent.unshift({ type: 'text', text: prompt });
      }
      
      const finalContent = sortedContent.length > 0 ? sortedContent : [{ type: 'text', text: prompt }];
      // 用于保存到数据库的消息（使用原始格式）
      lastMessage = {
        role: 'user',
        content: finalContent,
      };
      controller.inputUserPrompts.delete(activeAiChatId);
      setInputText('');
    } else {
      // 重新发送之前的消息，也需要转换格式
      const originalContent = _item.content;
      
      if (typeof originalContent === 'string') {
        // 如果 content 是字符串，直接使用
        if (!originalContent.trim()) {
          console.warn('[Chat] 消息内容为空，跳过发送');
          setIsStreaming(false);
          return;
        }
        lastMessage = {
          role: _item.role,
          content: originalContent,
        } as Message;
      } else if (isArray(originalContent)) {
        // 如果 content 是数组，转换每个元素
        const convertedContent = originalContent
          .map(convertContentForOpenRouter)
          .filter((item: any) => item !== null);
        
        // OpenRouter 建议：文本在前，图片在后
        // 将内容重新排序：文本内容在前，图片内容在后
        const textItems = convertedContent.filter((item: any) => item.type === 'text');
        const imageItems = convertedContent.filter((item: any) => item.type === 'image_url');
        const sortedContent = [...textItems, ...imageItems];
        
        // 确保数组不为空
        if (sortedContent.length === 0) {
          console.warn('[Chat] 转换后的消息内容为空，跳过发送');
          setIsStreaming(false);
          return;
        }
        lastMessage = {
          role: _item.role,
          content: sortedContent,
        } as Message;
      } else {
        console.warn('[Chat] 消息内容格式无效，跳过发送');
        setIsStreaming(false);
        return;
      }
    }
    currentRecord.push(lastMessage as any);
    await controller.updateDbRecord(activeAiChatId, currentRecord, true);
    
    // 转换完整的消息历史为 OpenRouter API 格式
    const messagesHistory = convertMessageHistoryForOpenRouter(currentRecord);    
    try {
      const response = await openrouter.chat.send({
        model: activeMode,
        messages: messagesHistory as any, // 传入完整的对话历史
        stream: true,
      });
      
      if (!response) {
        console.warn('[Chat] 响应为空，退出');
        setIsStreaming(false);
        return;
      }
      
      // 检查 response 是否可以直接迭代（async iterator）
      if (response && typeof (response as any)[Symbol.asyncIterator] === 'function') {
        let outputText = '';
        let reasoningText = '';
        
        try {
          for await (const chunk of response as any) {            
            // 处理 chunk
            const parsed = chunk as any;
            let delta = parsed.delta || parsed.choices?.[0]?.delta;
            
            if (!delta && parsed.choices?.[0]) {
              delta = parsed.choices[0];
            }
            
            // 检查 choices[0].message 或 choices[0].content（某些模型可能使用这些字段）
            if (!delta && parsed.choices?.[0]?.message) {
              delta = parsed.choices[0].message;
            }
            
            if (delta || parsed.content || parsed.reasoning) {
              const finalDelta = delta || parsed;
              
              
              // 处理 reasoning_details
              if (finalDelta.reasoning_details && Array.isArray(finalDelta.reasoning_details)) {
                for (const detail of finalDelta.reasoning_details) {
                  if (detail.type === 'reasoning.text' && detail.text) {
                    reasoningText += detail.text;
                  }
                }
              } else if (finalDelta.reasoning) {
                reasoningText += finalDelta.reasoning;
              }
              
              // 处理 content（优先检查 content 字段）
              if (finalDelta.content) {
                outputText += finalDelta.content;
              } 
              // 某些模型可能使用 message.content
              else if (finalDelta.message?.content) {
                outputText += finalDelta.message.content;
              }
              // 某些模型可能直接使用 text 字段
              else if (finalDelta.text) {
                outputText += finalDelta.text;
              }
              
              // 更新 UI
              if (finalDelta.reasoning || finalDelta.reasoning_details || finalDelta.content || finalDelta.message?.content || finalDelta.text) {
                setStreamText(reasoningText + outputText);
              }
            }
          }
          
          // 保存到数据库
          const assistantContent: any[] = [];
          if (reasoningText.trim()) {
            assistantContent.push({ type: 'reasoning_text', text: reasoningText });
          }
          if (outputText.trim()) {
            assistantContent.push({ type: 'output_text', text: outputText });
          }
          
          if (assistantContent.length > 0) {
            const assistantMessage = {
              role: 'assistant',
              content: assistantContent,
            };
            currentRecord.push(assistantMessage as any);
            await controller.updateDbRecord(activeAiChatId, currentRecord, true);
          }
          
          setStreamText('');
          setIsStreaming(false);
          return;
        } catch (error) {
          console.error('[Chat] 迭代出错:', error);
          setIsStreaming(false);
          return;
        }
      }
      
      const reader = response.getReader();
      if (!reader) {
        console.error('[Chat] reader 为空');
        throw new Error('Response body is not readable');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let outputText = ''; // 累积完整的输出文本（content字段）
      let reasoningText = ''; // 累积推理文本（reasoning字段）
      let isDone = false; // 标记是否收到 [DONE]
      let chunkCount = 0; // 统计接收到的数据块数量
      
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          
          if (done || isDone) {
            break;
          }
          
          chunkCount++;
          
          // 检查 value 的类型，OpenRouter SDK 可能返回已解析的对象
          if (value) {
            // 如果 value 已经是解析后的对象（OpenRouter SDK 可能已经处理了）
            if (typeof value === 'object' && !(value instanceof Uint8Array) && !(value instanceof ArrayBuffer)) {
              // 尝试直接处理对象
              const parsed = value as any;
              
              // 检查是否是 OpenRouter 的响应格式
              if (parsed.choices || parsed.delta || parsed.content || parsed.reasoning) {
                
                // 处理不同的响应格式
                let delta = parsed.delta || parsed.choices?.[0]?.delta;
                
                if (!delta && parsed.choices?.[0]) {
                  delta = parsed.choices[0];
                }
                
                // 检查 choices[0].message 或 choices[0].content（某些模型可能使用这些字段）
                if (!delta && parsed.choices?.[0]?.message) {
                  delta = parsed.choices[0].message;
                }
                
                if (delta || parsed.content || parsed.reasoning) {
                  const finalDelta = delta || parsed;
                  
                  // 处理 reasoning_details（推理详情）- 优先处理，因为它更详细
                  if (finalDelta.reasoning_details && Array.isArray(finalDelta.reasoning_details)) {
                    for (const detail of finalDelta.reasoning_details) {
                      if (detail.type === 'reasoning.text' && detail.text) {
                        reasoningText += detail.text;
                      }
                    }
                  } else if (finalDelta.reasoning) {
                    // 如果没有 reasoning_details，使用 reasoning 字段
                    reasoningText += finalDelta.reasoning;
                  }
                  
                  // 处理 content 字段（最终输出）- 支持多种格式
                  if (finalDelta.content) {
                    const content = finalDelta.content;
                    outputText += content;
                  } 
                  // 某些模型可能使用 message.content
                  else if (finalDelta.message?.content) {
                    const content = finalDelta.message.content;
                    outputText += content;
                  }
                  // 某些模型可能直接使用 text 字段
                  else if (finalDelta.text) {
                    const content = finalDelta.text;
                    outputText += content;
                  }
                  
                  // 实时更新UI显示（显示推理文本和输出文本）
                  if (finalDelta.reasoning || finalDelta.reasoning_details || finalDelta.content || finalDelta.message?.content || finalDelta.text) {
                    const combinedText = reasoningText + outputText;
                    setStreamText(combinedText);
                  }
                }
                
                // 检查是否是完成信号
                if (parsed.done || parsed.finish_reason === 'stop' || parsed === '[DONE]') {
                  isDone = true;
                }
                
                continue; // 跳过后续的文本解码处理
              }
            }
            
            // 如果不是对象，尝试作为字节流处理
            let uint8Array: Uint8Array;
            if (value instanceof Uint8Array) {
              uint8Array = value;
            } else if (value instanceof ArrayBuffer) {
              uint8Array = new Uint8Array(value);
            } else {
              // 尝试转换为字符串
              const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
              buffer += valueStr;
              
              // 处理缓冲区中的完整行
              // eslint-disable-next-line no-constant-condition
              while (true) {
                const lineEnd = buffer.indexOf('\n');
                if (lineEnd === -1) {
                  break;
                }
                
                const line = buffer.slice(0, lineEnd).trim();
                buffer = buffer.slice(lineEnd + 1);
                
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    isDone = true;
                    break;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    
                    const delta = parsed.choices?.[0]?.delta;
                    
                    if (delta) {
                      // 处理 reasoning_details（推理详情）- 优先处理，因为它更详细
                      if (delta.reasoning_details && Array.isArray(delta.reasoning_details)) {
                        for (const detail of delta.reasoning_details) {
                          if (detail.type === 'reasoning.text' && detail.text) {
                            reasoningText += detail.text;
                          }
                        }
                      } else if (delta.reasoning) {
                        // 如果没有 reasoning_details，使用 reasoning 字段
                        reasoningText += delta.reasoning;
                      }
                      
                      // 处理 content 字段（最终输出）- 支持多种格式
                      if (delta.content) {
                        const content = delta.content;
                        outputText += content;
                      } 
                      // 某些模型可能使用 message.content
                      else if (delta.message?.content) {
                        const content = delta.message.content;
                        outputText += content;
                      }
                      // 某些模型可能直接使用 text 字段
                      else if (delta.text) {
                        const content = delta.text;
                        outputText += content;
                      }
                      
                      // 实时更新UI显示（显示推理文本和输出文本）
                      if (delta.reasoning || delta.reasoning_details || delta.content || delta.message?.content || delta.text) {
                        const combinedText = reasoningText + outputText;
                        setStreamText(combinedText);
                      }
                    } else {
                      console.warn('[Chat] delta 为空或无效');
                    }
                  } catch (e) {
                    // 忽略无效的JSON
                    console.warn('[Chat] 解析 JSON 失败:', e, { data: data.slice(0, 200) });
                  }
                }
              }
              
              continue;
            }
            
            // 追加新块到缓冲区
            const decoded = decoder.decode(uint8Array, { stream: true });
            buffer += decoded;
          } else {
            console.warn(`[Chat] 数据块 #${chunkCount} 的 value 为空`);
          }
          
          // 处理缓冲区中的完整行
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const lineEnd = buffer.indexOf('\n');
            if (lineEnd === -1) {
              break;
            }
            
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                isDone = true;
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                const delta = parsed.choices?.[0]?.delta;
                
                if (delta) {
                  // 处理 reasoning_details（推理详情）- 优先处理，因为它更详细
                  if (delta.reasoning_details && Array.isArray(delta.reasoning_details)) {
                    for (const detail of delta.reasoning_details) {
                      if (detail.type === 'reasoning.text' && detail.text) {
                        reasoningText += detail.text;
                      }
                    }
                  } else if (delta.reasoning) {
                    // 如果没有 reasoning_details，使用 reasoning 字段
                    reasoningText += delta.reasoning;
                  }
                  
                  // 处理 content 字段（最终输出）- 支持多种格式
                  if (delta.content) {
                    const content = delta.content;
                    outputText += content;
                  } 
                  // 某些模型可能使用 message.content
                  else if (delta.message?.content) {
                    const content = delta.message.content;
                    outputText += content;
                  }
                  // 某些模型可能直接使用 text 字段
                  else if (delta.text) {
                    const content = delta.text;
                    outputText += content;
                  }
                      
                  // 实时更新UI显示（显示推理文本和输出文本）
                  if (delta.reasoning || delta.reasoning_details || delta.content || delta.message?.content || delta.text) {
                    const combinedText = reasoningText + outputText;
                    setStreamText(combinedText);
                  }
                } else {
                  console.warn('[Chat] delta 为空或无效');
                }
              } catch (e) {
                // 忽略无效的JSON
                console.warn('[Chat] 解析 JSON 失败:', e, { data: data.slice(0, 200) });
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // 构建助手消息的内容数组
      const assistantContent: any[] = [];
      
      // 如果有推理文本，先添加推理文本
      if (reasoningText.trim()) {
        assistantContent.push({ type: 'reasoning_text', text: reasoningText });
      }
      
      // 如果有输出文本，添加输出文本
      if (outputText.trim()) {
        assistantContent.push({ type: 'output_text', text: outputText });
      }
      
      // 只有当有内容时才保存
      if (assistantContent.length > 0) {
        const assistantMessage = {
          role: 'assistant',
          content: assistantContent,
        };
        // 添加助手回复到记录中
        currentRecord.push(assistantMessage as any);
        await controller.updateDbRecord(activeAiChatId, currentRecord, true);
      } else {
        console.warn('[Chat] 没有内容可保存，跳过数据库保存');
      }
      // 重置流式文本显示
      setStreamText('');
    } catch (error) {
      console.error('[Chat] 流式处理出错:', error);
      console.error('[Chat] 错误详情:', {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      
      // 尝试获取更详细的错误信息
      if (error && typeof error === 'object' && 'cause' in error) {
        console.error('[Chat] 错误原因:', (error as any).cause);
      }
      
      // 检查是否是模型不支持图片输入
      const hasImages = lastMessage?.content && Array.isArray(lastMessage.content) && 
        lastMessage.content.some((item: any) => item.type === 'image_url');
      if (hasImages) {
        console.warn('[Chat] 警告: 消息包含图片，但请求失败。可能的原因：');
        console.warn('1. 模型可能不支持图片输入');
        console.warn('2. 图片 URL 可能无法访问');
        console.warn('3. 请检查模型是否支持多模态输入');
      }
    } finally {
      setIsStreaming(false);
    }
  };
  const deleteRecord = (_item: AiChatRecordItem, index: number) => {
    const currentRecord = isArray(record) ? [...record] : [];
    currentRecord.splice(index, 1);
    controller.inputUserPrompts.delete(activeAiChatId);
    controller.updateDbRecord(activeAiChatId, currentRecord, true);
  };
  // const copyRecord = (item: AiChatRecordItem, _index: number) => {
  //   console.log('Copy:', item);
  // };
  const toMarkmap = (item: AiChatRecordItem, _index: number) => {
    const markmapdata = item.content && isArray(item.content) ? (item.content.find((c: any) => c.type === 'output_text') as TextContent)?.text  : item.content;
    const windowManager = controller.context.windowManager;
    const _isMarkdown = isMarkdown(markmapdata);
    const appliancePlugin = windowManager._appliancePlugin;
    if (_isMarkdown && appliancePlugin) {
      const mainView = windowManager.mainView;
      windowManager._appliancePlugin.insertMarkmap('mainView', {
        uuid: Date.now().toString(), 
        data: markmapdata, 
        centerX: mainView.camera.centerX, 
        centerY: mainView.camera.centerY, 
        width: mainView.size.width, 
        height: mainView.size.height, 
        locked: true,
      });
    }
    if (!_isMarkdown) {
      console.warn('[Chat] 警告: 消息不是 Markdown 格式，无法导出为思维导图');
    }
    if (!appliancePlugin) {
      console.error('[Chat] 错误: 窗口管理器不支持思维导图功能，无法导出为思维导图');
      return;
    }
    appliancePlugin.insertText( 0, 0, markmapdata);
  };
  return <div className={controller.c('chat-app')}>
    <Flex className={controller.c('chat-app-header')} justify="space-between">
      <Button variant="outlined" disabled={isCliping} color="primary" onClick={() => {
        controller.activeCaptureView();
      }}>{isCliping ? i18n['clipping'] : i18n['clip']}</Button>
      {
        controller.isAbleAutoSnapshot && <Button variant="outlined" disabled={isCliping} color="primary" onClick={() => {
          if (isAutoCliping) {
            controller.cancelAutoSnapshot();
          } else {
            controller.activeAutoSnapshot();
          }
        }}>{isAutoCliping ? i18n['autoClipping'] : i18n['autoClip']}</Button> || null
      }
      <Button variant="outlined" disabled={isCliping} color="primary" onClick={async () => {
        const uuid = controller.context.windowManager.room.uuid;
        const uid = controller.context.windowManager.room.uid;
        const fileName = `${uuid}_${uid}_${Date.now()}.png`;
        const snapshotFile = await controller.snapshot(fileName);
        if (snapshotFile) {
          await controller.onGenerateSnapshots(snapshotFile);
        }
      }}>{isCliping ? i18n['snapshotting'] : i18n['snapshot']}</Button>
    </Flex>
    <div className={controller.c('chat-app-content')}>
      {isArray(record) && record.length > 0 && record.map((item: AiChatRecordItem, index:number) => (
        <ChatRecordItem key={index} item={item} controller={controller} 
          onReChat={() => {
            sent(item);
          }}  
          onDelete={() => {
            deleteRecord(item, index);
          }}
          onMarkmap={()=>{
            toMarkmap(item, index);
          }}
        />
      )) || <div className={controller.c('chat-app-empty-content')}>{i18n['noContent']}</div>}
      {isStreaming && <ChatStreamText text={streamText} controller={controller} /> || null}
    </div>
    <Input.TextArea className={controller.c('chat-app-input')} rows={4} value={inputText} onChange={(e) => setInputText(e.target.value)}/>
    <ChatFooter isStreaming={isStreaming} controller={controller} setActiveMode={setActiveMode} sent={sent} />
  </div>;
};


export const ChatFooter = (props: {
    controller: AIPanelController
    setActiveMode: (mode: string) => void
    isStreaming: boolean;
    sent: (_item?: AiChatRecordItem) => void | Promise<void>
}) => {
  const { controller, setActiveMode, sent, isStreaming } = props;
  const { models, activeMode, i18n } = useContext(PanelContext);
  const SelectUIComponent = useMemo(() => {
    const options = models.map(model => ({ label: model, value: model }));
    if (options.length > 0) {
      return <Select
        defaultValue={options[0].value}
        value={activeMode}
        onChange={setActiveMode}
        options={options}
      />;
    } else {
      return <div>No models</div>;
    }
  }, [models, activeMode]);
  return <div className={controller.c('chat-app-footer')}>
    {SelectUIComponent}
    <Button disabled={isStreaming}  type="primary" onClick={() => sent()}>{i18n['send']}</Button>
  </div>;
};
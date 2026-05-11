/**
 * LLM客户端
 * 负责与大语言模型API的通信
 */

import { LLMConfig, Message } from '../types';

/**
 * LLM客户端类
 */
export class LLMClient {
  constructor(private config: LLMConfig) { }

  /**
   * 发送消息并获取回复（非流式）
   * @param messages 消息列表
   * @returns LLM的回复内容
   */
  async chat(messages: Message[]): Promise<string> {
    // 格式化消息，将observation角色转换为user（因为大部分API不支持observation）
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'observation' ? 'user' : msg.role,
      content: msg.content
    }));

    console.log(`非流式输出:${JSON.stringify(formattedMessages)}`)
    // 构建请求体
    const requestBody = {
      model: this.config.model,
      messages: formattedMessages,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000,
      stream: false
    };

    try {
      // 发送请求到LLM API
      const response = await fetch(`${this.config.baseURL || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LLM API错误: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // 提取回复内容
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('LLM返回的内容为空');
      }

      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`调用LLM失败: ${errorMessage}`);
    }
  }

  /**
   * 流式输出
   * @param messages 消息列表
   * @returns 异步生成器，逐步返回内容片段
   */
  async *chatStream(messages: Message[]): AsyncGenerator<string> {
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'observation' ? 'user' : msg.role,
      content: msg.content
    }));
 
    console.log(`流式输出:${JSON.stringify(formattedMessages)}`)
 
    const requestBody = {
      model: this.config.model,
      messages: formattedMessages,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000,
      stream: true
    };

    try {
      const response = await fetch(`${this.config.baseURL || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LLM API错误: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6); // 移除 "data: " 前缀
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // 忽略解析错误，继续处理下一个chunk
            continue;
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      yield `\n[错误: ${errorMessage}]\n`;
    }
  }
}
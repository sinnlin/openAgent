/**
 * 核心类型定义
 * 定义整个Agent系统使用的所有类型
 */

/**
 * 消息角色类型
 */
export type Role = 'system' | 'user' | 'assistant' | 'observation';

/**
 * 消息接口
 */
export interface Message {
  role: Role;           // 消息发送者角色
  content: string;      // 消息内容
  timestamp: Date;      // 时间戳
  toolCalls?: ToolCall[];     // 工具调用（可选）
  toolCallId?: string;        // 工具调用ID（可选）
}

/**
 * 工具调用接口
 */
export interface ToolCall {
  id: string;                   // 唯一标识
  name: string;                 // 工具名称
  arguments: Record<string, any>; // 参数
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  toolCallId: string;  // 对应的工具调用ID
  result: string;      // 执行结果
  error?: string;      // 错误信息（如果有）
}

/**
 * Agent状态枚举
 */
export enum AgentState {
  IDLE = 'idle',           // 空闲
  THINKING = 'thinking',   // 思考中
  ACTING = 'acting',       // 执行中
  OBSERVING = 'observing', // 观察中
  FINISHED = 'finished'    // 已完成
}

/**
 * 工具参数定义
 */
export interface ToolParameter {
  type: string;                // 参数类型: string, number, boolean, object, array
  description?: string;        // 参数描述
  required?: boolean;          // 是否必需
  properties?: Record<string, ToolParameter>; // 对象类型的属性
  items?: ToolParameter;       // 数组类型的元素类型
}

/**
 * 工具接口
 */
export interface Tool {
  name: string;                           // 工具名称
  description: string;                    // 工具描述
  parameters: Record<string, ToolParameter>; // 参数定义
  execute: (params: Record<string, any>) => Promise<string> | string; // 执行函数
}

/**
 * LLM配置接口
 */
export interface LLMConfig {
  model: string;           // 模型名称
  apiKey?: string;         // API密钥
  baseURL?: string;        // API基础URL
  temperature?: number;    // 温度参数（0-1）
  maxTokens?: number;      // 最大生成令牌数
}

/**
 * Agent配置接口
 */
export interface AgentConfig {
  maxIterations: number;    // 最大迭代次数
  maxMemoryLength: number;  // 最大记忆长度
  verbose: boolean;         // 是否输出详细日志
  timeout: number;          // 超时时间（毫秒）
}

/**
 * 响应解析结果
 */
export interface ParsedResponse {
  type: 'thought' | 'action' | 'final_answer';
  thought?: string;
  toolName?: string;
  toolInput?: Record<string, any>;
  answer?: string;
}
/**
 * 配置管理模块
 * 负责加载和验证环境变量，提供应用配置
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// 加载.env文件中的环境变量
dotenv.config();

// 定义环境变量的验证规则
const envSchema = z.object({
  // OpenAI配置
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY是必需的'),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-3.5-turbo'),
  OPENAI_TEMPERATURE: z.string().transform(Number).default('0.7'),
  OPENAI_MAX_TOKENS: z.string().transform(Number).default('2000'),
  
  // 应用配置
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG: z.string().transform(v => v === 'true').default('false'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

// 解析并验证环境变量
const env = envSchema.parse(process.env);

/**
 * 应用配置对象
 */
export const config = {
  // LLM配置
  llm: {
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL,
    model: env.OPENAI_MODEL,
    temperature: env.OPENAI_TEMPERATURE,
    maxTokens: env.OPENAI_MAX_TOKENS
  },
  
  // Agent配置
  agent: {
    maxIterations: 10,          // 最大迭代次数
    maxMemoryLength: 50,        // 最大记忆长度
    verbose: env.DEBUG,         // 是否输出详细日志
    timeout: 30000              // 超时时间（毫秒）
  },
  
  // 工具配置
  tools: {
    enableWebSearch: false,     // 是否启用网络搜索
    enableFileSystem: false,    // 是否启用文件系统访问
    enableCalculator: true,     // 是否启用计算器
    enableTextProcessor: true   // 是否启用文本处理
  },
  
  // 应用配置
  app: {
    env: env.NODE_ENV,
    debug: env.DEBUG,
    logLevel: env.LOG_LEVEL
  }
};

/**
 * 验证配置是否完整
 */
export function validateConfig(): void {
  if (!config.llm.apiKey) {
    throw new Error('请在.env文件中设置OPENAI_API_KEY');
  }
  
  if (config.llm.apiKey === 'sk-your-openai-api-key-here') {
    console.warn('⚠️  警告: 请将.env.example复制为.env并设置正确的API密钥');
  }
}

/**
 * 获取配置信息（用于调试）
 */
export function getConfigInfo(): string {
  return `
配置信息:
- 环境: ${config.app.env}
- 模型: ${config.llm.model}
- 最大迭代: ${config.agent.maxIterations}
- 调试模式: ${config.app.debug}
- 工具: ${Object.entries(config.tools).filter(([, enabled]) => enabled).map(([name]) => name).join(', ')}
  `;
}
/**
 * 基础使用示例
 * 演示Agent的基本功能
 */

import { LLMClient } from '../llm/client';
import { Agent } from '../agent/core';
import { calculatorTool, textProcessorTool, currentTimeTool } from '../tools/builtin';
import { config, validateConfig } from '../config';

async function basicExample() {
  console.log('🎯 基础示例: Agent使用演示\n');
  
  // 验证配置
  validateConfig();
  
  // 创建LLM客户端
  const llm = new LLMClient({
    model: config.llm.model,
    apiKey: config.llm.apiKey,
    baseURL: config.llm.baseURL,
    temperature: 0.7
  });
  
  // 创建Agent
  const agent = new Agent(llm, {
    maxIterations: 5,
    verbose: true
  });
  
  // 注册工具
  agent.registerTools([calculatorTool, textProcessorTool, currentTimeTool]);
  
  // 示例1: 数学计算
  console.log('\n📐 示例1: 数学计算');
  const result1 = await agent.run("计算 (15 + 7) * 3 - 8 的结果");
  console.log(`结果: ${result1}\n`);
  
  // 重置Agent（清除记忆）
  agent.clearMemory();
  
  // 示例2: 文本处理
  console.log('\n📝 示例2: 文本处理');
  const result2 = await agent.run("请将 'TypeScript Agent' 转换为大写，然后统计字符数");
  console.log(`结果: ${result2}\n`);
  
  // 示例3: 多个任务
  console.log('\n🔧 示例3: 复杂任务');
  const result3 = await agent.run("现在是几点？然后帮我计算 100 的平方根");
  console.log(`结果: ${result3}\n`);
}

// 运行示例
basicExample().catch(console.error);
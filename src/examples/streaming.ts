/**
 * 流式输出示例
 * 演示如何实时输出Agent的思考过程
 */

import { LLMClient } from '../llm/client';
import { Agent } from '../agent/core';
import { calculatorTool, textProcessorTool } from '../tools/builtin';
import { config, validateConfig } from '../config';

async function streamingExample() {
  console.log('🎯 流式输出示例\n');
  
  validateConfig();
  
  const llm = new LLMClient({
    model: config.llm.model,
    apiKey: config.llm.apiKey,
    baseURL: config.llm.baseURL
  });
  
  const agent = new Agent(llm, { verbose: false });
  agent.registerTools([calculatorTool, textProcessorTool]);
  
  const question = "请计算 2的10次方，然后将结果转为大写";
  
  console.log(`📝 用户: ${question}\n`);
  console.log('🤖 Agent响应:');
  console.log('-'.repeat(50));
  
  // 使用流式输出
  for await (const chunk of agent.runStreaming(question)) {
    process.stdout.write(chunk);
  }
  
  console.log('\n' + '-'.repeat(50));
}

// 运行示例
streamingExample().catch(console.error);
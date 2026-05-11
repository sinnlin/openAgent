/**
 * Agent单元测试
 */

import { Agent } from '../src/agent/core';
import { LLMClient } from '../src/llm/client';
import { Tool } from '../src/types';

// Mock LLM客户端
jest.mock('../src/llm/client');

describe('Agent', () => {
  let agent: Agent;
  let mockLLM: jest.Mocked<LLMClient>;
  
  beforeEach(() => {
    mockLLM = new LLMClient({ model: 'test' }) as jest.Mocked<LLMClient>;
    agent = new Agent(mockLLM, { verbose: false, maxIterations: 3 });
  });
  
  test('应该能注册工具', () => {
    const testTool: Tool = {
      name: 'test_tool',
      description: '测试工具',
      parameters: {},
      execute: async () => 'test result'
    };
    
    agent.registerTool(testTool);
    expect(agent.getTools()).toContain('test_tool');
  });
  
  test('应该能清除记忆', () => {
    agent.clearMemory();
    expect(agent.getMemory()).toHaveLength(0);
  });
  
  test('应该能获取当前状态', () => {
    expect(agent.getState()).toBeDefined();
  });
  
  // 添加更多测试...
});
/**
 * Agent核心实现
 * 实现ReAct架构的Agent，具备思考-行动-观察循环能力
 */

import { LLMClient } from '../llm/client';
import { 
  Message, 
  Tool, 
  AgentState, 
  AgentConfig,
  ParsedResponse 
} from '../types';

/**
 * Agent类
 */
export class Agent {
  private tools: Map<string, Tool> = new Map();  // 存储已注册的工具
  private memory: Message[] = [];                 // 对话记忆
  private state: AgentState = AgentState.IDLE;   // 当前状态
  private config: AgentConfig;                    // 配置

  /**
   * 构造函数
   * @param llm LLM客户端实例
   * @param config 可选配置
   */
  constructor(
    private llm: LLMClient,
    config?: Partial<AgentConfig>
  ) {
    this.config = {
      maxIterations: 10,
      maxMemoryLength: 50,
      verbose: true,
      timeout: 30000,
      ...config
    };
  }

  /**
   * 获取系统提示词
   * @returns 格式化的系统提示词
   */
  private getSystemPrompt(): string {
    const toolsDescription = this.buildToolsDescription();
    
    return `你是一个可以使用工具的AI Agent。

## 可用工具

${toolsDescription}

## 响应格式

你必须严格按照以下格式响应：

THOUGHT: 你关于下一步行动的推理

然后选择以下之一：

ACTION: 工具名称
ACTION_INPUT: {"参数1": "值1", "参数2": "值2"}

或者（如果你有最终答案）：

FINAL_ANSWER: 用户问题的最终答案

## 重要规则
1. 在采取行动之前总是提供THOUGHT
2. 只使用上面列出的工具
3. 工具输入必须是有效的JSON格式
4. 如果你不确定，请要求澄清

开始！`;
  }

  /**
   * 构建工具描述
   * @returns 格式化的工具描述文本
   */
  private buildToolsDescription(): string {
    const descriptions: string[] = [];
    
    for (const [name, tool] of this.tools) {
      let desc = `### ${name}\n${tool.description}\n参数:\n`;
      
      for (const [paramName, param] of Object.entries(tool.parameters)) {
        const required = param.required ? '(必需)' : '(可选)';
        desc += `  - ${paramName} ${required}: ${param.type} - ${param.description || '无描述'}\n`;
      }
      
      descriptions.push(desc);
    }
    
    if (descriptions.length === 0) {
      return "当前没有可用工具。如果你需要执行操作，请告知用户。";
    }
    
    return descriptions.join('\n');
  }

  /**
   * 注册单个工具
   * @param tool 工具对象
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    if (this.config.verbose) {
      console.log(`📦 已注册工具: ${tool.name}`);
    }
  }

  /**
   * 批量注册工具
   * @param tools 工具数组
   */
  registerTools(tools: Tool[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }

  /**
   * 添加消息到记忆
   * @param message 消息对象
   */
  private addToMemory(message: Omit<Message, 'timestamp'>): void {
    const fullMessage: Message = {
      ...message,
      timestamp: new Date()
    };
    
    this.memory.push(fullMessage);
    
    // 限制记忆长度，保留最近的对话
    if (this.memory.length > this.config.maxMemoryLength) {
      const systemMessages = this.memory.filter(m => m.role === 'system');
      const recentMessages = this.memory.slice(-(this.config.maxMemoryLength - systemMessages.length));
      this.memory = [...systemMessages, ...recentMessages];
    }
  }

  /**
   * 构建发送给LLM的消息列表
   * @returns 消息列表
   */
  private buildMessages(): Message[] {
    const messages: Message[] = [
      { 
        role: 'system', 
        content: this.getSystemPrompt(), 
        timestamp: new Date() 
      }
    ];
    
    // 添加最近20条对话历史
    const recentMessages = this.memory.slice(-20);
    messages.push(...recentMessages);
    
    return messages;
  }

  /**
   * 解析LLM的响应
   * @param response LLM返回的文本
   * @returns 解析结果
   */
  private parseResponse(response: string): ParsedResponse {
    // 提取THOUGHT
    const thoughtMatch = response.match(/THOUGHT:\s*([\s\S]*?)(?=ACTION:|FINAL_ANSWER:|$)/i);
    const thought = thoughtMatch ? thoughtMatch[1].trim() : '';
    
    // 检查是否是最终答案
    const finalMatch = response.match(/FINAL_ANSWER:\s*([\s\S]*)/i);
    if (finalMatch) {
      return {
        type: 'final_answer',
        thought,
        answer: finalMatch[1].trim()
      };
    }
    
    console.log(`LLM返回的文本:${response}`)
    // 检查是否是工具调用
    const actionMatch = response.match(/ACTION:\s*(\w+)\s*\nACTION_INPUT:\s*([\s\S]*?)(?=THOUGHT:|ACTION:|FINAL_ANSWER:|$)/i);
    if (actionMatch) {
      const toolName = actionMatch[1].trim();
      const inputStr = actionMatch[2].trim();
      
      try {
        // 尝试解析JSON格式的参数
        const toolInput = JSON.parse(inputStr);
        return {
          type: 'action',
          thought,
          toolName,
          toolInput
        };
      } catch (e) {
        // 如果不是JSON，尝试作为普通字符串处理
        return {
          type: 'action',
          thought,
          toolName,
          toolInput: { input: inputStr }
        };
      }
    }
    
    // 如果都没有匹配，将整个响应作为答案
    return {
      type: 'final_answer',
      thought,
      answer: response
    };
  }

  /**
   * 执行工具调用
   * @param toolCall 工具调用信息
   * @returns 执行结果
   */
  private async executeToolCall(toolCall: {
    name: string;
    arguments: Record<string, any>;
  }): Promise<string> {
    const tool = this.tools.get(toolCall.name);
    
    if (!tool) {
      const availableTools = Array.from(this.tools.keys()).join(', ');
      return `错误: 工具'${toolCall.name}'未找到。可用工具: ${availableTools}`;
    }
    
    try {
      if (this.config.verbose) {
        console.log(`🔧 执行工具: ${toolCall.name}`);
        console.log(`📝 参数:`, toolCall.arguments);
      }
      
      // 执行工具函数（支持同步和异步）
      const result = await tool.execute(toolCall.arguments);
      
      if (this.config.verbose) {
        console.log(`✅ 工具执行成功`);
      }
      
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ 工具执行失败: ${errorMessage}`);
      return `工具执行错误: ${errorMessage}`;
    }
  }

  /**
   * 运行Agent处理用户输入
   * @param userInput 用户输入
   * @returns Agent的最终回答
   */
  async run(userInput: string): Promise<string> {
    this.state = AgentState.THINKING;
    
    // 添加用户输入到记忆
    this.addToMemory({
      role: 'user',
      content: userInput
    });
    
    if (this.config.verbose) {
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 Agent启动，输入: ${userInput}`);
      console.log('='.repeat(60));
    }
    
    // 主循环
    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      if (this.config.verbose) {
        console.log(`\n--- 第 ${iteration + 1}/${this.config.maxIterations} 轮 ---`);
      }
      
      // 构建消息
      const messages = this.buildMessages();
      
      try {
        this.state = AgentState.THINKING;
        
        // 调用LLM
        const response = await this.llm.chat(messages);
        
        // 添加助手响应到记忆
        this.addToMemory({
          role: 'assistant',
          content: response
        });
        
        if (this.config.verbose) {
          console.log(`💭 LLM响应:\n${response}\n`);
        }
        
        // 解析响应
        const parsed = this.parseResponse(response);
        
        // 处理最终答案
        if (parsed.type === 'final_answer') {
          this.state = AgentState.FINISHED;
          
          if (this.config.verbose) {
            console.log(`✅ 最终答案: ${parsed.answer}`);
          }
          
          return parsed.answer || response;
        }
        
        // 处理工具调用
        if (parsed.type === 'action' && parsed.toolName) {
          this.state = AgentState.ACTING;
          
          // 执行工具
          const result = await this.executeToolCall({
            name: parsed.toolName,
            arguments: parsed.toolInput || {}
          });
          
          this.state = AgentState.OBSERVING;
          
          // 添加观察结果到记忆
          const observation = `从${parsed.toolName}获取的结果: ${result}`;
          this.addToMemory({
            role: 'observation',
            content: observation
          });
          
          if (this.config.verbose) {
            const preview = result.length > 200 ? result.substring(0, 200) + '...' : result;
            console.log(`👁️ 观察结果: ${preview}`);
          }
        } else {
          // 无法解析，尝试作为最终答案
          console.warn('⚠️ 无法解析LLM响应，将作为最终答案处理');
          this.state = AgentState.FINISHED;
          return response;
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ 第${iteration + 1}轮发生错误:`, errorMsg);
        
        // 将错误添加到记忆
        this.addToMemory({
          role: 'observation',
          content: `系统错误: ${errorMsg}`
        });
        
        // 如果错误太严重，提前退出
        if (errorMsg.includes('API密钥') || errorMsg.includes('认证')) {
          return `Agent执行失败: ${errorMsg}`;
        }
      }
    }
    
    this.state = AgentState.FINISHED;
    return `达到最大迭代次数(${this.config.maxIterations})，未能得到最终答案。`;
  }

  /**
   * 流式运行Agent
   * @param userInput 用户输入
   * @returns 异步生成器，逐步输出内容
   */
  async *runStreaming(userInput: string): AsyncGenerator<string> {
    this.state = AgentState.THINKING;
    
    this.addToMemory({
      role: 'user',
      content: userInput
    });
    
    yield `🚀 开始处理: ${userInput}\n\n`;
    
    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      yield `\n--- 第 ${iteration + 1}/${this.config.maxIterations} 轮 ---\n`;
      
      const messages = this.buildMessages();
      
      try {
        this.state = AgentState.THINKING;
        yield `🤔 思考中...\n`;
        
        let fullResponse = '';
        for await (const chunk of this.llm.chatStream(messages)) {
          fullResponse += chunk;
          yield chunk;
        }
        yield '\n';
        
        this.addToMemory({
          role: 'assistant',
          content: fullResponse
        });
        
        const parsed = this.parseResponse(fullResponse);
        
        if (parsed.type === 'final_answer') {
          this.state = AgentState.FINISHED;
          yield `\n✅ 最终答案: ${parsed.answer}\n`;
          return;
        }
        
        if (parsed.type === 'action' && parsed.toolName) {
          this.state = AgentState.ACTING;
          yield `\n🔧 执行工具: ${parsed.toolName}\n`;
          yield `📝 参数: ${JSON.stringify(parsed.toolInput)}\n`;
          
          const result = await this.executeToolCall({
            name: parsed.toolName,
            arguments: parsed.toolInput || {}
          });
          
          this.state = AgentState.OBSERVING;
          yield `👁️ 结果: ${result}\n`;
          
          this.addToMemory({
            role: 'observation',
            content: `从${parsed.toolName}获取的结果: ${result}`
          });
        }
        
      } catch (error) {
        yield `\n❌ 错误: ${error}\n`;
      }
    }
    
    yield `\n⚠️ 达到最大迭代次数\n`;
  }

  /**
   * 获取记忆内容
   */
  getMemory(): Message[] {
    return [...this.memory];
  }

  /**
   * 获取当前状态
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * 获取已注册的工具列表
   */
  getTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 清除记忆
   */
  clearMemory(): void {
    this.memory = [];
    if (this.config.verbose) {
      console.log('🧹 已清除Agent记忆');
    }
  }
}
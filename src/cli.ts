/**
 * 命令行界面模块
 * 提供交互式命令行模式
 */

import { LLMClient } from './llm/client';
import { Agent } from './agent/core';
import { builtinTools } from './tools/builtin';
import { config } from './config';
import * as readline from 'readline';

/**
 * 启动命令行交互模式
 */
export async function startCLI(): Promise<void> {
    console.log('\n🤖 TypeScript Agent - 命令行模式');
    console.log('='.repeat(60));
    
    // 初始化 LLM 客户端
    const llm = new LLMClient({
        model: config.llm.model,
        apiKey: config.llm.apiKey,
        baseURL: config.llm.baseURL,
        temperature: config.llm.temperature,
        maxTokens: config.llm.maxTokens
    });
    
    // 初始化 Agent
    const agent = new Agent(llm, {
        maxIterations: config.agent.maxIterations,
        maxMemoryLength: config.agent.maxMemoryLength,
        verbose: config.agent.verbose,
        timeout: config.agent.timeout
    });
    
    // 注册工具
    agent.registerTools(builtinTools);
    
    console.log(`✅ Agent 初始化成功`);
    console.log(`📦 已注册工具: ${agent.getTools().length} 个`);
    console.log(`🔧 工具列表: ${agent.getTools().join(', ')}`);
    console.log('='.repeat(60));
    console.log('💡 使用说明:');
    console.log('   - 直接输入问题与 Agent 对话');
    console.log('   - 输入 "/clear" 清除对话记忆');
    console.log('   - 输入 "/tools" 查看可用工具');
    console.log('   - 输入 "/exit" 或 "quit" 退出');
    console.log('='.repeat(60));
    
    // 创建 readline 接口
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '\n🤔 你: '
    });
    
    // 显示提示符
    rl.prompt();
    
    // 处理用户输入
    rl.on('line', async (input: string) => {
        const trimmedInput = input.trim().toLowerCase();
        
        // 退出命令
        if (trimmedInput === '/exit' || trimmedInput === '/quit') {
            console.log('\n👋 再见！');
            rl.close();
            process.exit(0);
            return;
        }
        
        // 清除记忆命令
        if (trimmedInput === '/clear') {
            agent.clearMemory();
            console.log('🧹 对话记忆已清除');
            rl.prompt();
            return;
        }
        
        // 查看工具命令
        if (trimmedInput === '/tools') {
            console.log(`\n📦 可用工具 (${agent.getTools().length} 个):`);
            agent.getTools().forEach(tool => {
                console.log(`   🔧 ${tool}`);
            });
            rl.prompt();
            return;
        }
        
        // 空输入
        if (!trimmedInput) {
            rl.prompt();
            return;
        }
        
        // 正常对话
        console.log('\n🤖 Agent: ');
        try {
            const response = await agent.run(input);
            console.log(response);
        } catch (error) {
            console.error('❌ 错误:', error instanceof Error ? error.message : String(error));
        }
        
        rl.prompt();
    });
    
    // 处理错误
    rl.on('error', (error) => {
        console.error('输入错误:', error);
        rl.prompt();
    });
    
    // 处理关闭
    rl.on('close', () => {
        console.log('\n会话结束');
        process.exit(0);
    });
}

/**
 * 单次运行模式（用于测试）
 */
export async function singleRunMode(question: string): Promise<void> {
    console.log('🎯 单次运行模式\n');
    
    const llm = new LLMClient({
        model: config.llm.model,
        apiKey: config.llm.apiKey,
        baseURL: config.llm.baseURL,
        temperature: config.llm.temperature,
        maxTokens: config.llm.maxTokens
    });
    
    const agent = new Agent(llm, {
        maxIterations: config.agent.maxIterations,
        maxMemoryLength: config.agent.maxMemoryLength,
        verbose: true,
        timeout: config.agent.timeout
    });
    
    agent.registerTools(builtinTools);
    
    console.log(`📝 问题: ${question}`);
    console.log('='.repeat(60));
    
    const response = await agent.run(question);
    console.log(`\n✅ 回答: ${response}`);
}
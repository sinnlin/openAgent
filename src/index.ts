/**
 * 主入口文件
 * 可以选择启动 Web 服务器或命令行模式
 */

import { AgentServer } from './server/server';
import {  validateConfig } from './config';

async function main() {
    console.log('🧠 TypeScript Agent 系统启动');
    console.log('='.repeat(60));
    
    try {
        // 验证配置
        validateConfig();
        
        // 检查是否以 Web 模式启动
        const isWebMode = process.argv.includes('--web') || process.argv.includes('-w');
        
        if (isWebMode) {
            // 启动 Web 服务器
            const port = parseInt(process.env.PORT || '3000');
            const server = new AgentServer(port);
            server.start();
        } else {
            // 启动命令行模式
            const { startCLI } = await import('./cli');
            await startCLI();
        }
        
    } catch (error) {
        console.error('❌ 启动失败:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// 运行
if (require.main === module) {
    main().catch(console.error);
}
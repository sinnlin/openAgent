/**
 * Express Web 服务器
 * 提供 REST API 和静态文件服务
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { LLMClient } from '../llm/client';
import { Agent } from '../agent/core';
import { builtinTools } from '../tools/builtin';
import { config, validateConfig } from '../config';

export class AgentServer {
  private app: Express;
  private server: HttpServer;
  private io: SocketServer;
  private agent: Agent;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.server = new HttpServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // 验证配置
    validateConfig();

    // 初始化 Agent
    const llm = new LLMClient({
      model: config.llm.model,
      apiKey: config.llm.apiKey,
      baseURL: config.llm.baseURL,
      temperature: config.llm.temperature,
      maxTokens: config.llm.maxTokens
    });

    this.agent = new Agent(llm, {
      maxIterations: config.agent.maxIterations,
      maxMemoryLength: config.agent.maxMemoryLength,
      verbose: config.agent.verbose,
      timeout: config.agent.timeout
    });

    // 注册工具
    this.agent.registerTools(builtinTools);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    // CORS 支持
    this.app.use(cors());
    
    // JSON 解析
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // 静态文件服务
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // 日志中间件
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      console.log(res.statusCode)
      next();
    });
  }

  private setupRoutes(): void {
    // 健康检查
    this.app.get('/api/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        tools: this.agent.getTools()
      });
    });

    // Agent 信息
    this.app.get('/api/info', (_req: Request, res: Response) => {
      res.json({
        name: 'TypeScript Agent',
        version: '1.0.0',
        tools: this.agent.getTools(),
        config: {
          maxIterations: config.agent.maxIterations,
          model: config.llm.model
        }
      });
    });

    // 同步对话接口
    this.app.post('/api/chat', async (req: Request, res: Response) => {
      try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string') {
          return res.status(400).json({ error: '消息不能为空' });
        }

        console.log(`收到消息: ${message}`);
        const response = await this.agent.run(message);
        
        return res.json({
          success: true,
          response,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('处理消息时出错:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    });

    // 清除记忆
    this.app.post('/api/clear', (_req: Request, res: Response) => {
      this.agent.clearMemory();
      res.json({
        success: true,
        message: '记忆已清除'
      });
    });

    // 获取历史
    this.app.get('/api/history', (_req: Request, res: Response) => {
      const memory = this.agent.getMemory();
      res.json({
        success: true,
        history: memory
      });
    });

    // 首页
    this.app.get('/', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  private setupWebSocket(): void {
    // WebSocket 连接处理
    this.io.on('connection', (socket) => {
      console.log(`新客户端连接: ${socket.id}`);

      // 发送欢迎消息
      socket.emit('message', {
        type: 'system',
        content: '已连接到 openAgent 服务器',
        timestamp: new Date().toISOString()
      });

      // 处理聊天消息（流式）
      socket.on('chat', async (data) => {
        const { message } = data;
        
        if (!message) {
          socket.emit('error', { error: '消息不能为空' });
          return;
        }

        console.log(`[WebSocket] 收到消息: ${message}`);

        try {
          // 使用流式输出
          for await (const chunk of this.agent.runStreaming(message)) {
            socket.emit('chunk', {
              content: chunk,
              timestamp: new Date().toISOString()
            });
          }
          
          socket.emit('done', {
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', {
            error: error instanceof Error ? error.message : '处理失败'
          });
        }
      });

      // 清除记忆
      socket.on('clear', () => {
        this.agent.clearMemory();
        socket.emit('message', {
          type: 'system',
          content: '记忆已清除',
          timestamp: new Date().toISOString()
        });
      });

      // 获取工具列表
      socket.on('getTools', () => {
        socket.emit('tools', {
          tools: this.agent.getTools()
        });
      });

      // 断开连接
      socket.on('disconnect', () => {
        console.log(`客户端断开: ${socket.id}`);
      });
    });
  }

  start(): void {
    this.server.listen(this.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 TypeScript openAgent 服务器已启动                        ║
║                                                          ║
║   📡 地址: http://localhost:${this.port}                 ║
║   🔧 工具数: ${this.agent.getTools().length}             ║
║   💾 记忆长度: ${this.agent.getMemory().length}          ║
║                                                          ║
║   📝 API 端点:                                           ║
║      POST /api/chat     - 发送消息                        ║
║      GET  /api/history   - 获取历史                       ║
║      POST /api/clear    - 清除记忆                        ║
║      GET  /api/info     - 获取信息                        ║
║                                                          ║
║   🔌 WebSocket: ws://localhost:${this.port}              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  }

  async stop(): Promise<void> {
    this.io.close();
    this.server.close();
    console.log('服务器已关闭');
  }
}
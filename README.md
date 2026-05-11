# OpenAgent System

一个从零实现的 TypeScript Agent 系统，基于 ReAct 架构，支持工具调用、记忆管理、流式输出和 Web 界面。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ 特性

- 🤖 **ReAct 架构**: 思考(Thought)-行动(Action)-观察(Observation)循环
- 🔧 **工具系统**: 易于扩展的工具注册机制，支持自定义工具
- 💾 **记忆管理**: 自动管理对话历史，支持上下文窗口限制
- 🌊 **流式输出**: 实时输出 Agent 的思考过程
- 🌐 **Web 界面**: 美观的聊天界面，支持 WebSocket 实时通信
- 📝 **命令行界面**: 交互式命令行模式，适合快速测试
- 🛠️ **内置工具**: 计算器、文本处理、时间查询、单位转换等
- 🔌 **REST API**: 完整的 RESTful API 接口
- 📡 **WebSocket**: 支持流式输出的 WebSocket 连接
- 🎨 **响应式设计**: 适配桌面和移动设备

## 📋 目录

- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [使用方式](#-使用方式)
- [API 文档](#-api-文档)
- [自定义工具](#-自定义工具)
- [配置说明](#-配置说明)
- [常见问题](#-常见问题)
- [开发计划](#-开发计划)

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- OpenAI API Key（或其他兼容的 LLM API）

### 安装

```bash
# 克隆项目
git clone https://github.com/sinnlin/openAgent.git
cd openAgent

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写你的 OpenAI API Key

# 编译项目
npm run build

# 启动应用
npm run start:web
```

### 运行模式

#### Web 服务器模式（推荐）

```bash
# 开发模式（支持热重载）
npm run dev:web

# 生产模式
npm run build
npm run start:web
```

访问 `http://localhost:3000` 打开 Web 界面。

#### 命令行模式

```bash
# 开发模式
npm run dev:cli

# 生产模式
npm run build
npm run start:cli
```

## 📁 项目结构

```
openAgent/
├── src/
│   ├── types/           # TypeScript 类型定义
│   │   └── index.ts
│   ├── llm/             # LLM 客户端
│   │   └── client.ts
│   ├── agent/           # Agent 核心实现
│   │   ├── core.ts      # 基础 Agent
│   │   └── advanced.ts  # 高级功能
│   ├── tools/           # 工具实现
│   │   ├── builtin.ts   # 内置工具
│   │   └── custom.ts    # 自定义工具示例
│   ├── server/          # Web 服务器
│   │   ├── server.ts    # Express 服务器
│   │   └── routes.ts    # API 路由
│   ├── public/          # 前端静态文件
│   │   ├── index.html   # 主页面
│   │   ├── css/         # 样式文件
│   │   └── js/          # 前端逻辑
│   ├── cli.ts           # 命令行界面
│   ├── config.ts        # 配置管理
│   └── index.ts         # 主入口
├── scripts/             # 辅助脚本
├── dist/                # 编译输出
├── .env.example         # 环境变量示例
├── .gitignore          # Git 忽略文件
├── package.json        # 项目依赖
├── tsconfig.json       # TypeScript 配置
└── README.md           # 项目文档
```

## 💡 使用方式

### Web 界面使用

1. 启动 Web 服务器后，打开浏览器访问 `http://localhost:3000`
2. 在聊天框中输入问题，例如：
   - "计算 2 的 10 次方"
   - "现在几点了？"
   - "将 'hello world' 转换为大写"
3. Agent 会实时显示思考过程和执行结果

### 命令行使用

```bash
# 启动命令行模式
npm run start:cli

# 可用命令
- 直接输入问题与 Agent 对话
- clear   - 清除对话记忆
- tools   - 查看可用工具
- exit    - 退出程序
```

### API 调用

```bash
# 发送消息
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "计算 100 的平方根"}'

# 获取 Agent 信息
curl http://localhost:3000/api/info

# 清除记忆
curl -X POST http://localhost:3000/api/clear

# 获取对话历史
curl http://localhost:3000/api/history
```

## 📚 API 文档

### REST API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/` | Web 界面 |
| GET | `/api/health` | 健康检查 |
| GET | `/api/info` | 获取 Agent 信息 |
| POST | `/api/chat` | 发送消息（同步） |
| POST | `/api/clear` | 清除记忆 |
| GET | `/api/history` | 获取对话历史 |

### WebSocket 事件

| 事件 | 方向 | 描述 |
|------|------|------|
| `chat` | 客户端→服务器 | 发送消息 |
| `chunk` | 服务器→客户端 | 接收消息块（流式） |
| `done` | 服务器→客户端 | 消息完成 |
| `clear` | 客户端→服务器 | 清除记忆 |
| `tools` | 服务器→客户端 | 工具列表更新 |

## 🛠️ 自定义工具

### 创建简单工具

```typescript
import { Tool } from './types';

const myTool: Tool = {
  name: 'my_tool',
  description: '我的自定义工具',
  parameters: {
    param1: {
      type: 'string',
      description: '参数1',
      required: true
    }
  },
  execute: async (params) => {
    // 工具逻辑
    return `处理结果: ${params.param1}`;
  }
};

// 注册工具
agent.registerTool(myTool);
```

### 创建复杂工具示例

```typescript
const weatherTool: Tool = {
  name: 'get_weather',
  description: '获取天气信息',
  parameters: {
    city: {
      type: 'string',
      description: '城市名称',
      required: true
    },
    unit: {
      type: 'string',
      description: '温度单位: celsius/fahrenheit',
      required: false
    }
  },
  execute: async (params) => {
    const { city, unit = 'celsius' } = params;
    
    // 调用真实 API
    const response = await fetch(
      `https://api.weather.com/${city}?unit=${unit}`
    );
    const data = await response.json();
    
    return `${city}天气: ${data.temperature}°${unit === 'celsius' ? 'C' : 'F'}`;
  }
};
```

## ⚙️ 配置说明

### 环境变量

创建 `.env` 文件：

```env
# OpenAI 配置
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_BASE_URL=http://localhost:8080/v1
OPENAI_MODEL=Qwen3.5-9B-DeepSeek-V4-Flash-Q4_K_M.gguf
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000

# 可选：其他配置
# OPENAI_ORG_ID=org-xxxxxxxx
 DEBUG=true
# LOG_LEVEL=info

# 服务器配置
PORT=3000
NODE_ENV=development

# Agent 配置
AGENT_MAX_ITERATIONS=10
AGENT_MAX_MEMORY=50
AGENT_VERBOSE=true

# 调试模式
DEBUG=false
LOG_LEVEL=info
```

### 配置说明

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `OPENAI_API_KEY` | - | OpenAI API 密钥（必需） |
| `OPENAI_MODEL` | `gpt-3.5-turbo` | 使用的模型 |
| `OPENAI_TEMPERATURE` | `0.7` | 生成温度（0-1） |
| `AGENT_MAX_ITERATIONS` | `10` | 最大迭代次数 |
| `PORT` | `3000` | Web 服务器端口 |

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试（监听模式）
npm run test:watch

# 测试覆盖率
npm run test:coverage
```

## 📦 构建和部署

### 构建生产版本

```bash
# 清理旧文件
npm run clean

# 编译 TypeScript
npm run build

# 启动生产服务器
NODE_ENV=production npm run start:web
```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY src/public ./dist/public
EXPOSE 3000
CMD ["node", "dist/index.js", "--web"]
```

```bash
# 构建镜像
docker build -t openAgent .

# 运行容器
docker run -p 3000:3000 --env-file .env openAgent
```

## ❓ 常见问题

### Q: 如何获取 OpenAI API Key？
A: 访问 [OpenAI Platform](https://platform.openai.com/)，注册账号后在 API Keys 页面创建。

### Q: 支持其他 LLM 吗？
A: 支持。可以修改 `llm/client.ts` 来适配其他 API（如 Claude、Azure、本地模型等）。

### Q: 如何添加新的工具？
A: 参考[自定义工具](#-自定义工具)部分，创建工具对象并注册到 Agent。

### Q: Windows 下构建失败？
A: 使用项目提供的 Windows 兼容脚本，或手动复制静态文件：
```cmd
xcopy /E /I src\public dist\public
```

### Q: Agent 响应慢怎么办？
A: 可以调整配置：
- 减少 `AGENT_MAX_ITERATIONS`
- 使用更快的模型（如 `gpt-3.5-turbo`）
- 启用流式输出模式

### Q: 如何保存对话历史？
A: Agent 会自动保存记忆，可以通过 `/api/history` 接口获取。

## 🔧 开发

```bash
# 安装开发依赖
npm install

# 开发模式（自动重启）
npm run dev:web

# 代码格式化
npm run format

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

## 📊 性能优化建议

1. **使用流式输出**: 减少用户等待时间
2. **限制记忆长度**: 避免上下文过长
3. **工具缓存**: 对重复请求使用缓存
4. **并发控制**: 限制同时处理的请求数

## 🎯 路线图

- [x] 基础 Agent 架构
- [x] 工具系统
- [x] Web 界面
- [x] WebSocket 支持
- [x] 流式输出
- [ ] 插件系统
- [ ] 多模型支持
- [ ] 对话导出功能
- [ ] 用户认证
- [ ] 数据库持久化
- [ ] 更多内置工具

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [OpenAI](https://openai.com/) - LLM API
- [Express](https://expressjs.com/) - Web 框架
- [Socket.IO](https://socket.io/) - WebSocket 库
- [Math.js](https://mathjs.org/) - 数学计算库

## 📞 联系方式
- 作者: sinnlin
- 项目主页: [GitHub](https://github.com/sinnlin/openAgent)
- 问题反馈: [Issues](https://github.com/sinnlin/openAgent/issues)
- 邮箱: lintongxin@163.com
---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
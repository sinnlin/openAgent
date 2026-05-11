/**
 * 前端应用主逻辑
 * 处理 WebSocket 连接和 UI 交互
 */

class AgentApp {
    constructor() {
        this.socket = null;
        this.messagesContainer = null;
        this.messageInput = null;
        this.sendBtn = null;
        this.clearBtn = null;
        this.isConnected = false;
        this.isTyping = false;
        
        this.init();
    }
    
    init() {
        // 获取 DOM 元素
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // 绑定事件
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.clearBtn.addEventListener('click', () => this.clearMemory());
        
        // 连接 WebSocket
        this.connectWebSocket();
        
        // 加载工具列表
        this.loadTools();
        
        // 滚动到最底部
        this.scrollToBottom();
    }
    
    connectWebSocket() {
        // 连接 Socket.IO
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('WebSocket 连接成功');
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.addSystemMessage('已连接到服务器');
        });
        
        this.socket.on('disconnect', () => {
            console.log('WebSocket 连接断开');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.addSystemMessage('连接已断开，尝试重连中...');
        });
        
        // 接收消息块（流式输出）
        this.socket.on('chunk', (data) => {
            this.appendToCurrentMessage(data.content);
        });
        
        // 消息完成
        this.socket.on('done', () => {
            this.finishCurrentMessage();
        });
        
        // 完整消息（非流式）
        this.socket.on('message', (data) => {
            if (data.type === 'system') {
                this.addSystemMessage(data.content);
            } else if (data.type === 'response') {
                this.addAssistantMessage(data.content);
            }
        });
        
        // 错误处理
        this.socket.on('error', (data) => {
            console.error('服务器错误:', data.error);
            this.addSystemMessage(`错误: ${data.error}`, 'error');
            this.finishCurrentMessage();
        });
        
        // 工具列表更新
        this.socket.on('tools', (data) => {
            this.updateToolsList(data.tools);
        });
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message) return;
        if (!this.isConnected) {
            this.addSystemMessage('未连接到服务器，请刷新页面重试', 'error');
            return;
        }
        
        // 添加用户消息到界面
        this.addUserMessage(message);
        
        // 清空输入框
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        // 添加临时消息占位符
        this.addTempAssistantMessage();
        
        // 发送到服务器
        this.socket.emit('chat', { message });
    }
    
    addUserMessage(content) {
        const messageDiv = this.createMessageElement('user', content);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addAssistantMessage(content) {
        const messageDiv = this.createMessageElement('assistant', content);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addTempAssistantMessage() {
        // 移除欢迎消息（如果存在）
        const welcomeMsg = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // 创建临时消息
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        messageDiv.id = 'temp-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        contentDiv.appendChild(typingIndicator);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        this.isTyping = true;
    }
    
    appendToCurrentMessage(content) {
        const tempMessage = document.getElementById('temp-message');
        if (tempMessage) {
            const contentDiv = tempMessage.querySelector('.message-content');
            const typingIndicator = contentDiv.querySelector('.typing-indicator');
            
            if (typingIndicator) {
                // 移除打字指示器
                typingIndicator.remove();
                contentDiv.innerHTML = '';
            }
            
              let msg = this.formatMessageContent(content);

            if (msg.indexOf('最终答案:') > 0) {
                console.log(msg)
                msg = msg.split('最终答案:')[1]
                console.log(msg)
                // 追加内容
                contentDiv.innerHTML += msg;

            }
            this.scrollToBottom();
        }
    }
    
    finishCurrentMessage() {
        const tempMessage = document.getElementById('temp-message');
        if (tempMessage) {
            // 移除临时标记
            tempMessage.removeAttribute('id');
            
            // 添加时间戳
            const contentDiv = tempMessage.querySelector('.message-content');
            const timeSpan = document.createElement('div');
            timeSpan.className = 'message-time';
            timeSpan.textContent = new Date().toLocaleTimeString();
            contentDiv.appendChild(timeSpan);
        }
        
        this.isTyping = false;
    }
    
    addSystemMessage(content, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.style.background = '#f3f4f6';
        contentDiv.style.color = '#6b7280';
        contentDiv.style.fontSize = '0.875rem';
        contentDiv.style.textAlign = 'center';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // 3秒后自动移除系统消息
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
    createMessageElement(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessageContent(content);
        
        const timeSpan = document.createElement('div');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString();
        contentDiv.appendChild(timeSpan);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        return messageDiv;
    }
    
    formatMessageContent(content) {
        // 转义 HTML
        let formatted = this.escapeHtml(content);
        
        // 格式化代码块
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
        });
        
        // 格式化行内代码
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 格式化换行
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async loadTools() {
        try {
            const response = await fetch('/api/info');
            const data = await response.json();
            
            if (data.tools) {
                this.updateToolsList(data.tools);
            }
            
            // 更新模型名称
            const modelNameEl = document.getElementById('modelName');
            if (modelNameEl && data.config) {
                modelNameEl.textContent = data.config.model || 'GPT-3.5';
            }
            
            // 更新工具数量
            const toolCountEl = document.getElementById('toolCount');
            if (toolCountEl && data.tools) {
                toolCountEl.textContent = data.tools.length;
            }
        } catch (error) {
            console.error('加载工具列表失败:', error);
        }
    }
    
    updateToolsList(tools) {
        const toolsContainer = document.getElementById('tools');
        if (!toolsContainer) return;
        
        if (!tools || tools.length === 0) {
            toolsContainer.innerHTML = '<div class="loading">暂无工具</div>';
            return;
        }
        
        toolsContainer.innerHTML = tools.map(tool => `
            <div class="tool-item">🔧 ${tool}</div>
        `).join('');
    }
    
    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connectionStatus');
        const dotEl = document.querySelector('.status-dot');
        
        if (connected) {
            statusEl.innerHTML = '<span class="status-dot connected"></span>已连接';
            if (dotEl) dotEl.classList.add('connected');
        } else {
            statusEl.innerHTML = '<span class="status-dot"></span>连接中...';
            if (dotEl) dotEl.classList.remove('connected');
        }
    }
    
    async clearMemory() {
        try {
            const response = await fetch('/api/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addSystemMessage('✅ 记忆已清除');
                
                // 可选：清除聊天记录
                // this.clearMessages();
            }
        } catch (error) {
            console.error('清除记忆失败:', error);
            this.addSystemMessage('清除记忆失败', 'error');
        }
    }
    
    clearMessages() {
        const messages = this.messagesContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // 重新显示欢迎消息
        this.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">👋</div>
                <h3>欢迎使用 openAgent</h3>
                <p>我可以帮你：</p>
                <ul>
                    <li>📐 执行数学计算</li>
                    <li>📝 处理文本内容</li>
                    <li>⏰ 获取时间信息</li>
                    <li>🔧 使用各种工具完成任务</li>
                </ul>
                <p>试试向我提问吧！</p>
            </div>
        `;
    }
    
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
}

// 初始化应用
const app = new AgentApp();
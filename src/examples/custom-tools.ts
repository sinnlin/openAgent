/**
 * 自定义工具示例
 * 演示如何创建和使用自定义工具
 */

import { LLMClient } from '../llm/client';
import { Agent } from '../agent/core';
import { Tool } from '../types';
import { config, validateConfig } from '../config';

/**
 * 自定义天气工具
 */
const weatherTool: Tool = {
  name: 'get_weather',
  description: '获取指定城市的天气信息',
  parameters: {
    city: {
      type: 'string',
      description: '城市名称（拼音或中文）',
      required: true
    },
    unit: {
      type: 'string',
      description: '温度单位: celsius(摄氏度) 或 fahrenheit(华氏度)',
      required: false
    }
  },
  execute: async (params) => {
    const { city, unit = 'celsius' } = params;
    
    // 模拟天气数据（实际应该调用真实的天气API）
    const weatherData: Record<string, any> = {
      '北京': { temp: 22, condition: '晴天', humidity: 45, wind: '东北风2级' },
      '上海': { temp: 25, condition: '多云', humidity: 65, wind: '东南风3级' },
      '广州': { temp: 30, condition: '阵雨', humidity: 80, wind: '南风2级' },
      '深圳': { temp: 28, condition: '多云', humidity: 70, wind: '东风2级' },
      '杭州': { temp: 23, condition: '阴天', humidity: 75, wind: '北风1级' }
    };
    
    const cityKey = Object.keys(weatherData).find(
      key => key.includes(city) || city.includes(key)
    );
    
    if (!cityKey) {
      return `未找到城市"${city}"的天气信息。支持的城市: ${Object.keys(weatherData).join(', ')}`;
    }
    
    const weather = weatherData[cityKey];
    const temperature = unit === 'fahrenheit' 
      ? (weather.temp * 9/5 + 32).toFixed(1)
      : weather.temp;
    const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C';
    
    return `${cityKey}天气: ${temperature}${unitSymbol}, ${weather.condition}, 湿度${weather.humidity}%, ${weather.wind}`;
  }
};

/**
 * 自定义股票价格工具（模拟）
 */
const stockTool: Tool = {
  name: 'get_stock_price',
  description: '获取股票当前价格（模拟数据）',
  parameters: {
    symbol: {
      type: 'string',
      description: '股票代码，例如: AAPL, GOOGL, TSLA',
      required: true
    }
  },
  execute: async (params) => {
    const { symbol } = params;
    
    // 模拟股票价格
    const mockPrices: Record<string, number> = {
      'AAPL': 175.50,
      'GOOGL': 138.25,
      'TSLA': 245.75,
      'MSFT': 335.20,
      'AMZN': 145.80
    };
    
    const price = mockPrices[symbol.toUpperCase()];
    if (!price) {
      return `未找到股票 ${symbol} 的价格信息。支持的股票: ${Object.keys(mockPrices).join(', ')}`;
    }
    
    // 模拟涨跌
    const change = (Math.random() * 10 - 5).toFixed(2);
    const changePercent = ((parseFloat(change) / price) * 100).toFixed(2);
    const trend = parseFloat(change) >= 0 ? '📈' : '📉';
    
    return `${trend} ${symbol.toUpperCase()} 当前价格: $${price.toFixed(2)} (${parseFloat(change) >= 0 ? '+' : ''}$${change}, ${changePercent}%)`;
  }
};

/**
 * 自定义备忘录工具
 */
const memoTool: Tool = {
  name: 'memo',
  description: '保存和读取备忘录',
  parameters: {
    action: {
      type: 'string',
      description: '操作类型: save(保存), read(读取), list(列出所有), delete(删除)',
      required: true
    },
    key: {
      type: 'string',
      description: '备忘录的键名（唯一标识）',
      required: true
    },
    value: {
      type: 'string',
      description: '保存操作时的内容',
      required: false
    }
  },
  execute: async (params) => {
    // 使用内存存储（实际应用应该使用数据库或文件）
    const memos: Map<string, string> = new Map();
    
    const { action, key, value } = params;
    
    switch (action) {
      case 'save':
        if (!value) return '错误: save操作需要提供value参数';
        memos.set(key, value);
        return `备忘录已保存: ${key}`;
        
      case 'read':
        const memo = memos.get(key);
        if (!memo) return `未找到备忘录: ${key}`;
        return `${key}: ${memo}`;
        
      case 'list':
        if (memos.size === 0) return '暂无备忘录';
        const list = Array.from(memos.keys()).join(', ');
        return `备忘录列表: ${list}`;
        
      case 'delete':
        const deleted = memos.delete(key);
        return deleted ? `已删除备忘录: ${key}` : `未找到备忘录: ${key}`;
        
      default:
        return `未知操作: ${action}`;
    }
  }
};

/**
 * 自定义工具示例
 */
async function customToolsExample() {
  console.log('🎯 自定义工具示例\n');
  
  validateConfig();
  
  const llm = new LLMClient({
    model: config.llm.model,
    apiKey: config.llm.apiKey,
    baseURL: config.llm.baseURL,
    temperature: 0.7
  });
  
  const agent = new Agent(llm, {
    maxIterations: 5,
    verbose: true
  });
  
  // 注册自定义工具
  agent.registerTools([weatherTool, stockTool, memoTool]);
  
  console.log(`✅ 已注册 ${agent.getTools().length} 个自定义工具`);
  console.log(`📦 工具列表: ${agent.getTools().join(', ')}\n`);
  
  // 测试天气查询
  console.log('='.repeat(60));
  console.log('🌤️ 测试1: 查询天气');
  const weatherResult = await agent.run("北京的天气怎么样？用摄氏度显示");
  console.log(`结果: ${weatherResult}\n`);
  
  agent.clearMemory();
  
  // 测试股票查询
  console.log('='.repeat(60));
  console.log('📊 测试2: 查询股票');
  const stockResult = await agent.run("苹果公司的股票现在多少钱？");
  console.log(`结果: ${stockResult}\n`);
  
  agent.clearMemory();
  
  // 测试备忘录功能
  console.log('='.repeat(60));
  console.log('📝 测试3: 备忘录功能');
  const memoResult = await agent.run("帮我记住：明天下午3点开会，会议主题是项目进度汇报");
  console.log(`结果: ${memoResult}`);
  
  const readResult = await agent.run("我刚才记了什么？");
  console.log(`结果: ${readResult}\n`);
}

// 运行示例
customToolsExample().catch(console.error);
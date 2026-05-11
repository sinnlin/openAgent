/**
 * 内置工具集
 * 提供常用的工具功能：计算器、文本处理、时间、网络搜索等
 */

import { Tool } from '../types';
import * as math from 'mathjs';

/**
 * 计算器工具
 * 支持数学表达式计算
 */
export const calculatorTool: Tool = {
  name: 'calculator',
  description: '执行数学计算，支持基本运算、三角函数、幂函数等',
  parameters: {
    expression: {
      type: 'string',
      description: '要计算的数学表达式，例如 "2 + 2 * 3" 或 "sqrt(16)" 或 "sin(pi/2)"',
      required: true
    }
  },
  execute: async (params) => {
    try {
      const expression = params.expression;
      // 使用mathjs安全地计算表达式
      const result = math.evaluate(expression);
      
      // 格式化结果，保留适当的小数位数
      const formattedResult = typeof result === 'number' && !Number.isInteger(result)
        ? result.toFixed(6)
        : String(result);
      
      return `计算结果: ${expression} = ${formattedResult}`;
    } catch (error) {
      return `计算错误: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
};

/**
 * 文本处理工具
 * 支持大小写转换、统计、反转、替换等操作
 */
export const textProcessorTool: Tool = {
  name: 'text_processor',
  description: '处理文本，支持大小写转换、统计、反转、替换等操作',
  parameters: {
    action: {
      type: 'string',
      description: '操作类型: uppercase(转大写), lowercase(转小写), count(统计), reverse(反转), replace(替换)',
      required: true
    },
    text: {
      type: 'string',
      description: '要处理的文本',
      required: true
    },
    search: {
      type: 'string',
      description: '替换操作时搜索的字符串',
      required: false
    },
    replace: {
      type: 'string',
      description: '替换操作时替换的字符串',
      required: false
    }
  },
  execute: async (params) => {
    const { action, text, search, replace } = params;
    
    switch (action) {
      case 'uppercase':
        return text.toUpperCase();
        
      case 'lowercase':
        return text.toLowerCase();
        
      case 'count':
        const chars = text.length;
        const words = text.trim().split(/\s+/).length;
        const lines = text.split('\n').length;
        return `字符数: ${chars}, 单词数: ${words}, 行数: ${lines}`;
        
      case 'reverse':
        return text.split('').reverse().join('');
        
      case 'replace':
        if (!search || replace === undefined) {
          return '错误: replace操作需要search和replace参数';
        }
        // 使用全局替换
        const result = text.split(search).join(replace);
        return `替换结果: ${result}`;
        
      default:
        return `未知操作: ${action}。支持的操作: uppercase, lowercase, count, reverse, replace`;
    }
  }
};

/**
 * 时间工具
 * 获取当前时间，支持时区转换
 */
export const currentTimeTool: Tool = {
  name: 'current_time',
  description: '获取当前时间和日期，支持时区转换',
  parameters: {
    timezone: {
      type: 'string',
      description: '时区，例如 "Asia/Shanghai", "America/New_York", "Europe/London"。默认为本地时区',
      required: false
    },
    format: {
      type: 'string',
      description: '输出格式: full(完整), date(仅日期), time(仅时间)',
      required: false
    }
  },
  execute: async (params) => {
    const now = new Date();
    const timezone = params.timezone;
    const format = params.format || 'full';
    
    try {
      if (timezone) {
        // 使用Intl.DateTimeFormat进行时区转换
        const options: Intl.DateTimeFormatOptions = {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        };
        
        if (format === 'date') {
          delete options.hour;
          delete options.minute;
          delete options.second;
        } else if (format === 'time') {
          delete options.year;
          delete options.month;
          delete options.day;
        }
        
        const formatter = new Intl.DateTimeFormat('zh-CN', options);
        const formatted = formatter.format(now);
        
        if (timezone) {
          return `${format === 'full' ? '日期时间' : format === 'date' ? '日期' : '时间'} (${timezone}): ${formatted}`;
        }
        return formatted;
      }
      
      // 本地时间格式
      const localFormats = {
        full: now.toLocaleString('zh-CN'),
        date: now.toLocaleDateString('zh-CN'),
        time: now.toLocaleTimeString('zh-CN')
      };
      
      const formatKey = format as 'full' | 'date' | 'time';
      return `当前${format === 'full' ? '时间' : format === 'date' ? '日期' : '时间'}: ${localFormats[formatKey]}`;

    } catch (error) {
      return `获取时间失败: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
};

/**
 * 网络搜索工具（模拟实现）
 * 实际使用时需要接入真实的搜索API
 */
export const webSearchTool: Tool = {
  name: 'web_search',
  description: '搜索网页信息（当前为模拟版本，实际使用需配置真实搜索API）',
  parameters: {
    query: {
      type: 'string',
      description: '搜索关键词',
      required: true
    },
    limit: {
      type: 'number',
      description: '返回结果数量，默认为3',
      required: false
    }
  },
  execute: async (params) => {
    const query = params.query;
    const limit = params.limit || 3;
    
    // 模拟搜索结果
    const mockResults = [
      {
        title: `关于"${query}"的搜索结果 1`,
        snippet: `这是关于"${query}"的第一条模拟搜索结果。在实际应用中，这里会显示真实的搜索内容。`,
        url: `https://example.com/result1`
      },
      {
        title: `关于"${query}"的搜索结果 2`,
        snippet: `这是关于"${query}"的第二条模拟搜索结果。你可以接入Google、Bing或百度等搜索API来获取真实结果。`,
        url: `https://example.com/result2`
      },
      {
        title: `关于"${query}"的搜索结果 3`,
        snippet: `这是关于"${query}"的第三条模拟搜索结果。请根据需要配置真实的搜索API。`,
        url: `https://example.com/result3`
      }
    ];
    
    const results = mockResults.slice(0, limit);
    
    let resultText = `🔍 搜索结果: "${query}"\n\n`;
    for (let i = 0; i < results.length; i++) {
      resultText += `${i + 1}. ${results[i].title}\n`;
      resultText += `   ${results[i].snippet}\n`;
      resultText += `   ${results[i].url}\n\n`;
    }
    
    resultText += '⚠️ 注意: 这是模拟搜索结果。要获取真实搜索结果，请配置真实的搜索API（如Google Custom Search、Bing Search API等）。';
    
    return resultText;
  }
};

/**
 * 单位转换工具
 */
export const unitConverterTool: Tool = {
  name: 'unit_converter',
  description: '单位转换，支持长度、重量、温度、面积、体积等单位的转换',
  parameters: {
    value: {
      type: 'number',
      description: '要转换的数值',
      required: true
    },
    from: {
      type: 'string',
      description: '源单位，例如: km, m, cm, kg, g, lb, c, f, sqm, sqft, l, ml',
      required: true
    },
    to: {
      type: 'string',
      description: '目标单位，例如: km, m, cm, kg, g, lb, c, f, sqm, sqft, l, ml',
      required: true
    }
  },
  execute: async (params) => {
    const { value, from, to } = params;
    
    // 定义转换率表
    const conversions: Record<string, Record<string, number>> = {
      // 长度转换（基准：米）
      length: {
        m: 1, km: 0.001, cm: 100, mm: 1000, in: 39.3701, ft: 3.28084, yd: 1.09361, mi: 0.000621371
      },
      // 重量转换（基准：千克）
      weight: {
        kg: 1, g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274
      },
      // 面积转换（基准：平方米）
      area: {
        sqm: 1, sqft: 10.7639, sqyd: 1.19599, acre: 0.000247105, hectare: 0.0001
      },
      // 体积转换（基准：升）
      volume: {
        l: 1, ml: 1000, gal: 0.264172, qt: 1.05669, pt: 2.11338, cup: 4.22675
      }
    };
    
    // 温度转换（特殊处理）
    if (from === 'c' && to === 'f') {
      const result = (value * 9/5) + 32;
      return `${value}°C = ${result.toFixed(2)}°F`;
    }
    if (from === 'f' && to === 'c') {
      const result = (value - 32) * 5/9;
      return `${value}°F = ${result.toFixed(2)}°C`;
    }
    
    // 查找转换类别
    let category: string | null = null;
    let fromInCategory = false;
    let toInCategory = false;
    
    for (const [cat, units] of Object.entries(conversions)) {
      if (units[from] !== undefined && units[to] !== undefined) {
        category = cat;
        fromInCategory = true;
        toInCategory = true;
        break;
      }
    }
    
    if (!category || !fromInCategory || !toInCategory) {
      return `错误: 不支持从${from}到${to}的转换。请检查单位是否正确。`;
    }
    
    const units = conversions[category];
    // 转换为基准单位，再转换为目标单位
    const inBase = value / units[from];
    const result = inBase * units[to];
    
    return `${value} ${from} = ${result.toFixed(6)} ${to}`;
  }
};

/**
 * 导出所有内置工具
 */
export const builtinTools = [
  calculatorTool,
  textProcessorTool,
  currentTimeTool,
  webSearchTool,
  unitConverterTool
];
---
title: Agent Tools
---

# Agent Tools

Tool 是 LLM 在对话中可以调用的函数。

## 注册 Tool

```typescript
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "my-plugin",
  configSchema: { type: "object", additionalProperties: false, properties: {} },

  register(api: OpenClawPluginApi) {
    api.registerTool({
      name: "my_tool",
      description: "工具描述",
      parameters: Type.Object({
        param1: Type.String({ description: "参数描述" }),
        param2: Type.Optional(Type.Number({ default: 10 }))
      }),
      async execute(_id, params) {
        // 工具逻辑
        return {
          content: [{ type: "text", text: "结果" }]
        };
      }
    });
  }
};
```

## 返回值格式

```typescript
// 文本
{ content: [{ type: "text", text: "结果文本" }] }

// 图片
{ content: [{ type: "image", data: "base64或URL" }] }

// 文件
{ content: [{ type: "file", data: "base64或URL" }] }

// 多内容
{
  content: [
    { type: "text", text: "文本结果" },
    { type: "image", data: "..." }
  ]
}
```

## 可选 Tool

对于有副作用的工具，标记为可选：

```typescript
api.registerTool(
  {
    name: "dangerous_action",
    description: "危险操作",
    parameters: Type.Object({}),
    async execute() { /* ... */ }
  },
  { optional: true }
);
```

用户需要手动启用：

```json5
{
  agents: {
    list: [{
      id: "main",
      tools: {
        allow: ["dangerous_action"]
      }
    }]
  }
}
```

## 读取配置

```typescript
api.registerTool({
  name: "my_tool",
  description: "...",
  parameters: Type.Object({}),
  async execute(_id, params) {
    const apiKey = api.runtime.getConfig("apiKey");
    const timeout = api.runtime.getConfig("timeout") ?? 5000;
    
    if (!apiKey) {
      return { content: [{ type: "text", text: "请配置 API Key" }] };
    }
    
    // 使用配置
  }
});
```

## 日志

```typescript
api.runtime.log("debug", "调试信息");
api.runtime.log("info", "一般信息");
api.runtime.log("warn", "警告");
api.runtime.log("error", "错误");
```

## 完整示例

```typescript
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "weather",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: { apiKey: { type: "string" } }
  },

  register(api: OpenClawPluginApi) {
    api.registerTool({
      name: "get_weather",
      description: "查询城市天气",
      parameters: Type.Object({
        city: Type.String({ description: "城市名称" }),
        unit: Type.Optional(
          Type.Union([Type.Literal("celsius"), Type.Literal("fahrenheit")], { default: "celsius" })
        )
      }),

      async execute(_id, params) {
        const apiKey = api.runtime.getConfig("apiKey");
        
        if (!apiKey) {
          return { content: [{ type: "text", text: "请先配置 API Key" }] };
        }

        try {
          // 调用 API
          const weather = { temp: 25, condition: "晴" };
          
          return {
            content: [{
              type: "text",
              text: `${params.city}：${weather.condition}，${weather.temp}°${params.unit === "fahrenheit" ? "F" : "C"}`
            }]
          };
        } catch (error) {
          return { content: [{ type: "text", text: `错误：${error}` }] };
        }
      }
    });
  }
};

export default plugin;
```

## 下一步

- [Hooks](./hooks.md) - 添加事件驱动逻辑
- [TypeBox](./typebox.md) - 详细类型定义

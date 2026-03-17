---
title: Hooks
---

# Hooks

Hooks 提供事件驱动的自动化能力。

## 两种 Hook 系统

| 系统 | 说明 |
|------|------|
| **Internal Hooks** | 独立脚本，响应命令和生命周期事件 |
| **Plugin Hooks** | 插件内的扩展点，嵌入 Agent/Tool 生命周期 |

## 注册 Hook

### api.registerHook()

注册事件驱动的 Hook：

```typescript
api.registerHook(
  "command:new",
  async (event) => {
    console.log("收到 /new 命令:", event.sessionKey);
    event.messages.push("✨ Hook 执行了！");
  },
  {
    name: "my-plugin.command-new",
    description: "新会话时执行"
  }
);
```

### 事件类型

#### 命令事件

| 事件 | 说明 |
|------|------|
| `command` | 所有命令 |
| `command:new` | /new |
| `command:reset` | /reset |
| `command:stop` | /stop |

#### 会话事件

| 事件 | 说明 |
|------|------|
| `session:compact:before` | 压缩前 |
| `session:compact:after` | 压缩后 |

#### Agent 事件

| 事件 | 说明 |
|------|------|
| `agent:bootstrap` | Bootstrap 前 |

#### Gateway 事件

| 事件 | 说明 |
|------|------|
| `gateway:startup` | 启动后 |

#### 消息事件

| 事件 | 说明 |
|------|------|
| `message` | 所有消息 |
| `message:received` | 收到消息 |
| `message:transcribed` | 转录完成 |
| `message:preprocessed` | 预处理完成 |
| `message:sent` | 发送成功 |

## Agent 生命周期 Hooks

### api.on()

注册类型化的生命周期 Hook：

```typescript
api.on(
  "before_prompt_build",
  (event, ctx) => {
    return {
      prependSystemContext: "遵循公司风格指南。"
    };
  },
  { priority: 10 }
);
```

### 重要 Hooks

| Hook | 说明 |
|------|------|
| `before_model_resolve` | Session 加载前（可修改 model/provider） |
| `before_prompt_build` | Session 加载后（可修改 prompt） |
| `before_agent_start` | 兼容旧版 |

### 返回值字段

```typescript
{
  prependContext: "用户提示前缀",
  systemPrompt: "完全覆盖系统提示",
  prependSystemContext: "系统提示前缀",
  appendSystemContext: "系统提示后缀"
}
```

## Tool Result Hook

在 Tool 结果写入前转换：

```typescript
api.on("tool_result_persist", (event, ctx) => {
  // 修改或过滤结果
  return ctx.toolResult;
});
```

## 消息 Hooks

```typescript
// 收到消息
api.on("message_received", (event, ctx) => {
  console.log("收到:", ctx.content);
});

// 发送前
api.on("message_sending", (event, ctx) => {
  ctx.content = ctx.content + "\n\n-- Sent via My Plugin";
});

// 发送后
api.on("message_sent", (event, ctx) => {
  console.log("已发送:", ctx.messageId);
});
```

### 消息上下文

```typescript
// message:received
{
  from: string,
  content: string,
  timestamp?: number,
  channelId: string,
  accountId?: string,
  conversationId?: string,
  messageId?: string,
  metadata?: object
}

// message:sent
{
  to: string,
  content: string,
  success: boolean,
  error?: string,
  channelId: string,
  messageId?: string,
  isGroup?: boolean
}
```

## 禁用提示注入

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        hooks: {
          allowPromptInjection: false
        }
      }
    }
  }
}
```

## 完整示例

```typescript
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "advanced-plugin",
  configSchema: { type: "object", additionalProperties: false, properties: {} },

  async register(api: OpenClawPluginApi) {
    // 1. 注册 Tool
    api.registerTool({
      name: "query",
      description: "查询数据",
      parameters: Type.Object({ key: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: `查询: ${params.key}` }] };
      }
    });

    // 2. 注册命令 Hook
    api.registerHook("command:new", async (event) => {
      api.runtime.log("info", "新会话: " + event.sessionKey);
    }, { name: "advanced.on-new", description: "新会话时记录" });

    // 3. 注册消息 Hook
    api.on("message_received", (event, ctx) => {
      if (ctx.content.startsWith("!")) {
        event.messages.push("收到命令");
      }
    });

    // 4. 注册 Prompt Hook
    api.on("before_prompt_build", () => {
      return { prependSystemContext: "\n\n注意：使用高级插件。" };
    });

    // 5. 注册 Tool Result Hook
    api.on("tool_result_persist", (event, ctx) => {
      return ctx.toolResult;
    });
  }
};

export default plugin;
```

## CLI 管理

```bash
openclaw hooks list
openclaw hooks info my-hook
openclaw hooks enable my-hook
openclaw hooks disable my-hook
```

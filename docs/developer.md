---
summary: "手把手教你开发 OpenClaw 插件：从零创建到安装使用"
read_when:
  - 你想开发自己的 OpenClaw 插件
  - 你需要了解插件的完整开发流程
  - 你想基于模板快速创建新插件
title: "插件开发教程"
---

# 插件开发教程

本教程将手把手教你如何开发一个完整的 OpenClaw 插件。

## 什么是插件？

OpenClaw 插件可以扩展以下功能：

| 类型           | 说明                 | 示例                      |
| -------------- | -------------------- | ------------------------- |
| **Agent Tool** | LLM 可调用的工具函数 | 搜索网页、查询数据库      |
| **Channel**    | 聊天平台连接器       | Telegram、Feishu、Discord |
| **Provider**   | AI 模型供应商        | OpenAI、Anthropic、Azure  |
| **Skill**      | 可复用的技能模块     | 代码审查、数据分析        |

## 准备工作

### 1. 安装 Node.js

```bash
# 检查 Node 版本
node --version  # 需要 v18+
npm --version
```

### 2. 克隆插件模板

```bash
git clone https://github.com/XPDD/openclaw-plugin-base.git my-plugin
cd my-plugin
npm install
```

### 3. 目录结构

```
my-plugin/
├── openclaw.plugin.json    # 插件清单（必需）
├── package.json            # npm 配置
├── tsconfig.json           # TypeScript 配置
├── src/
│   ├── index.ts            # 插件入口
│   └── types.ts            # 类型定义
└── README.md
```

---

## 第一步：配置插件清单

`openclaw.plugin.json` 是插件的核心配置文件：

```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "description": "插件的简短描述",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "API 密钥"
      }
    }
  },
  "uiHints": {
    "properties": {
      "apiKey": {
        "label": "API Key",
        "placeholder": "请输入 API Key",
        "sensitive": true
      }
    }
  }
}
```

### 字段说明

| 字段           | 必需 | 说明                              |
| -------------- | ---- | --------------------------------- |
| `id`           | ✅   | 插件唯一标识符                    |
| `configSchema` | ✅   | JSON Schema 格式的配置定义        |
| `name`         | -    | 显示名称                          |
| `description`  | -    | 插件描述                          |
| `version`      | -    | 版本号                            |
| `uiHints`      | -    | UI 提示（标签、占位符、敏感字段） |
| `skills`       | -    | 技能目录数组                      |
| `channels`     | -    | 注册的 channel ID 数组            |
| `providers`    | -    | 注册的 provider ID 数组           |

---

## 第二步：编写插件代码

打开 `src/index.ts`，开始编写你的插件逻辑。

### 2.1 注册 Agent Tool

Tool 是 LLM 可以调用的函数。以下是一个完整示例：

```typescript
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "my-plugin",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },

  register(api: OpenClawPluginApi) {
    // 注册一个 tool
    api.registerTool({
      name: "my_echo",
      description: "回显输入的消息",

      // 使用 TypeBox 定义参数
      parameters: Type.Object({
        message: Type.String({
          description: "要回显的消息",
        }),
        uppercase: Type.Optional(
          Type.Boolean({
            description: "是否转换为大写",
            default: false,
          }),
        ),
      }),

      // 执行函数
      async execute(_id, params) {
        const text = params.uppercase ? params.message.toUpperCase() : params.message;

        return {
          content: [{ type: "text", text: `Echo: ${text}` }],
        };
      },
    });
  },
};

export default plugin;
```

#### Tool 返回值格式

```typescript
// 正确格式
return {
  content: [
    { type: "text", text: "结果文本" },
    // 或图片
    { type: "image", data: "base64编码或URL" },
    // 或文件
    { type: "file", data: "base64编码或URL" },
  ],
};
```

#### 标记为可选工具

对于有副作用的 tool，标记为可选：

```typescript
api.registerTool(
  {
    name: "dangerous_action",
    description: "危险操作",
    parameters: Type.Object({}),
    async execute() {
      /* ... */
    },
  },
  { optional: true }, // 用户必须手动启用
);
```

用户在配置中启用：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: ["dangerous_action"],
        },
      },
    ],
  },
}
```

### 2.2 读取配置

```typescript
register(api: OpenClawPluginApi) {
  const apiKey = api.runtime.getConfig('apiKey');
  const timeout = api.runtime.getConfig('timeout') ?? 5000;

  if (!apiKey) {
    api.runtime.log('warn', 'API key not configured');
  }
}
```

### 2.3 记录日志

```typescript
api.runtime.log("debug", "Debug message");
api.runtime.log("info", "Info message");
api.runtime.log("warn", "Warning message");
api.runtime.log("error", "Error message");
```

### 2.4 注册 Channel（可选）

如果你的插件连接聊天平台：

```typescript
api.registerChannel({
  plugin: {
    id: "my-channel",
    name: "My Channel",
    async connect() {
      // 建立 WebSocket 连接等
    },
    async disconnect() {
      // 清理连接
    },
    async send(chatId: string, message: any) {
      // 发送消息到平台
    },
  },
});
```

### 2.5 注册 Provider（可选）

如果你的插件提供新的 AI 模型：

```typescript
api.registerProvider({
  id: "my-provider",
  name: "My Provider",
  type: "chat", // 'chat' | 'embedding' | 'image'
  createClient: (config) => {
    return {
      chat: async (messages) => {
        // 调用 API
        return { content: "response" };
      },
    };
  },
});
```

---

## 第三步：TypeBox 参数类型

推荐使用 `@sinclair/typebox` 定义参数 schema：

```typescript
import { Type, Optional } from "@sinclair/typebox";

// 基础类型
Type.String();
Type.Number();
Type.Boolean();
Type.Object({});
Type.Array(Type.String());

// 可选参数
Optional(Type.String());

// 带默认值
Type.Number({ default: 10 });

// 枚举
Type.Union([Type.Literal("a"), Type.Literal("b")]);

// 复杂对象
Type.Object({
  name: Type.String(),
  items: Type.Array(
    Type.Object({
      id: Type.String(),
      count: Type.Number(),
    }),
  ),
});
```

---

## 第四步：构建和安装

### 构建插件

```bash
npm run build
```

这会在 `dist/` 目录生成 JavaScript 文件。

### 本地安装

```bash
openclaw plugins install ./path/to/your-plugin
```

### 配置插件

在 `openclaw.json` 中添加：

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        apiKey: "your-secret-key",
      },
    },
  },
}
```

### 启用 Tool

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: ["my_echo"], // 允许使用注册的 tool
        },
      },
    ],
  },
}
```

---

## 第五步：调试

### 查看插件状态

```bash
openclaw plugins list
```

### 验证配置

```bash
openclaw config validate
```

### 查看日志

```bash
# 查看所有日志
openclaw logs

# 过滤特定插件
openclaw logs --grep "my-plugin"

# 实时日志
openclaw logs --follow
```

### 本地开发技巧

修改代码后重新构建：

```bash
npm run build
# 然后重启 gateway
openclaw gateway restart
```

---

## 完整示例：天气查询插件

这是一个完整的插件示例，实现天气查询功能：

```typescript
// src/index.ts
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "weather",
  name: "Weather",
  description: "查询天气信息",

  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      apiKey: { type: "string" },
    },
  },

  async register(api: OpenClawPluginApi) {
    api.registerTool({
      name: "get_weather",
      description: "查询指定城市的天气",
      parameters: Type.Object({
        city: Type.String({ description: "城市名称" }),
        unit: Type.Optional(
          Type.Union([Type.Literal("celsius"), Type.Literal("fahrenheit")], { default: "celsius" }),
        ),
      }),

      async execute(_id, params) {
        const apiKey = api.runtime.getConfig("apiKey");

        if (!apiKey) {
          return {
            content: [{ type: "text", text: "请先配置 API Key" }],
          };
        }

        try {
          // 调用天气 API（示例）
          const temp = 25;
          const condition = "晴";

          return {
            content: [
              {
                type: "text",
                text: `${params.city}当前天气：${condition}，温度：${temp}°${params.unit === "fahrenheit" ? "F" : "C"}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `查询失败：${error}` }],
          };
        }
      },
    });
  },
};

export default plugin;
```

---

## 常见问题

### Q: 插件必须用 TypeScript 吗？

不是必须，但推荐。也可以用 JavaScript（去掉类型标注即可）。

### Q: 如何发布插件到 npm？

```bash
# 更新版本
npm version patch

# 构建
npm run build

# 发布
npm publish --access public
```

然后用户可以通过 `openclaw plugins install @your-org/plugin-name` 安装。

### Q: 工具名称冲突怎么办？

注册的 tool 名称不能与核心工具冲突。如果冲突，冲突的 tool 会被跳过并记录警告。

### Q: 如何处理异步操作？

所有 `execute` 函数都是异步的，使用 `async/await`：

```typescript
async execute(_id, params) {
  const result = await fetchData();
  return { content: [{ type: 'text', text: result }] };
}
```

---

## 下一步

- 查看 [Agent Tools 详解](./agent-tools.md)
- 查看 [插件清单规范](./manifest.md)
- 参考 [Feishu 插件示例](https://github.com/openclaw/openclaw/tree/main/extensions/feishu)

---

# 附录：插件 Hooks 完整指南

OpenClaw 插件可以注册 Hooks，实现事件驱动的自动化。本节详细介绍插件中可用的 Hooks。

## 6.1 两种 Hook 系统

OpenClaw 有两套 Hook 系统：

| 系统 | 说明 | 文档位置 |
|------|------|---------|
| **Internal Hooks** | 独立脚本，响应命令和生命周期事件 | [Hooks 文档](/automation/hooks) |
| **Plugin Hooks** | 插件内的扩展点，嵌入 Agent/Tool 生命周期 | 本文档 |

## 6.2 注册插件 Hooks

使用 `api.registerHook()` 在插件中注册 Hook：

```typescript
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "my-plugin",
  configSchema: { type: "object", additionalProperties: false, properties: {} },

  register(api: OpenClawPluginApi) {
    // 注册一个命令 Hook
    api.registerHook(
      "command:new",
      async (event) => {
        console.log("收到 /new 命令:", event.sessionKey);
        // 可以向用户发送消息
        event.messages.push("✨ Hook 执行了！");
      },
      {
        name: "my-plugin.command-new",
        description: "当 /new 命令执行时运行",
      },
    );
  },
};

export default plugin;
```

### Hook 事件类型

#### 命令事件

| 事件 | 说明 |
|------|------|
| `command` | 所有命令事件（通用监听器） |
| `command:new` | `/new` 命令 |
| `command:reset` | `/reset` 命令 |
| `command:stop` | `/stop` 命令 |

#### 会话事件

| 事件 | 说明 |
|------|------|
| `session:compact:before` | 压缩会话历史之前 |
| `session:compact:after` | 压缩会话历史之后 |

#### Agent 事件

| 事件 | 说明 |
|------|------|
| `agent:bootstrap` | 工作区 bootstrap 文件注入前 |

#### Gateway 事件

| 事件 | 说明 |
|------|------|
| `gateway:startup` | Gateway 启动后 |

#### 消息事件

| 事件 | 说明 |
|------|------|
| `message` | 所有消息事件 |
| `message:received` | 收到入站消息 |
| `message:transcribed` | 音频转录完成 |
| `message:preprocessed` | 消息预处理完成 |
| `message:sent` | 发送出站消息成功 |

## 6.3 Agent 生命周期 Hooks (`api.on`)

使用 `api.on()` 注册类型化的生命周期 Hook：

```typescript
api.on(
  "before_prompt_build",
  (event, ctx) => {
    return {
      prependSystemContext: "遵循公司风格指南。",
    };
  },
  { priority: 10 },
);
```

### 重要 Hooks

| Hook | 说明 | 可用上下文 |
|------|------|-----------|
| `before_model_resolve` | Session 加载前运行（`messages` 不可用） | 可修改 `modelOverride`、`providerOverride` |
| `before_prompt_build` | Session 加载后运行（`messages` 可用） | 可修改 prompt |
| `before_agent_start` | 兼容旧版 Hook | 建议使用上面两个 |

### 返回值字段

`before_prompt_build` 可返回以下字段：

| 字段 | 说明 |
|------|------|
| `prependContext` | 预置到用户提示 |
| `systemPrompt` | 完全覆盖系统提示 |
| `prependSystemContext` | 预置到系统提示 |
| `appendSystemContext` | 追加到系统提示 |

### 禁用提示注入

管理员可通过配置禁用提示注入 Hook：

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

## 6.4 Tool Result Hook

`tool_result_persist` Hook 允许在 Tool 结果写入会话记录前同步转换：

```typescript
api.on("tool_result_persist", (event, ctx) => {
  // 可以修改或过滤 tool 结果
  return {
    content: ctx.toolResult.content,
  };
});
```

## 6.5 消息 Hooks

消息生命周期 Hooks：

```typescript
// 收到消息时
api.on("message_received", (event, ctx) => {
  console.log("收到消息:", ctx.content);
});

// 消息发送前
api.on("message_sending", (event, ctx) => {
  // 可以修改待发送的消息
  ctx.content = ctx.content + "\n\n-- Sent via My Plugin";
});

// 消息发送后
api.on("message_sent", (event, ctx) => {
  console.log("消息已发送:", ctx.messageId);
});
```

### 消息事件上下文

```typescript
// message:received
{
  from: string,           // 发送者标识
  content: string,        // 消息内容
  timestamp?: number,     // Unix 时间戳
  channelId: string,      // 渠道 ID
  accountId?: string,     // 账户 ID
  conversationId?: string, // 会话 ID
  messageId?: string,     // 消息 ID
  metadata?: object       // 渠道特定元数据
}

// message:sent
{
  to: string,             // 接收者
  content: string,        // 发送的内容
  success: boolean,       // 是否成功
  error?: string,         // 错误信息
  channelId: string,
  messageId?: string,
  isGroup?: boolean,
  groupId?: string
}
```

## 6.6 完整示例：带 Hooks 的插件

```typescript
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "advanced-plugin",
  name: "Advanced Plugin",
  description: "高级插件示例，包含 Tools 和 Hooks",

  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      apiKey: { type: "string" },
      autoReply: { type: "boolean", default: false },
    },
  },

  async register(api: OpenClawPluginApi) {
    // 1. 注册 Tool
    api.registerTool({
      name: "query_data",
      description: "查询数据",
      parameters: Type.Object({
        key: Type.String({ description: "查询键名" }),
      }),
      async execute(_id, params) {
        const data = { user: "张三", count: 42 };
        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
        };
      },
    });

    // 2. 注册命令 Hook
    api.registerHook(
      "command:new",
      async (event) => {
        api.runtime.log("info", "新会话开始: " + event.sessionKey);
      },
      { name: "advanced-plugin.on-new", description: "新会话时记录日志" },
    );

    // 3. 注册消息 Hook（自动回复）
    api.on("message_received", (event, ctx) => {
      const autoReply = api.runtime.getConfig("autoReply");
      if (autoReply && ctx.content.startsWith("!")) {
        // 处理命令并添加回复
        event.messages.push("收到命令: " + ctx.content);
      }
    });

    // 4. 注册 Prompt Hook
    api.on(
      "before_prompt_build",
      (event, ctx) => {
        return {
          prependSystemContext: "\n\n注意：你正在使用高级插件。",
        };
      },
      { priority: 5 },
    );

    // 5. 注册 Tool Result Hook
    api.on("tool_result_persist", (event, ctx) => {
      // 可以记录或修改 tool 结果
      api.runtime.log("debug", "Tool 执行完成: " + ctx.toolName);
      return ctx.toolResult; // 返回原始结果
    });
  },
};

export default plugin;
```

## 6.7 Hooks 配置

在 `openclaw.json` 中配置 Hooks：

```json5
{
  hooks: {
    internal: {
      enabled: true,
      entries: {
        "my-hook": {
          enabled: true,
          env: {
            MY_VAR: "value"
          }
        }
      }
    }
  }
}
```

## 6.8 CLI 管理 Hooks

```bash
# 列出所有 Hooks
openclaw hooks list

# 查看 Hook 详情
openclaw hooks info my-hook

# 启用 Hook
openclaw hooks enable my-hook

# 禁用 Hook
openclaw hooks disable my-hook

# 检查资格
openclaw hooks check
```

---

## 参考资料

- [OpenClaw Hooks 文档](https://docs.openclaw.ai/automation/hooks)
- [Plugin Hooks 文档](https://docs.openclaw.ai/tools/plugin#plugin-hooks)
- [Agent Loop 概念](https://docs.openclaw.ai/concepts/agent-loop)
- [插件模板](https://github.com/XPDD/openclaw-plugin-base)

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

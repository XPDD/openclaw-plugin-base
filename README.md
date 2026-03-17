# OpenClaw Plugin Base

OpenClaw 插件开发基线模板。基于此模板快速开发你的 OpenClaw 插件。

## 快速开始

### 1. 克隆并初始化

```bash
# 使用此模板创建你的插件
git clone https://github.com/<your-org>/openclaw-plugin-base.git my-plugin
cd my-plugin

# 安装依赖
npm install

# 构建
npm run build
```

### 2. 自定义插件

修改以下文件：

**openclaw.plugin.json** - 插件清单
```json
{
  "id": "my-plugin",        // 改成你的插件 ID
  "name": "My Plugin",      // 插件显示名称
  "description": "...",     // 插件描述
  "configSchema": { ... }   // 配置 schema
}
```

**package.json** - 包信息
```json
{
  "name": "@openclaw/plugin-my-plugin",
  "description": "...",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

**src/index.ts** - 实现你的插件逻辑

### 3. 安装到 OpenClaw

```bash
# 本地安装
openclaw plugins install ./path/to/my-plugin

# 或从 npm 安装（发布后）
openclaw plugins install @openclaw/plugin-my-plugin
```

### 4. 配置插件

在 OpenClaw 配置中添加：

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        apiKey: "your-api-key"  // 你的配置项
      }
    }
  }
}
```

## 插件结构

```
my-plugin/
├── openclaw.plugin.json    # 插件清单（必需）
├── package.json            # npm 包配置
├── tsconfig.json           # TypeScript 配置
├── src/
│   ├── index.ts            # 插件入口
│   └── types.ts            # 类型定义
├── dist/                   # 构建输出
└── README.md
```

## 开发指南

### 注册 Agent Tools

Tool 是插件最常见的功能。使用 `registerTool` 注册：

```typescript
import { Type } from '@sinclair/typebox';

api.registerTool({
  name: 'my_tool',
  description: 'Do something useful',
  parameters: Type.Object({
    input: Type.String({ description: 'Input value' }),
    count: Type.Optional(Type.Number({ default: 1 }))
  }),
  async execute(_id, params) {
    // 实现工具逻辑
    const result = await doSomething(params.input);
    
    return {
      content: [
        { type: 'text', text: `Result: ${result}` }
      ]
    };
  }
});
```

#### 可选工具

对于有副作用或需要额外权限的工具，标记为 `optional: true`：

```typescript
api.registerTool(
  { /* tool definition */ },
  { optional: true }
);
```

用户需要在配置中显式启用：

```json5
{
  agents: {
    list: [{
      id: 'main',
      tools: {
        allow: ['my_tool']  // 显式允许
      }
    }]
  }
}
```

### 注册 Channel

Channel 用于连接聊天平台（如 Telegram、Feishu 等）：

```typescript
api.registerChannel({
  plugin: {
    id: 'my-channel',
    name: 'My Channel',
    async connect() {
      // 建立连接
    },
    async disconnect() {
      // 清理资源
    },
    async send(chatId: string, message: any) {
      // 发送消息
    }
  }
});
```

### 注册 Provider

Provider 用于接入新的 AI 模型：

```typescript
api.registerProvider({
  id: 'my-provider',
  name: 'My Provider',
  type: 'chat',  // 'chat' | 'embedding' | 'image'
  createClient: (config) => {
    // 返回客户端实例
    return new MyClient(config);
  }
});
```

### 使用配置

通过 `api.runtime.getConfig()` 读取用户配置：

```typescript
const apiKey = api.runtime.getConfig('apiKey');
const timeout = api.runtime.getConfig('timeout') ?? 5000;
```

### 日志

使用 `api.runtime.log()` 记录日志：

```typescript
api.runtime.log('info', 'Plugin loaded');
api.runtime.log('debug', 'Debug info');
api.runtime.log('warn', 'Warning message');
api.runtime.log('error', 'Error occurred');
```

## 配置 Schema

使用 JSON Schema 定义插件配置：

```typescript
configSchema: {
  type: 'object',
  additionalProperties: false,
  properties: {
    apiKey: {
      type: 'string',
      description: 'API key for the service'
    },
    timeout: {
      type: 'number',
      description: 'Request timeout in ms',
      default: 5000
    }
  },
  required: ['apiKey']
}
```

### UI Hints

为配置项提供 UI 提示（用于 Web UI）：

```json
{
  "uiHints": {
    "properties": {
      "apiKey": {
        "label": "API Key",
        "placeholder": "Enter your API key",
        "sensitive": true
      }
    }
  }
}
```

## 发布到 npm

```bash
# 更新版本号
npm version patch  # 或 minor/major

# 构建
npm run build

# 发布
npm publish --access public
```

## 调试插件

```bash
# 查看插件状态
openclaw plugins list

# 验证配置
openclaw config validate

# 查看日志
openclaw logs --grep "my-plugin"
```

## 参考资源

- [OpenClaw 插件文档](https://docs.openclaw.ai/plugins)
- [插件清单规范](https://docs.openclaw.ai/plugins/manifest)
- [Agent Tools 开发](https://docs.openclaw.ai/plugins/agent-tools)
- [示例插件：Feishu](https://github.com/openclaw/openclaw/tree/main/extensions/feishu)

## 许可证

MIT

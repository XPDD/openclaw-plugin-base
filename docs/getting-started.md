---
title: 快速开始
---

# 快速开始

本指南将帮助你创建第一个 OpenClaw 插件。

## 准备工作

### 1. 安装 Node.js

```bash
node --version  # 需要 v18+
```

### 2. 克隆模板

```bash
git clone https://github.com/XPDD/openclaw-plugin-base.git my-plugin
cd my-plugin
npm install
```

## 目录结构

```
my-plugin/
├── openclaw.plugin.json    # 插件清单（必需）
├── package.json            # npm 配置
├── tsconfig.json           # TypeScript 配置
├── src/
│   ├── index.ts            # 插件入口
│   └── types.ts            # 类型定义
├── docs/                   # 文档
└── README.md
```

## 第一步：配置清单

编辑 `openclaw.plugin.json`：

```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "description": "插件描述",
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
  }
}
```

## 第二步：编写代码

编辑 `src/index.ts`：

```typescript
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "my-plugin",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {}
  },

  register(api: OpenClawPluginApi) {
    // 注册一个 Tool
    api.registerTool({
      name: "hello",
      description: "打招呼",
      parameters: Type.Object({
        name: Type.String({ description: "名字" })
      }),
      async execute(_id, params) {
        return {
          content: [{ type: "text", text: `你好，${params.name}！` }]
        };
      }
    });
  }
};

export default plugin;
```

## 第三步：构建安装

```bash
npm run build
openclaw plugins install ./my-plugin
```

## 第四步：配置使用

在 `openclaw.json` 中启用 Tool：

```json5
{
  agents: {
    list: [{
      id: "main",
      tools: {
        allow: ["hello"]
      }
    }]
  }
}
```

## 下一步

- [Agent Tools](./agent-tools.md) - 学习注册更多工具
- [Hooks](./hooks.md) - 添加事件驱动逻辑
- [Channels](./channels.md) - 连接聊天平台

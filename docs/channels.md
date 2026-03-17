---
title: Channels
---

# Channels

Channel 插件用于连接聊天平台（如 Telegram、Feishu、Discord 等）。

## 注册 Channel

```typescript
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "my-channel-plugin",
  configSchema: { type: "object", additionalProperties: false, properties: {} },

  register(api: OpenClawPluginApi) {
    api.registerChannel({
      plugin: {
        id: "my-channel",
        name: "My Channel",
        
        async connect() {
          // 建立连接（WebSocket、轮询等）
          api.runtime.log("info", "连接中...");
        },
        
        async disconnect() {
          // 清理连接
          api.runtime.log("info", "已断开");
        },
        
        async send(chatId: string, message: any) {
          // 发送消息到平台
          console.log(`发送消息到 ${chatId}:`, message);
        }
      }
    });
  }
};
```

## Channel 接口

```typescript
interface ChannelPlugin {
  id: string;
  name: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  send: (chatId: string, message: any) => Promise<void>;
}
```

## 消息格式

### 文本消息

```typescript
await send(chatId, {
  type: "text",
  content: "Hello!"
});
```

### 图片消息

```typescript
await send(chatId, {
  type: "image",
  url: "https://example.com/image.jpg"
});
```

### 卡片消息

```typescript
await send(chatId, {
  type: "card",
  content: {
    header: { title: "标题" },
    elements: [{ text: "内容" }]
  }
});
```

## 接收消息

在 manifest 中声明 channel：

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": { ... }
}
```

## 完整示例

```typescript
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "telegram-custom",
  channels: ["telegram"],
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      botToken: { type: "string" }
    }
  },

  register(api: OpenClawPluginApi) {
    let bot: any = null;

    api.registerChannel({
      plugin: {
        id: "telegram-custom",
        name: "Custom Telegram",
        
        async connect() {
          const token = api.runtime.getConfig("botToken");
          if (!token) throw new Error("需要配置 botToken");
          
          // 初始化 bot
          bot = { token, me: "mybot" };
          api.runtime.log("info", "Telegram bot 已连接");
        },
        
        async disconnect() {
          bot = null;
          api.runtime.log("info", "Telegram bot 已断开");
        },
        
        async send(chatId: string, message: any) {
          if (!bot) throw new Error("Bot 未连接");
          
          // 发送逻辑
          console.log(`发送至 ${chatId}:`, message);
        }
      }
    });
  }
};

export default plugin;
```

## 参考

- [Feishu 插件示例](https://github.com/openclaw/openclaw/tree/main/extensions/feishu)
- [Telegram SDK](https://github.com/gram-js/gramjs)

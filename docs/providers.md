---
title: Providers
---

# Providers

Provider 插件用于接入新的 AI 模型。

## 注册 Provider

```typescript
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "my-provider",
  configSchema: { type: "object", additionalProperties: false, properties: {} },

  register(api: OpenClawPluginApi) {
    api.registerProvider({
      id: "my-provider",
      name: "My Provider",
      type: "chat",  // 'chat' | 'embedding' | 'image'
      
      createClient: (config) => {
        return {
          chat: async (messages, options) => {
            // 调用 API
            return {
              content: "回复内容",
              usage: { input: 10, output: 20 }
            };
          }
        };
      }
    });
  }
};
```

## Provider 类型

| 类型 | 说明 | 方法 |
|------|------|------|
| `chat` | 对话模型 | `chat(messages, options)` |
| `embedding` | 向量模型 | `embed(texts)` |
| `image` | 图像生成 | `generate(prompt)` |

## 完整示例

```typescript
import type { OpenClawPluginApi } from "./types.js";

interface MyClient {
  chat(messages: any[], options?: any): Promise<any>;
  embed(texts: string[]): Promise<number[][]>;
}

const plugin = {
  id: "custom-ai",
  providers: ["custom-ai"],
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      apiKey: { type: "string" },
      baseUrl: { type: "string" }
    }
  },

  register(api: OpenClawPluginApi) {
    api.registerProvider({
      id: "custom-ai",
      name: "Custom AI",
      type: "chat",
      
      createClient: (config): MyClient => {
        const apiKey = config.apiKey;
        const baseUrl = config.baseUrl || "https://api.example.com";
        
        return {
          async chat(messages, options = {}) {
            const response = await fetch(`${baseUrl}/chat/completions`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: options.model || "default",
                messages,
                temperature: options.temperature,
                max_tokens: options.maxTokens
              })
            });
            
            const data = await response.json();
            return {
              content: data.choices?.[0]?.message?.content || "",
              usage: data.usage || { input: 0, output: 0 }
            };
          },
          
          async embed(texts) {
            const response = await fetch(`${baseUrl}/embeddings`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "embedding-model",
                input: texts
              })
            });
            
            const data = await response.json();
            return data.data?.map((e: any) => e.embedding) || [];
          }
        };
      }
    });
  }
};

export default plugin;
```

## 使用 Provider

在 `openclaw.json` 中配置：

```json5
{
  providers: {
    list: [
      {
        id: "custom-ai",
        provider: "custom-ai",
        apiKey: "your-key"
      }
    ]
  },
  
  agents: {
    list: [{
      id: "main",
      model: "custom-ai:gpt-4"
    }]
  }
}
```

## 注册 Auth 流程

可以让用户通过 CLI 登录：

```typescript
api.registerProvider({
  id: "my-provider",
  name: "My Provider",
  type: "chat",
  
  // 注册 auth 方法
  auth: {
    methods: {
      apiKey: {
        label: "API Key",
        async verify(apiKey) {
          // 验证 API key 是否有效
          return { valid: true };
        }
      }
    }
  },
  
  createClient: (config) => { /* ... */ }
});
```

用户执行：

```bash
openclaw models auth login --provider my-provider
```

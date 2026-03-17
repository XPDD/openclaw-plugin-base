---
title: 插件清单
---

# 插件清单 (openclaw.plugin.json)

每个插件必须包含 `openclaw.plugin.json` 文件，位于插件根目录。

## 必需字段

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 插件唯一标识符 |
| `configSchema` | object | JSON Schema 配置定义 |

## 可选字段

```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "description": "插件描述",
  "version": "0.1.0",
  "kind": "memory",
  "channels": ["telegram", "feishu"],
  "providers": ["openai"],
  "skills": ["./skills"],
  "configSchema": { ... },
  "uiHints": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 显示名称 |
| `description` | string | 插件描述 |
| `version` | string | 版本号 |
| `kind` | string | 插件类型 (memory, context-engine) |
| `channels` | array | 注册的 channel ID |
| `providers` | array | 注册的 provider ID |
| `skills` | array | 技能目录数组 |
| `uiHints` | object | UI 提示配置 |

## 配置 Schema

使用 JSON Schema 定义配置：

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "API 密钥"
      },
      "timeout": {
        "type": "number",
        "description": "超时时间(ms)",
        "default": 5000
      },
      "enabled": {
        "type": "boolean",
        "default": true
      }
    },
    "required": ["apiKey"]
  }
}
```

## UI 提示

为配置项提供 UI 提示：

```json
{
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

| 属性 | 说明 |
|------|------|
| `label` | 显示标签 |
| `placeholder` | 占位符 |
| `sensitive` | 是否敏感（隐藏显示） |

## 完整示例

```json
{
  "id": "weather",
  "name": "天气查询",
  "description": "查询城市天气信息",
  "version": "1.0.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "天气 API 密钥"
      },
      "defaultUnit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "default": "celsius"
      }
    },
    "required": ["apiKey"]
  },
  "uiHints": {
    "properties": {
      "apiKey": {
        "label": "API Key",
        "placeholder": "输入天气API密钥",
        "sensitive": true
      }
    }
  }
}
```

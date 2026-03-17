---
title: Skill 与 CLI 集成开发指南
---

# Skill 与 CLI 集成开发指南

本文档介绍如何开发可集成的 Skill，包含 CLI 命令、自动化安装、配置和斜杠命令。

## 概述

Skill 是 OpenClaw 的能力模块，可以通过以下方式调用：

| 调用方式 | 说明 | 示例 |
|----------|------|------|
| **/斜杠命令** | 用户在聊天中输入 | `/skill weather` |
| **自然语言** | 让 AI 自动选择 | "帮我查一下天气" |
| **CLI 命令** | 终端手动执行 | `clawhub install xxx` |

## 1. Skill 基础结构

### 目录结构

```
my-skill/
├── SKILL.md           # 必需：技能定义
├── skills.yaml        # 可选：配置文件
├── scripts/           # 可选：脚本
└── README.md          # 可选：文档
```

### SKILL.md 格式

```markdown
---
name: my_skill
description: "技能简短描述"
metadata:
  {
    "openclaw": {
      "emoji": "⚡",
      "skillKey": "my-skill",
      "requires": {
        "bins": ["my-cli"],
        "env": ["API_KEY"],
        "config": ["plugins.my-plugin.enabled"]
      },
      "primaryEnv": "API_KEY",
      "user-invocable": true,
      "command-dispatch": "tool",
      "command-tool": "my_skill_execute"
    }
  }
---

# My Skill

详细技能说明...

## 使用方法

当用户请求时使用此技能。

## 示例

```
用户: 执行 my-skill
Agent: (调用工具)
```
```

## 2. CLI 工具开发

Skill 通常依赖 CLI 工具。以下是开发集成方案：

### 2.1 创建 CLI 工具

创建一个可执行 CLI 工具：

```typescript
// src/index.ts
#!/usr/bin/env node

interface Args {
  _: string[];
  city?: string;
  unit?: string;
}

function parseArgs(): Args {
  const args: Args = { _: [] };
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      (args as any)[key] = value || true;
    } else if (arg.startsWith("-")) {
      (args as any)[arg.slice(1)] = true;
    } else {
      args._.push(arg);
    }
  });
  return args;
}

async function main() {
  const args = parseArgs();
  const command = args._[0];

  switch (command) {
    case "query":
      await queryWeather(args.city || "beijing", args.unit || "celsius");
      break;
    case "list":
      console.log("支持的城市: 北京, 上海, 广州, 深圳");
      break;
    default:
      console.log("用法: weather <command> [options]");
      console.log("命令: query, list");
      process.exit(1);
  }
}

async function queryWeather(city: string, unit: string) {
  const data = { beijing: { temp: 25, condition: "晴" } };
  const weather = data[city as keyof typeof data] || { temp: 20, condition: "未知" };
  const temp = unit === "fahrenheit" ? (weather.temp * 9) / 5 + 32 : weather.temp;
  const unitLabel = unit === "fahrenheit" ? "F" : "C";
  console.log(`${city}: ${weather.condition}, ${temp}°${unitLabel}`);
}

main();
```

### 2.2 发布 CLI 到 npm

```json
{
  "name": "weather-cli",
  "version": "1.0.0",
  "bin": {
    "weather": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@sinclair/typebox": "^0.34.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  }
}
```

发布：

```bash
npm publish --access public
```

### 2.3 Skill 中声明 CLI 依赖

```markdown
---
name: weather
description: "查询城市天气"
metadata:
  {
    "openclaw": {
      "emoji": "🌤️",
      "skillKey": "weather",
      "requires": {
        "bins": ["weather-cli"]
      },
      "install": [
        {
          "id": "npm",
          "kind": "npm",
          "package": "weather-cli",
          "bins": ["weather"],
          "label": "Install weather CLI (npm)"
        }
      ]
    }
  }
---

# Weather Skill

查询城市天气信息。

## CLI 命令

- `weather query <城市>` - 查询天气
- `weather list` - 可用城市列表

## 示例

```
用户: 北京天气怎么样？
Agent: (调用 weather query 北京)
```
```

## 3. 自动化安装

### 3.1 ClawHub 发布

```bash
# 安装 ClawHub CLI
npm i -g clawhub

# 登录
clawhub login

# 发布技能
clawhub publish ./weather-skill \
  --slug weather \
  --name "Weather Query" \
  --version 1.0.0 \
  --tags latest
```

### 3.2 用户安装

```bash
# 搜索
clawhub search weather

# 安装
clawhub install weather

# 更新
clawhub update weather
clawhub update --all
```

### 3.3 安装配置

```json5
{
  skills: {
    entries: {
      weather: {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "WEATHER_API_KEY" },
        env: {
          WEATHER_API_KEY: "your-key-here"
        },
        config: {
          defaultUnit: "celsius"
        }
      }
    }
  }
}
```

## 4. 斜杠命令集成

### 4.1 注册斜杠命令

Skill 可以注册为斜杠命令：

```typescript
// 在插件中
api.registerCommand({
  name: "weather",
  description: "查询天气（输入城市名）",
  acceptsArgs: true,
  handler: async (ctx) => {
    const city = ctx.args?.trim();
    if (!city) {
      return { text: "请输入城市名，如：/weather 北京" };
    }
    
    const result = await queryWeather(city);
    return { text: result };
  }
});
```

### 4.2 Skill 中配置命令

```markdown
---
name: weather
description: "天气查询"
metadata:
  {
    "openclaw": {
      "emoji": "🌤️",
      "user-invocable": true,
      "command-dispatch": "tool",
      "command-tool": "weather_execute"
    }
  }
---

# Weather Skill

## 使用方式

- 斜杠命令: `/weather <城市>`
- 自然语言: "北京天气怎么样"
```

### 4.3 命令参数模式

| 模式 | 说明 | 配置 |
|------|------|------|
| `raw` | 原始字符串参数 | `command-arg-mode: raw` |
| `parsed` | 解析后参数 | 默认 |

```markdown
metadata:
  {
    "openclaw": {
      "command-dispatch": "tool",
      "command-tool": "weather_execute",
      "command-arg-mode": "raw"
    }
  }
```

工具接收格式：

```typescript
{
  command: "北京",
  commandName: "weather",
  skillName: "weather"
}
```

## 5. 完整示例：天气 Skill

### 5.1 目录结构

```
weather-skill/
├── SKILL.md
├── package.json
├── src/
│   └── index.ts
└── README.md
```

### 5.2 SKILL.md

```markdown
---
name: weather
description: "查询城市天气信息"
metadata:
  {
    "openclaw": {
      "emoji": "🌤️",
      "skillKey": "weather",
      "requires": {
        "bins": ["weather"]
      },
      "user-invocable": true,
      "command-dispatch": "tool",
      "command-tool": "weather_execute",
      "install": [
        {
          "id": "npm",
          "kind": "npm",
          "package": "@myorg/weather-cli",
          "bins": ["weather"],
          "label": "Install weather CLI"
        }
      ]
    }
  }
---

# Weather Skill

查询城市天气信息。

## 使用方法

1. 斜杠命令: `/weather <城市>`
2. 自然语言: "北京今天天气怎么样"

## CLI

```bash
weather query <城市> [--unit=celsius|fahrenheit]
weather list
```

## 配置

需要配置 WEATHER_API_KEY 环境变量。
```

### 5.3 插件代码

```typescript
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "weather",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      apiKey: { type: "string" },
      defaultUnit: { type: "string", enum: ["celsius", "fahrenheit"] }
    }
  },

  register(api: OpenClawPluginApi) {
    // 1. 注册 Tool
    api.registerTool({
      name: "weather_execute",
      description: "执行天气查询",
      parameters: Type.Object({
        command: Type.String({ description: "原始命令参数" }),
        commandName: Type.String(),
        skillName: Type.String()
      }),
      async execute(_id, params) {
        const city = params.command?.trim() || "beijing";
        const unit = api.runtime.getConfig("defaultUnit") || "celsius";
        
        // 调用 CLI
        const { execSync } = await import("child_process");
        try {
          const result = execSync(
            `weather query ${city} --unit=${unit}`,
            { encoding: "utf-8" }
          );
          return { content: [{ type: "text", text: result }] };
        } catch (error) {
          return { content: [{ type: "text", text: `查询失败: ${error}` }] };
        }
      }
    });

    // 2. 注册斜杠命令
    api.registerCommand({
      name: "weather",
      description: "查询天气",
      acceptsArgs: true,
      handler: async (ctx) => {
        const city = ctx.args?.trim();
        if (!city) {
          return { text: "用法: /weather <城市>\n示例: /weather 北京" };
        }
        
        const unit = api.runtime.getConfig("defaultUnit") || "celsius";
        return { text: `正在查询 ${city} 的天气...` };
      }
    });
  }
};

export default plugin;
```

### 5.4 发布到 ClawHub

```bash
# 初始化
clawhub login

# 发布
clawhub publish ./weather-skill \
  --slug weather \
  --name "Weather Query" \
  --version 1.0.0 \
  --tags latest
```

## 6. 配置参考

### 6.1 Skill 配置

```json5
{
  skills: {
    entries: {
      "weather": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "WEATHER_API_KEY" },
        env: {
          WEATHER_API_KEY: "sk-xxx"
        },
        config: {
          defaultUnit: "celsius"
        }
      }
    },
    load: {
      watch: true,
      watchDebounceMs: 250
    }
  }
}
```

### 6.2 命令配置

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    allowFrom: {
      "*": ["user1"]
    }
  }
}
```

## 7. CLI vs 斜杠命令 vs Tool

| 特性 | CLI | 斜杠命令 | Tool |
|------|-----|---------|------|
| 调用方式 | 终端 | 聊天 `/cmd` | AI 自动调用 |
| 执行环境 | 主机 | Gateway | 沙盒 |
| 用户交互 | 手动 | 自动 | 自动 |
| 场景 | 脚本/自动化 | 快速操作 | 复杂任务 |

## 8. 参考

- [Skills 文档](https://docs.openclaw.ai/tools/skills)
- [Slash Commands](https://docs.openclaw.ai/tools/slash-commands)
- [ClawHub](https://docs.openclaw.ai/tools/clawhub)
- [Creating Skills](https://docs.openclaw.ai/tools/creating-skills)

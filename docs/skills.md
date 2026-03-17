---
title: Skills
---

# Skills

Skill 是可复用的能力模块，让 Agent 执行特定任务。

## 什么是 Skill？

Skill 是一个目录，包含：
- `SKILL.md` - 提供指令和工具定义
- 可选的脚本或资源文件

## 在插件中注册 Skill

### 1. 创建 Skill 目录

在插件中创建 skills 目录：

```
my-plugin/
├── openclaw.plugin.json
├── skills/
│   └── my-skill/
│       └── SKILL.md
└── src/
    └── index.ts
```

### 2. 编写 SKILL.md

```markdown
---
name: my_skill
description: "我的技能描述"
metadata:
  {
    "openclaw": {
      "emoji": "⚡",
      "skillKey": "my-skill",
      "requires": { "config": ["plugins.entries.my-plugin.enabled"] }
    }
  }
---

# My Skill

使用此技能执行特定任务。

## 触发方式

当用户提及相关关键词时自动触发。

## 使用工具

- 使用 `bash` 执行命令
- 使用 `browser` 浏览网页
- 使用自定义工具
```

### 3. 在 manifest 中声明

```json
{
  "id": "my-plugin",
  "skills": ["./skills/my-skill"],
  "configSchema": { ... }
}
```

### 4. 插件中加载

```typescript
const plugin = {
  id: "my-plugin",
  configSchema: { type: "object", additionalProperties: false, properties: {} },
  
  async register(api: OpenClawPluginApi) {
    // 注册工具
    api.registerTool({ ... });
    
    // Skills 通过 manifest 自动加载
  }
};
```

## SKILL.md 格式

### Frontmatter

```yaml
---
name: skill_name
description: 技能描述
metadata:
  {
    "openclaw": {
      "emoji": "⚡",
      "skillKey": "skill-key",
      "requires": {
        "config": ["plugins.entries.my-plugin.enabled"],
        "bins": ["git"],
        "env": ["API_KEY"]
      }
    }
  }
---
```

### metadata 字段

| 字段 | 说明 |
|------|------|
| `emoji` | 显示图标 |
| `skillKey` | 技能唯一标识 |
| `requires.config` | 依赖的插件配置 |
| `requires.bins` | 依赖的系统命令 |
| `requires.env` | 依赖的环境变量 |
| `requires.os` | 依赖的操作系统 |

### 内容部分

```markdown
# 技能名称

## 简介

技能说明...

## 使用场景

- 场景1
- 场景2

## 示例

```
用户: xxx
Agent: xxx
```

## 注意事项

- 注意事项1
```

## 完整示例

### 目录结构

```
my-plugin/
├── openclaw.plugin.json
├── skills/
│   └── weather/
│       └── SKILL.md
└── src/
    └── index.ts
```

### openclaw.plugin.json

```json
{
  "id": "weather",
  "name": "天气查询",
  "skills": ["./skills/weather"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" }
    }
  }
}
```

### skills/weather/SKILL.md

```markdown
---
name: weather
description: "查询城市天气信息"
metadata:
  {
    "openclaw": {
      "emoji": "🌤️",
      "skillKey": "weather",
      "requires": { "config": ["plugins.entries.weather.enabled"] }
    }
  }
---

# 天气查询技能

当用户询问天气时使用此技能。

## 触发条件

用户说"天气"、"温度"、"下雨"等关键词。

## 使用工具

使用 `get_weather` 工具查询天气：

- city: 城市名称
- unit: 摄氏度或华氏度

## 示例对话

```
用户: 北京今天天气怎么样？
Agent: 让我查一下北京今天的天气...
(get_weather 工具)
Agent: 北京今天天气晴朗，气温 25°C。
```

## 配置要求

需要在 openclaw.json 中配置：

```json
{
  "plugins": {
    "entries": {
      "weather": {
        "config": {
          "apiKey": "your-api-key"
        }
      }
    }
  }
}
```
```

## 工作区 Skills

除了插件，Skills 也可以放在工作区：

```
~/.openclaw/workspace/skills/
└── my-skill/
    └── SKILL.md
```

## CLI 命令

```bash
# 列出所有 Skills
openclaw skills list

# 查看 Skill 详情
openclaw skills info my-skill
```

## 参考

- [Voice Call Skill 示例](https://github.com/openclaw/openclaw/tree/main/skills/voice-call)
- [Creating Skills 文档](https://docs.openclaw.ai/tools/creating-skills)

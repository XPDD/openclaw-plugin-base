# OpenClaw 插件开发文档

欢迎使用 OpenClaw 插件开发指南。本文档按主题分类，帮助你快速找到所需内容。

## 📚 文档目录

### 快速开始

- [快速开始](./getting-started.md) - 从零创建第一个插件
- [插件模板](https://github.com/XPDD/openclaw-plugin-base) - 基线模板仓库

### 核心功能

- [插件清单](./manifest.md) - `openclaw.plugin.json` 配置详解
- [Agent Tools](./agent-tools.md) - 注册 LLM 可调用的工具
- [Hooks](./hooks.md) - 事件驱动的自动化
- [Skills](./skills.md) - 注册可复用技能模块
- [Skill CLI 集成](./skill-cli.md) - Skill 与 CLI/斜杠命令集成
- [CLI](./cli.md) - 注册命令行命令
- [Channels](./channels.md) - 连接聊天平台
- [Providers](./providers.md) - 接入 AI 模型

### 配置参考

- [TypeBox 类型定义](./typebox.md) - 参数 schema 定义
- [配置文件示例](./config.md) - openclaw.json 配置

## 🚀 快速开始

```bash
# 1. 克隆模板
git clone https://github.com/XPDD/openclaw-plugin-base.git my-plugin
cd my-plugin

# 2. 修改配置
# 编辑 openclaw.plugin.json

# 3. 编写代码
# 编辑 src/index.ts

# 4. 构建安装
npm run build
openclaw plugins install ./my-plugin
```

## 📦 示例插件

参考现有插件实现：

- [Feishu 插件](https://github.com/openclaw/openclaw/tree/main/extensions/feishu) - 完整的 Channel + Tools + Hooks 示例

## 🔗 相关链接

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [插件开发教程](https://docs.openclaw.ai/plugins/developer)
- [Hooks 系统](https://docs.openclaw.ai/automation/hooks)

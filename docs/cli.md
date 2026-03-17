---
title: CLI 命令
---

# CLI 命令

插件可以注册 CLI 命令，让用户通过 `openclaw <command>` 或 `/command` 调用。

## 注册 CLI 命令

### api.registerCli()

注册顶层命令，通过 `openclaw <command>` 调用：

```typescript
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "my-plugin",
  configSchema: { type: "object", additionalProperties: false, properties: {} },

  register(api: OpenClawPluginApi) {
    api.registerCli(
      ({ program }) => {
        // 注册 mycmd 命令
        program
          .command("mycmd")
          .description("我的命令")
          .option("-n, --name <name>", "名称")
          .action((options) => {
            console.log("执行命令:", options.name);
          });
      },
      { commands: ["mycmd"] }
    );
  }
};
```

### 使用子命令

```typescript
api.registerCli(
  ({ program }) => {
    // 主命令
    const myCmd = program
      .command("weather")
      .description("天气查询");

    // 子命令
    myCmd
      .command("query <city>")
      .description("查询城市天气")
      .action((city) => {
        console.log("查询:", city);
      });

    // 子命令
    myCmd
      .command("list")
      .description("可查询的城市列表")
      .action(() => {
        console.log("北京、上海、广州...");
      });
  },
  { commands: ["weather"] }
);
```

用户调用：

```bash
openclaw weather query 北京
openclaw weather list
```

## 注册自动回复命令

### api.registerCommand()

注册斜杠命令（无需调用 AI）：

```typescript
api.registerCommand({
  name: "mystatus",
  description: "显示插件状态",
  handler: (ctx) => ({
    text: `插件运行中！渠道: ${ctx.channel}`
  })
});
```

用户发送 `/mystatus` 即可触发。

### 命令上下文

```typescript
handler: (ctx) => {
  // ctx.senderId - 发送者 ID
  // ctx.channel - 渠道
  // ctx.isAuthorizedSender - 是否授权用户
  // ctx.args - 命令参数
  // ctx.commandBody - 完整命令文本
  // ctx.config - 当前配置
}
```

### 带参数的命令

```typescript
api.registerCommand({
  name: "setmode",
  description: "设置模式",
  acceptsArgs: true,  // 允许参数
  requireAuth: true,  // 需要授权
  handler: async (ctx) => {
    const mode = ctx.args?.trim() || "default";
    // 保存配置
    return { text: `模式已设置为: ${mode}` };
  }
});
```

用户发送 `/setmode turbo` 触发。

### 选项配置

| 选项 | 类型 | 说明 |
|------|------|------|
| `name` | string | 命令名（不含 /） |
| `description` | string | 帮助文本 |
| `acceptsArgs` | boolean | 是否接受参数 |
| `requireAuth` | boolean | 是否需要授权 |
| `handler` | function | 处理函数 |
| `nativeNames` | object | 平台别名 |

## 完整示例

### 1. CLI 命令（openclaw 调用）

```typescript
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "weather",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      apiKey: { type: "string" }
    }
  },

  register(api: OpenClawPluginApi) {
    // 注册 CLI 命令
    api.registerCli(
      ({ program }) => {
        const weather = program
          .command("weather")
          .description("天气查询命令");

        weather
          .command("query <city>")
          .description("查询城市天气")
          .option("-u, --unit <unit>", "温度单位", "celsius")
          .action(async (options, city) => {
            const apiKey = api.runtime.getConfig("apiKey");
            if (!apiKey) {
              console.log("请先配置 API Key");
              return;
            }
            
            // 查询天气
            const weather = { temp: 25, condition: "晴" };
            const unit = options.unit === "fahrenheit" ? "F" : "C";
            console.log(`${city}: ${weather.condition}, ${weather.temp}°${unit}`);
          });

        weather
          .command("config")
          .description("配置 API Key")
          .option("-k, --key <key>", "API Key")
          .action((options) => {
            console.log(`API Key: ${options.key}`);
          });
      },
      { commands: ["weather"] }
    );
  }
};
```

调用：

```bash
openclaw weather query 北京
openclaw weather query 上海 --unit fahrenheit
openclaw weather config -k your-api-key
```

### 2. 自动回复命令（斜杠命令）

```typescript
import type { OpenClawPluginApi } from "./types.js";

const plugin = {
  id: "weather",
  configSchema: { type: "object", additionalProperties: false, properties: {} },

  register(api: OpenClawPluginApi) {
    // 注册 /weather 命令
    api.registerCommand({
      name: "weather",
      description: "查询天气（输入城市名）",
      acceptsArgs: true,
      handler: async (ctx) => {
        const city = ctx.args?.trim();
        
        if (!city) {
          return { text: "请输入城市名，如：/weather 北京" };
        }

        // 查询天气
        const weather = { temp: 25, condition: "晴" };
        
        return {
          text: `${city}今天天气：${weather.condition}，气温 ${weather.temp}°C`
        };
      }
    });

    // 注册 /weather-helper 命令
    api.registerCommand({
      name: "weather-helper",
      description: "天气助手帮助",
      handler: () => ({
        text: `📖 天气助手使用指南

命令：
- /weather <城市> - 查询天气
- /weather cities - 可用城市列表

示例：
- /weather 北京
- /weather 上海`
      })
    });
  }
};
```

用户在聊天中发送 `/weather 北京` 即可触发。

## 注意事项

- 命令名必须以字母开头，只能包含字母、数字、短横线、下划线
- 保留命令名（如 help、status、reset）不能被覆盖
- 插件命令在内置命令之前处理
- 命令名不区分大小写

## CLI vs 自动回复

| 特性 | CLI | 自动回复 |
|------|-----|---------|
| 调用方式 | `openclaw xxx` | `/xxx` |
| 触发 | 终端 | 聊天应用 |
| AI | 不调用 | 不调用 |
| 场景 | 自动化脚本 | 用户快速操作 |

## 参考

- [Voice Call CLI 示例](https://github.com/openclaw/openclaw/tree/main/src/plugins/voice-call)

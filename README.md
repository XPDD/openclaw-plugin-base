# OpenClaw Plugin Base

A baseline template for creating [OpenClaw](https://github.com/anthropics/openclaw) plugins. This template provides a complete starting point with all the necessary files and example code.

## Quick Start

### 1. Create Your Plugin from This Template

```bash
# Clone this repository
git clone https://github.com/your-username/openclaw-plugin-base.git my-plugin
cd my-plugin

# Install dependencies
npm install

# Customize your plugin (see below)
# Edit package.json, openclaw.plugin.json, and src/index.ts
```

### 2. Customize Your Plugin

Update the following files:

- **`package.json`**: Change the name, version, and description
- **`openclaw.plugin.json`**: Update the `id`, `name`, and `description`
- **`src/index.ts`**: Implement your plugin's tools and functionality

### 3. Build Your Plugin

```bash
npm run build
```

### 4. Install Your Plugin in OpenClaw

```bash
# Link your plugin to OpenClaw
npm link

# In your OpenClaw directory
npm link @your-username/your-plugin

# Or copy the built files to OpenClaw's extensions directory
cp -r dist ~/.openclaw/extensions/your-plugin/
```

## Project Structure

```
openclaw-plugin-base/
├── openclaw.plugin.json    # Plugin manifest
├── package.json            # NPM package configuration
├── tsconfig.json           # TypeScript configuration
├── src/
│   ├── index.ts           # Main plugin entry point
│   └── types.ts           # Type definitions
└── README.md              # This file
```

## Plugin Manifest (`openclaw.plugin.json`)

The manifest file defines your plugin's metadata and configuration schema:

```json
{
  "id": "your-plugin-id",
  "name": "Your Plugin Name",
  "description": "A brief description",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "API key for external service"
      }
    }
  }
}
```

### Required Fields

- `id`: Unique plugin identifier (use lowercase, hyphenated names)
- `configSchema`: JSON Schema for plugin configuration validation

### Optional Fields

- `name`: Display name
- `description`: Plugin summary
- `channels`: Array of channel IDs (for channel plugins)
- `skills`: Array of skill directories to load

## Package Configuration (`package.json`)

Key requirements for OpenClaw plugins:

```json
{
  "type": "module",
  "main": "./dist/index.js",
  "exports": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "@sinclair/typebox": "^0.34.48"
  }
}
```

### Required Dependencies

- `@sinclair/typebox`: For defining JSON Schema with TypeScript types

## TypeScript Configuration (`tsconfig.json`)

The template uses ES2022 modules with bundler resolution:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist"
  }
}
```

## Registering Agent Tools

The main plugin entry point (`src/index.ts`) exports a plugin object that registers tools with the OpenClaw agent.

### Basic Tool Registration

```typescript
import { Type, type Static } from "@sinclair/typebox";

// Define parameter schema
const MyToolSchema = Type.Object({
  input: Type.String({ description: "Input value" }),
  count: Type.Optional(Type.Number({ minimum: 1, maximum: 10 })),
});

export type MyToolParams = Static<typeof MyToolSchema>;

// Register the tool
function registerMyTool(api: OpenClawPluginApi) {
  api.registerTool({
    name: "my_tool",
    label: "My Tool",
    description: "Does something useful",
    parameters: MyToolSchema,
    async execute(_toolCallId, params): Promise<ToolResult> {
      const { input, count = 1 } = params as MyToolParams;

      return {
        content: [
          { type: "text", text: `Result: ${input.repeat(count)}` }
        ],
      };
    },
  });
}
```

### Tool Result Format

Tools must return a result with a `content` array containing content blocks:

```typescript
interface ToolResult {
  content: ContentBlock[];
  details?: unknown;
  error?: string;
}
```

#### Content Block Types

**Text Block**
```typescript
{ type: "text", text: "Hello, world!" }
```

**Image Block**
```typescript
{
  type: "image",
  source: { type: "url", url: "https://example.com/image.png" }
}
```

**Resource Block**
```typescript
{
  type: "resource",
  resource: {
    type: "file",
    filepath: "/path/to/file.pdf",
    mimeType: "application/pdf"
  }
}
```

### Optional Tools

Tools can be marked as optional to gracefully skip registration if dependencies are missing:

```typescript
api.registerTool(toolDefinition, { optional: true });
```

### Parameter Schema Definition with Typebox

Typebox provides type-safe JSON Schema definitions:

```typescript
import { Type } from "@sinclair/typebox";

// String with validation
const name = Type.String({ minLength: 1, maxLength: 100 });

// Optional number with range
const age = Type.Optional(Type.Number({ minimum: 0, maximum: 150 }));

// Enum/union of literals
const status = Type.Union([
  Type.Literal("active"),
  Type.Literal("inactive"),
  Type.Literal("pending"),
]);

// Complex object
const UserSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  name: Type.String(),
  email: Type.String({ format: "email" }),
  age: Type.Optional(Type.Number()),
  roles: Type.Array(Type.String()),
});

// Infer TypeScript type from schema
type User = Static<typeof UserSchema>;
```

## Plugin API

The `register` function receives an `OpenClawPluginApi` object:

```typescript
interface OpenClawPluginApi {
  config: Record<string, unknown>;
  logger: PluginLogger;
  runtime: PluginRuntime;
  registerTool<T>(definition: ToolDefinition<T>, options?): void;
  registerChannel?(channel: unknown): void;
}
```

### Accessing Configuration

Configuration values from `openclaw.plugin.json` are available in `api.config`:

```typescript
const apiKey = api.config.apiKey as string | undefined;
```

### Logging

Use the built-in logger:

```typescript
api.logger.debug("Detailed debug info");
api.logger.info("General information");
api.logger.warn("Warning message");
api.logger.error("Error occurred", error);
```

## Example Tools Included

This template includes three example tools to demonstrate common patterns:

1. **`base_echo`** - Simple text manipulation with parameters
2. **`base_calculate`** - Arithmetic operations with enum parameters
3. **`base_config`** - Reading plugin configuration
4. **`base_optional`** - Demonstrating optional tool registration

## Building for Production

```bash
# Build the plugin
npm run build

# The output will be in dist/
# dist/index.js - Compiled JavaScript
# dist/index.d.ts - TypeScript declarations
```

## Publishing Your Plugin

1. Update `package.json` with your plugin details
2. Publish to npm:
   ```bash
   npm publish
   ```
3. Users can then install:
   ```bash
   npm install @your-username/your-plugin
   ```

## Channel Plugins

If you're building a channel plugin (e.g., for Slack, Discord), you also need to export a `ChannelPlugin`:

```typescript
api.registerChannel({
  id: "my-channel",
  meta: { label: "My Channel", description: "..." },
  capabilities: { chat: true },
  // ... other channel methods
});
```

See the [OpenClaw documentation](https://github.com/anthropics/openclaw) for more details on channel plugins.

## Additional Resources

- [OpenClaw Documentation](https://github.com/anthropics/openclaw)
- [Plugin Manifest Reference](https://github.com/anthropics/openclaw/blob/main/docs/plugins/manifest.md)
- [Agent Tools Reference](https://github.com/anthropics/openclaw/blob/main/docs/plugins/agent-tools.md)
- [@sinclair/typebox Documentation](https://github.com/sinclairzx81/typebox)

## License

MIT

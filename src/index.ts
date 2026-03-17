/**
 * OpenClaw Plugin Base Template
 *
 * This is a template for creating OpenClaw plugins.
 * Copy this structure to start building your own plugin.
 */

import { Type, type Static } from "@sinclair/typebox";
import type {
  OpenClawPlugin,
  OpenClawPluginApi,
  ToolResult,
} from "./types.js";

// ============================================
// Tool Parameter Schemas
// ============================================

/**
 * Schema for the example 'echo' tool
 * This demonstrates basic parameter definitions using Typebox
 */
export const EchoToolSchema = Type.Object({
  message: Type.String({
    description: "The message to echo back",
  }),
  repeat: Type.Optional(
    Type.Number({
      description: "Number of times to repeat the message (default: 1)",
      minimum: 1,
      maximum: 10,
    })
  ),
  uppercase: Type.Optional(
    Type.Boolean({
      description: "Convert message to uppercase (default: false)",
    })
  ),
});

export type EchoToolParams = Static<typeof EchoToolSchema>;

/**
 * Schema for the example 'calculate' tool
 * This demonstrates numeric parameters and enums
 */
export const CalculateToolSchema = Type.Object({
  operation: Type.Union(
    [
      Type.Literal("add"),
      Type.Literal("subtract"),
      Type.Literal("multiply"),
      Type.Literal("divide"),
    ],
    {
      description: "The arithmetic operation to perform",
    }
  ),
  a: Type.Number({
    description: "First number",
  }),
  b: Type.Number({
    description: "Second number",
  }),
});

export type CalculateToolParams = Static<typeof CalculateToolSchema>;

/**
 * Schema for the example 'config' tool
 * This demonstrates accessing plugin configuration
 */
export const ConfigToolSchema = Type.Object({
  key: Type.Optional(
    Type.String({
      description: "Specific config key to retrieve (optional, returns all if not provided)",
    })
  ),
});

export type ConfigToolParams = Static<typeof ConfigToolSchema>;

// ============================================
// Tool Registration Functions
// ============================================

/**
 * Register the example 'echo' tool
 *
 * This tool simply echoes back the provided message with optional modifications.
 */
function registerEchoTool(api: OpenClawPluginApi) {
  api.registerTool({
    name: "base_echo",
    label: "Echo Message",
    description: "Echo a message back with optional repetition and case conversion",
    parameters: EchoToolSchema,
    async execute(_toolCallId, params): Promise<ToolResult> {
      const { message, repeat = 1, uppercase = false } = params as EchoToolParams;

      let result = message;
      if (uppercase) {
        result = result.toUpperCase();
      }

      const output = result.repeat(repeat);

      api.logger.info(`Echo tool called with: ${message}`);

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    },
  });
}

/**
 * Register the example 'calculate' tool
 *
 * This tool performs basic arithmetic operations.
 */
function registerCalculateTool(api: OpenClawPluginApi) {
  api.registerTool({
    name: "base_calculate",
    label: "Calculate",
    description: "Perform basic arithmetic operations (add, subtract, multiply, divide)",
    parameters: CalculateToolSchema,
    async execute(_toolCallId, params): Promise<ToolResult> {
      const { operation, a, b } = params as CalculateToolParams;

      let result: number;
      let operator: string;

      switch (operation) {
        case "add":
          result = a + b;
          operator = "+";
          break;
        case "subtract":
          result = a - b;
          operator = "-";
          break;
        case "multiply":
          result = a * b;
          operator = "×";
          break;
        case "divide":
          if (b === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Division by zero is not allowed",
                },
              ],
              error: "Division by zero",
            };
          }
          result = a / b;
          operator = "÷";
          break;
      }

      api.logger.debug(`Calculated: ${a} ${operator} ${b} = ${result}`);

      return {
        content: [
          {
            type: "text",
            text: `${a} ${operator} ${b} = ${result}`,
          },
        ],
        details: { operation, a, b, result },
      };
    },
  });
}

/**
 * Register the example 'config' tool
 *
 * This tool demonstrates accessing plugin configuration.
 */
function registerConfigTool(api: OpenClawPluginApi) {
  api.registerTool({
    name: "base_config",
    label: "Plugin Config",
    description: "View plugin configuration values",
    parameters: ConfigToolSchema,
    async execute(_toolCallId, params): Promise<ToolResult> {
      const { key } = params as ConfigToolParams;

      if (key) {
        const value = api.config[key];
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ [key]: value }, null, 2),
            },
          ],
        };
      }

      // Return all config (excluding sensitive values)
      const safeConfig = { ...api.config };
      if ("apiKey" in safeConfig && safeConfig.apiKey) {
        (safeConfig as { apiKey: string }).apiKey = "***REDACTED***";
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(safeConfig, null, 2),
          },
        ],
        details: safeConfig,
      };
    },
  });
}

/**
 * Register an optional tool
 *
 * Tools marked as optional will be skipped gracefully if they fail to register
 * (e.g., if required dependencies are missing).
 */
function registerOptionalTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "base_optional",
      label: "Optional Tool",
      description: "An example optional tool (demonstrates optional registration)",
      parameters: Type.Object({}),
      async execute(_toolCallId, _params): Promise<ToolResult> {
        return {
          content: [
            {
              type: "text",
              text: "This optional tool was successfully registered!",
            },
          ],
        };
      },
    },
    { optional: true }
  );
}

// ============================================
// Main Plugin Definition
// ============================================

/**
 * Empty configuration schema for the plugin
 * Customize this to define your plugin's configuration options
 */
function pluginConfigSchema() {
  return {
    type: "object" as const,
    additionalProperties: false as const,
    properties: {
      enabled: {
        type: "boolean" as const,
        default: true,
        description: "Enable or disable the plugin",
      },
      apiKey: {
        type: "string" as const,
        description: "API key for external service integration (optional)",
      },
      customSetting: {
        type: "string" as const,
        description: "Example custom setting",
      },
    },
  };
}

/**
 * Main plugin object
 * This is exported as the default and loaded by OpenClaw
 */
const plugin: OpenClawPlugin = {
  id: "openclaw-plugin-base",
  name: "OpenClaw Plugin Base",
  description: "A baseline template for creating OpenClaw plugins",
  configSchema: pluginConfigSchema(),

  /**
   * Registration function called when the plugin is loaded
   * Use this to register tools, channels, and other extensions
   */
  register(api: OpenClawPluginApi): void {
    api.logger.info("Registering OpenClaw Plugin Base...");

    // Register example tools
    registerEchoTool(api);
    registerCalculateTool(api);
    registerConfigTool(api);
    registerOptionalTool(api);

    // You can also register channels if this is a channel plugin:
    // if (api.registerChannel) {
    //   api.registerChannel({ /* channel implementation */ });
    // }

    api.logger.info("OpenClaw Plugin Base registered successfully");
  },
};

export default plugin;

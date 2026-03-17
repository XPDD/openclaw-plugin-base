/**
 * OpenClaw Plugin Type Definitions
 *
 * This file contains the core type definitions for building OpenClaw plugins.
 * These types mirror the official OpenClaw Plugin SDK.
 */

import { type TSchema } from "@sinclair/typebox";

/**
 * Content block types for tool results
 */
export type ContentBlock =
  | TextContentBlock
  | ImageContentBlock
  | ResourceContentBlock;

/**
 * Text content block
 */
export interface TextContentBlock {
  type: "text";
  text: string;
}

/**
 * Image content block
 */
export interface ImageContentBlock {
  type: "image";
  source: {
    type: "url";
    url: string;
  };
}

/**
 * Resource content block for file references
 */
export interface ResourceContentBlock {
  type: "resource";
  resource: {
    type: "file";
    filename?: string;
    filepath: string;
    mimeType?: string;
  };
}

/**
 * Standard tool result format
 */
export interface ToolResult {
  /** Array of content blocks to display in the chat */
  content: ContentBlock[];
  /** Optional raw data for further processing */
  details?: unknown;
  /** Optional error message */
  error?: string;
}

/**
 * Helper function to create a JSON text response
 */
export function jsonResponse(data: unknown): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    details: data,
  };
}

/**
 * Helper function to create a plain text response
 */
export function textResponse(text: string): ToolResult {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

/**
 * Tool registration options
 */
export interface ToolRegistrationOptions {
  /** Whether the tool is optional (will be skipped if dependencies are missing) */
  optional?: boolean;
}

/**
 * Tool definition for agent registration
 */
export interface ToolDefinition<TParameters extends TSchema = TSchema> {
  /** Unique tool identifier (e.g., "my_plugin_action") */
  name: string;
  /** Human-readable label */
  label: string;
  /** Description of what the tool does */
  description: string;
  /** JSON Schema for parameters using @sinclair/typebox */
  parameters: TParameters;
  /** Function called when the tool is executed */
  execute: (toolCallId: string, params: unknown) => Promise<ToolResult>;
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  type: "object";
  additionalProperties?: boolean;
  properties: Record<string, unknown>;
  required?: string[];
}

/**
 * Logger interface for plugin logging
 */
export interface PluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Runtime context provided to plugins
 */
export interface PluginRuntime {
  /** Plugin working directory */
  workdir: string;
  /** User data directory */
  userDataDir: string;
  /** Additional runtime metadata */
  [key: string]: unknown;
}

/**
 * Main plugin API provided by OpenClaw
 */
export interface OpenClawPluginApi {
  /** Plugin configuration values */
  config: Record<string, unknown>;

  /** Logger instance */
  logger: PluginLogger;

  /** Runtime context */
  runtime: PluginRuntime;

  /**
   * Register an agent tool
   * @param definition Tool definition with parameters and execute function
   * @param options Optional registration options
   */
  registerTool<TParameters extends TSchema>(
    definition: ToolDefinition<TParameters>,
    options?: ToolRegistrationOptions
  ): void;

  /**
   * Register a channel (for channel plugins)
   * This is optional and only used for plugins that provide channel integrations
   */
  registerChannel?(channel: unknown): void;
}

/**
 * Plugin manifest structure (openclaw.plugin.json)
 */
export interface PluginManifest {
  /** Unique plugin identifier */
  id: string;
  /** Display name */
  name?: string;
  /** Description */
  description?: string;
  /** Plugin kind (optional) */
  kind?: string;
  /** Channel IDs registered by this plugin */
  channels?: string[];
  /** Skill directories to load */
  skills?: string[];
  /** Configuration JSON Schema */
  configSchema: PluginConfigSchema;
}

/**
 * Main plugin definition
 */
export interface OpenClawPlugin {
  /** Unique plugin identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Configuration schema */
  configSchema: PluginConfigSchema;
  /** Registration function called when plugin is loaded */
  register(api: OpenClawPluginApi): void | Promise<void>;
}

/**
 * Type for plugin module export
 */
export type OpenClawPluginModule = OpenClawPlugin | { default: OpenClawPlugin };

/**
 * OpenClaw Plugin API Types
 * 
 * These types define the interface that OpenClaw provides to plugins.
 */

import type { TSchema } from '@sinclair/typebox';

/**
 * Runtime API provided to plugins
 */
export interface PluginRuntime {
  /** Get a configuration value */
  getConfig: <T = any>(key: string) => T | undefined;
  /** Log a message */
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string) => void;
}

/**
 * Channel registration options
 */
export interface ChannelRegistration {
  plugin: {
    id: string;
    name: string;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    send: (chatId: string, message: any) => Promise<void>;
  };
}

/**
 * Tool registration options
 */
export interface ToolRegistration {
  name: string;
  description: string;
  parameters: TSchema | object;
  execute: (id: string, params: any) => Promise<ToolResult>;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'file';
    text?: string;
    data?: string;
  }>;
}

/**
 * Tool registration options with metadata
 */
export interface ToolOptions {
  optional?: boolean;
}

/**
 * Provider registration options
 */
export interface ProviderRegistration {
  id: string;
  name: string;
  type: 'chat' | 'embedding' | 'image';
  createClient: (config: any) => any;
}

/**
 * Skill registration options
 */
export interface SkillRegistration {
  name: string;
  description: string;
  trigger: string;
  execute: (context: any) => Promise<any>;
}

/**
 * Main plugin API interface
 */
export interface OpenClawPluginApi {
  /** Runtime environment */
  runtime: PluginRuntime;
  
  /** Register a channel */
  registerChannel: (channel: ChannelRegistration) => void;
  
  /** Register an agent tool */
  registerTool: (tool: ToolRegistration, options?: ToolOptions) => void;
  
  /** Register a model provider */
  registerProvider: (provider: ProviderRegistration) => void;
  
  /** Register a skill */
  registerSkill: (skill: SkillRegistration) => void;
}

/**
 * Plugin definition interface
 */
export interface OpenClawPlugin {
  /** Unique plugin identifier */
  id: string;
  
  /** Display name */
  name?: string;
  
  /** Short description */
  description?: string;
  
  /** Plugin version */
  version?: string;
  
  /** JSON Schema for plugin configuration */
  configSchema: object;
  
  /** Plugin registration function */
  register: (api: OpenClawPluginApi) => void | Promise<void>;
}

/**
 * Helper to create an empty config schema
 */
export function emptyPluginConfigSchema(): object {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {}
  };
}

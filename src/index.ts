/**
 * OpenClaw Plugin Template
 * 
 * This is a baseline plugin that demonstrates:
 * - Plugin manifest structure
 * - Registering agent tools with TypeBox schemas
 * - Tool execution with proper result format
 * 
 * To use this template:
 * 1. Update openclaw.plugin.json with your plugin id
 * 2. Implement your tools in the register function
 * 3. Build with `npm run build`
 * 4. Install in OpenClaw via `openclaw plugins install ./path/to/plugin`
 */

import { Type } from '@sinclair/typebox';
import type { OpenClawPluginApi } from './types.js';

/**
 * Example: Register a simple echo tool
 * 
 * This demonstrates the basic structure of an agent tool:
 * - Tool name and description
 * - Parameters defined with TypeBox schema
 * - Execute function that returns a ToolResult
 */
function registerExampleTool(api: OpenClawPluginApi) {
  api.registerTool({
    name: 'example_echo',
    description: 'Echo back the input message (example tool)',
    parameters: Type.Object({
      message: Type.String({
        description: 'The message to echo back'
      }),
      uppercase: Type.Optional(Type.Boolean({
        description: 'Convert to uppercase before echoing',
        default: false
      }))
    }),
    async execute(_id, params) {
      const text = params.uppercase 
        ? params.message.toUpperCase() 
        : params.message;
      
      api.runtime.log('info', `Echo tool called with: ${text}`);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Echo: ${text}` 
          }
        ]
      };
    }
  });
}

/**
 * Example: Register a tool with external API call
 * 
 * This shows how to:
 * - Use plugin config (apiKey)
 * - Make external requests
 * - Handle errors gracefully
 */
function registerApiTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: 'example_api_call',
      description: 'Make an example API call (requires API key in config)',
      parameters: Type.Object({
        endpoint: Type.String({
          description: 'API endpoint to call'
        }),
        data: Type.Optional(Type.Object({
          description: 'Request payload'
        }))
      }),
      async execute(_id, params) {
        const apiKey = api.runtime.getConfig('apiKey');
        
        if (!apiKey) {
          return {
            content: [
              { 
                type: 'text', 
                text: 'Error: API key not configured. Set it in plugin config.' 
              }
            ]
          };
        }
        
        try {
          // Example fetch (in real plugin, replace with actual API call)
          // const response = await fetch(params.endpoint, {
          //   headers: { 'Authorization': `Bearer ${apiKey}` },
          //   body: JSON.stringify(params.data)
          // });
          // const result = await response.json();
          
          api.runtime.log('info', `API call to ${params.endpoint}`);
          
          return {
            content: [
              { 
                type: 'text', 
                text: `Would call ${params.endpoint} with API key (demo mode)` 
              }
            ]
          };
        } catch (error) {
          api.runtime.log('error', `API call failed: ${error}`);
          return {
            content: [
              { 
                type: 'text', 
                text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
              }
            ]
          };
        }
      }
    },
    { optional: true } // Mark as optional - users must opt-in via allowlist
  );
}

/**
 * Main plugin definition
 */
const plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  description: 'A sample OpenClaw plugin with example tools',
  version: '0.1.0',
  
  // Config schema must match openclaw.plugin.json
  configSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      apiKey: {
        type: 'string',
        description: 'API key for external service'
      }
    }
  },
  
  /**
   * Plugin registration - called by OpenClaw on load
   */
  async register(api: OpenClawPluginApi) {
    api.runtime.log('info', 'My Plugin is loading...');
    
    // Register example tools
    registerExampleTool(api);
    registerApiTool(api);
    
    // To register a channel (uncomment and implement):
    // api.registerChannel({
    //   plugin: {
    //     id: 'my-channel',
    //     name: 'My Channel',
    //     async connect() { /* connect logic */ },
    //     async disconnect() { /* cleanup */ },
    //     async send(chatId: string, message: any) { /* send logic */ }
    //   }
    // });
    
    // To register a provider (uncomment and implement):
    // api.registerProvider({
    //   id: 'my-provider',
    //   name: 'My Provider',
    //   type: 'chat',
    //   createClient: (config) => { /* return client instance */ }
    // });
    
    api.runtime.log('info', 'My Plugin loaded successfully');
  }
};

export default plugin;

// Re-export types for plugin developers
export type { OpenClawPluginApi, OpenClawPlugin, ToolResult } from './types.js';
export { emptyPluginConfigSchema } from './types.js';

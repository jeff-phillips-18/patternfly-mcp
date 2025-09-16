#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ComponentDocs } from './ComponentDocs.js';
import { LayoutDocs } from './LayoutDocs.js';
import { ChartDocs } from './ChartDocs.js';
import packageJson from '../package.json' with { type: 'json' };

class PatternflyMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: packageJson.name,
        version: packageJson.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private readonly docsPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'documentation');

  private usePatternFlyDocs = async (urlList: string[]): Promise<string> => {
    try {
      const results: string[] = [];

      for (const url of urlList) {
        try {
          // Check if it's a URL or a local file path
          if (url.startsWith('http://') || url.startsWith('https://')) {
            // Handle as URL
            const response = await fetch(url);
            if (!response.ok) {
              results.push(`❌ Failed to fetch ${url}: ${response.status} ${response.statusText}`);
              continue;
            }

            const content = await response.text();
            results.push(`# Documentation from ${url}\n\n${content}`);
          } else {
            // Handle as local file path
            try {
              const content = await readFile(url, 'utf-8');
              results.push(`# Documentation from ${url}\n\n${content}`);
            } catch (fileError) {
              results.push(`❌ Failed to read local file ${url}: ${fileError}`);
            }
          }
        } catch (error) {
          results.push(`❌ Error processing ${url}: ${error}`);
        }
      }

      return results.join('\n\n---\n\n');
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch documentation: ${error}`
      );
    }
  }

  private async fetchDocs(urls: string[]): Promise<string> {
    try {
      const results: string[] = [];

      for (const url of urls) {
        try {
          // Check if it's a URL or a local file path
          if (url.startsWith('http://') || url.startsWith('https://')) {
            // Handle as URL
            const response = await fetch(url);
            if (!response.ok) {
              results.push(`❌ Failed to fetch ${url}: ${response.status} ${response.statusText}`);
              continue;
            }

            const content = await response.text();
            results.push(`# Documentation from ${url}\n\n${content}`);
          } else {
            // Handle as local file path
            try {
              const content = await readFile(url, 'utf-8');
              results.push(`# Documentation from ${url}\n\n${content}`);
            } catch (fileError) {
              results.push(`❌ Failed to read local file ${url}: ${fileError}`);
            }
          }
        } catch (error) {
          results.push(`❌ Error processing ${url}: ${error}`);
        }
      }

      return results.join('\n\n---\n\n');
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch documentation: ${error}`
      );
    }
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'usePatternFlyDocs',
            description:
              `You must use this tool to answer any questions related to PatternFly components or documentation.

              The description of the tool contains links to .md files or local file paths that the user has made available.

              ${ComponentDocs.join('\n')}
              ${LayoutDocs.join('\n')}
              ${ChartDocs.join('\n')}
              [@patternfly/react-charts](${join(this.docsPath, 'charts', 'README.md')})
              [@patternfly/react-chatbot](${join(this.docsPath, 'chatbot', 'README.md')})
              [@patternfly/react-component-groups](${join(this.docsPath, 'component-groups', 'README.md')})
              [@patternfly/react-components](${join(this.docsPath, 'components', 'README.md')})
              [@patternfly/react-guidelines](${join(this.docsPath, 'guidelines', 'README.md')})
              [@patternfly/react-resources](${join(this.docsPath, 'resources', 'README.md')})
              [@patternfly/react-setup](${join(this.docsPath, 'setup', 'README.md')})
              [@patternfly/react-troubleshooting](${join(this.docsPath, 'troubleshooting', 'README.md')})

              1. Pick the most suitable URL from the above list, and use that as the "urlList" argument for this tool's execution, to get the docs content. If it's just one, let it be an array with one URL.
              2. Analyze the URLs listed in the .md file
              3. Then fetch specific documentation pages relevant to the user's question with the subsequent tool call.`,
            inputSchema: {
              type: 'object',
              properties: {
                urlList: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'The list of urls to fetch the documentation from',
                },
              },
              required: ['urlList'],
              additionalProperties: false,
              $schema: 'http://json-schema.org/draft-07/schema#',
            },
          },
          {
            name: 'fetchDocs',
            description: 'Fetch documentation for one or more URLs extracted from previous tool calls responses. The URLs should be passed as an array in the "urls" argument.',
            inputSchema: {
              type: 'object',
              properties: {
                urls: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'The list of URLs to fetch documentation from',
                },
              },
              required: ['urls'],
              additionalProperties: false,
              $schema: 'http://json-schema.org/draft-07/schema#',
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'usePatternFlyDocs': {
            const urlList = args?.urlList ? args.urlList as string[] : null;
            if (!urlList || !Array.isArray(urlList)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                `Missing required parameter: urlList (must be an array of strings): ${urlList}`
              );
            }
            const result = await this.usePatternFlyDocs(urlList);
            return {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            };
          }

          case 'fetchDocs': {
            const urls = args?.urls ? args.urls as string[] : null;
            if (!urls || !Array.isArray(urls)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                `Missing required parameter: urls (must be an array of strings): ${urls}`
              );
            }
            const result = await this.fetchDocs(urls);
            return {
              content: [
                {
                  type: 'text',
                  text: urls.join('\n'),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error}`
        );
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error: any) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Patternfly MCP server running on stdio');
  }
}

// Start the server
const server = new PatternflyMcpServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

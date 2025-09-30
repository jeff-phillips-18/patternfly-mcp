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
import { memo } from './helpers.js';
import packageJson from '../package.json' with { type: 'json' };

class PatternflyMcpServer {
  private server: Server;
  private useDocsHost = false;

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

    // Check for args telling us to use local data
    if (process.argv.includes('--docs-host')) {
      this.useDocsHost = true;
    }

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private readonly docsPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'documentation');
  private readonly llmsFilesPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'llms-files');

  // Formatting and URL detection
  private static readonly SEPARATOR = '\n\n---\n\n';
  private static readonly URL_RE = /^(https?:)\/\//i;

  /**
   * Resolve a local path depending on --docs-host flag.
   */
  private resolveLocalPath(relativeOrAbsolute: string): string {
    return this.useDocsHost ? join(this.llmsFilesPath, relativeOrAbsolute) : relativeOrAbsolute;
  }

  // Cache configuration
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 min sliding cache
  private readonly URL_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min sliding cache for external URLs

  private createUrlMemo() {
    return memo(this.fetchUrl.bind(this), {
      cacheLimit: 50,
      expire: this.URL_CACHE_TTL_MS,
      cacheErrors: false
    });
  }

  private createFileMemo() {
    return memo(this.readLocalFile.bind(this), {
      cacheLimit: 25,
      expire: this.CACHE_TTL_MS
    });
  }

  private memoizedFetchUrl = this.createUrlMemo();

  private memoizedReadFile = this.createFileMemo();

  private resetUrlCache() {
    this.memoizedFetchUrl = this.createUrlMemo();
  }

  private resetFileCache() {
    this.memoizedReadFile = this.createFileMemo();
  }

  // Cooldown for clearCache (default 5s; override via DOC_MCP_CLEAR_COOLDOWN_MS)
  private static readonly CLEAR_CACHE_COOLDOWN_MS = Number(process.env.DOC_MCP_CLEAR_COOLDOWN_MS ?? 5000);
  private lastClearCacheAt: number | null = null;

  private assertClearCacheNotRateLimited() {
    const now = Date.now();
    const last = this.lastClearCacheAt ?? 0;
    const remaining = (last + PatternflyMcpServer.CLEAR_CACHE_COOLDOWN_MS) - now;
    if (remaining > 0) {
      const code = (ErrorCode as any).ResourceExhausted ?? ErrorCode.InvalidParams;
      const seconds = Math.ceil(remaining / 1000);
      throw new McpError(code, `clearCache is cooling down; try again in ${seconds}s`);
    }
  }

  private markCacheCleared() {
    this.lastClearCacheAt = Date.now();
  }

  // Helper methods for memoization
  private async fetchUrl(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.DOC_MCP_FETCH_TIMEOUT_MS ?? 15_000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'text/plain, text/markdown, */*' }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readLocalFile(filePath: string): Promise<string> {
    return await readFile(filePath, 'utf-8');
  }

  /**
   * Load a single item from URL or local file and return header + content.
   * Throws on failure; caller formats errors uniformly.
   */
  private async loadOne(pathOrUrl: string): Promise<{ header: string; content: string }> {
    if (PatternflyMcpServer.URL_RE.test(pathOrUrl)) {
      const content = await this.memoizedFetchUrl(pathOrUrl);
      return { header: `# Documentation from ${pathOrUrl}`, content };
    }
    const filePath = this.resolveLocalPath(pathOrUrl);
    const content = await this.memoizedReadFile(filePath);
    return { header: `# Documentation from ${filePath}`, content };
  }

  /**
   * Normalize inputs, load all in parallel, and return the joined string.
   */
  private async processDocs(inputs: string[]): Promise<string> {
    const seen = new Set<string>();
    const list = inputs
      .map(s => String(s).trim())
      .filter(Boolean)
      .filter(s => { if (seen.has(s)) return false; seen.add(s); return true; });

    const settled = await Promise.allSettled(list.map(item => this.loadOne(item)));

    const parts: string[] = [];
    settled.forEach((res, idx) => {
      const original = list[idx];
      if (res.status === 'fulfilled') {
        const { header, content } = res.value;
        parts.push(`${header}\n\n${content}`);
      } else {
        parts.push(`❌ Failed to load ${original}: ${res.reason}`);
      }
    });

    return parts.join(PatternflyMcpServer.SEPARATOR);
  }


  private usePatternFlyDocs = async (urlList: string[]): Promise<string> => {
    try {
      return await this.processDocs(urlList);
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch documentation: ${error}`
      );
    }
  }

  private async fetchDocs(urls: string[]): Promise<string> {
    try {
      return await this.processDocs(urls);
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
      const tools: any[] = [
        {
          name: 'usePatternFlyDocs',
          description:
            `You must use this tool to answer any questions related to PatternFly components or documentation.

              The description of the tool contains links to ${this.useDocsHost ? 'llms.txt' : '.md'} files or local file paths that the user has made available.

              ${this.useDocsHost ?
              `[@patternfly/react-core@6.0.0^](${join('react-core', '6.0.0', 'llms.txt')})`
              :
              `
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
                `
            }

              1. Pick the most suitable URL from the above list, and use that as the "urlList" argument for this tool's execution, to get the docs content. If it's just one, let it be an array with one URL.
              2. Analyze the URLs listed in the ${this.useDocsHost ? 'llms.txt' : '.md'} file
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
      ];

      tools.push({
        name: 'clearCache',
        description: 'Clear memo caches by recreating memo instances. Scope: url | file | all.',
        inputSchema: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['url', 'file', 'all'], default: 'all' }
          },
          additionalProperties: false,
          $schema: 'http://json-schema.org/draft-07/schema#'
        }
      });

      return { tools };
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
                  text: result,
                },
              ],
            };
          }

          case 'clearCache': {
            this.assertClearCacheNotRateLimited();
            const scope = (args?.scope ?? 'all') as 'url' | 'file' | 'all';
            if (scope === 'url' || scope === 'all') this.resetUrlCache();
            if (scope === 'file' || scope === 'all') this.resetFileCache();
            this.markCacheCleared();
            return {
              content: [
                { type: 'text', text: `Cleared cache scope: ${scope}` }
              ]
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

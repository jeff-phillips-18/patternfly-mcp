#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, readdir, stat } from 'fs/promises';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

class PatternflyMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: '@jephilli-patternfly-docs/mcp',
        version: '1.0.0',
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

  private async listDocumentation(path: string): Promise<string> {
    try {
      const fullPath = join(this.docsPath, path);
      const entries = await readdir(fullPath, { withFileTypes: true });
      
      const result = [`# Documentation Structure${path ? ` - ${path}` : ''}\n`];
      
      const directories = entries.filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
      const files = entries.filter(entry => entry.isFile()).sort((a, b) => a.name.localeCompare(b.name));
      
      if (directories.length > 0) {
        result.push('## Directories:');
        directories.forEach(dir => {
          result.push(`- 📁 **${dir.name}/**`);
        });
        result.push('');
      }
      
      if (files.length > 0) {
        result.push('## Files:');
        files.forEach(file => {
          const relativePath = path ? `${path}/${file.name}` : file.name;
          result.push(`- 📄 **${file.name}** (${relativePath})`);
        });
      }
      
      if (result.length === 1) {
        result.push('No files or directories found.');
      }
      
      return result.join('\n');
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list documentation: ${error}`
      );
    }
  }

  private async getDocumentation(filePath: string): Promise<string> {
    try {
      const fullPath = join(this.docsPath, filePath);
      const content = await readFile(fullPath, 'utf-8');
      return `# ${filePath}\n\n${content}`;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read documentation file: ${error}`
      );
    }
  }

  private async searchDocumentation(query: string, caseSensitive: boolean): Promise<string> {
    try {
      const results: string[] = [];
      await this.searchInDirectory(this.docsPath, query, caseSensitive, results);
      
      if (results.length === 0) {
        return `No results found for: "${query}"`;
      }
      
      return `# Search Results for "${query}"\n\n${results.join('\n\n')}`;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search documentation: ${error}`
      );
    }
  }

  private async searchInDirectory(dirPath: string, query: string, caseSensitive: boolean, results: string[]): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await this.searchInDirectory(fullPath, query, caseSensitive, results);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const content = await readFile(fullPath, 'utf-8');
          const searchContent = caseSensitive ? content : content.toLowerCase();
          const searchQuery = caseSensitive ? query : query.toLowerCase();
          
          if (searchContent.includes(searchQuery)) {
            const relativePath = relative(this.docsPath, fullPath);
            const lines = content.split('\n');
            const matchingLines: string[] = [];
            
            lines.forEach((line, index) => {
              const searchLine = caseSensitive ? line : line.toLowerCase();
              if (searchLine.includes(searchQuery)) {
                matchingLines.push(`Line ${index + 1}: ${line.trim()}`);
              }
            });
            
            results.push(`## ${relativePath}\n${matchingLines.slice(0, 5).join('\n')}`);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  private async getQuickRules(category?: string): Promise<string> {
    try {
      if (!category) {
        // Return overview of all categories
        const overview = await readFile(join(this.docsPath, 'README.md'), 'utf-8');
        return `# PatternFly Quick Rules Overview\n\n${overview}`;
      }
      
      // Return specific category rules
      const categoryPaths: Record<string, string> = {
        'setup': 'setup/README.md',
        'guidelines': 'guidelines/README.md',
        'components': 'components/README.md',
        'component-groups': 'component-groups/README.md',
        'charts': 'charts/README.md',
        'chatbot': 'chatbot/README.md',
        'resources': 'resources/external-links.md',
        'troubleshooting': 'troubleshooting/common-issues.md'
      };
      
      const filePath = categoryPaths[category.toLowerCase()];
      if (!filePath) {
        return `Unknown category: ${category}. Available categories: ${Object.keys(categoryPaths).join(', ')}`;
      }
      
      try {
        const content = await readFile(join(this.docsPath, filePath), 'utf-8');
        return `# ${category.charAt(0).toUpperCase() + category.slice(1)} Rules\n\n${content}`;
      } catch (error) {
        return `Category "${category}" documentation not found at ${filePath}`;
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get quick rules: ${error}`
      );
    }
  }

  private async getAllStandards(includeExamples: boolean, sections: string[]): Promise<string> {
    try {
      const result: string[] = [];
      result.push('# Comprehensive PatternFly Standards and Guidelines\n');
      
             // Define all standard files to read (organized by section in alphabetical order)
       const standardFiles: { section: string; title: string; path: string }[] = [
        { section: 'overview', title: 'Overview', path: 'README.md' },
        { section: 'charts', title: 'Charts Standards', path: 'charts/README.md' },
         { section: 'chatbot', title: 'Chatbot Standards', path: 'chatbot/README.md' },
         { section: 'component-groups', title: 'Component Groups', path: 'component-groups/README.md' },
         { section: 'components', title: 'Data Display Components', path: 'components/data-display/README.md' },
         { section: 'components', title: 'Layout Components', path: 'components/layout/README.md' },
         { section: 'components', title: 'Table Component', path: 'components/data-display/table.md' },
         { section: 'guidelines', title: 'Core Guidelines', path: 'guidelines/README.md' },
         { section: 'guidelines', title: 'AI Prompt Guidance', path: 'guidelines/ai-prompt-guidance.md' },
         { section: 'guidelines', title: 'Component Architecture', path: 'guidelines/component-architecture.md' },
         { section: 'guidelines', title: 'Deployment Guide', path: 'guidelines/deployment-guide.md' },
         { section: 'guidelines', title: 'Styling Standards', path: 'guidelines/styling-standards.md' },
         { section: 'resources', title: 'External Links', path: 'resources/external-links.md' },
         { section: 'resources', title: 'Local Files', path: 'resources/local-files.md' },
         { section: 'setup', title: 'Setup Standards', path: 'setup/README.md' },
         { section: 'setup', title: 'Development Environment', path: 'setup/development-environment.md' },
         { section: 'setup', title: 'Quick Start Guide', path: 'setup/quick-start.md' },
         { section: 'troubleshooting', title: 'Common Issues & Solutions', path: 'troubleshooting/common-issues.md' },
       ];
      
      // Filter sections if specified
      const filesToRead = sections.length > 0 
        ? standardFiles.filter(file => sections.includes(file.section) || file.section === 'overview')
        : standardFiles;
      
      // Read and compile all standards
      for (const fileInfo of filesToRead) {
        try {
          const content = await readFile(join(this.docsPath, fileInfo.path), 'utf-8');
          
          result.push(`## ${fileInfo.title}\n`);
          
          if (!includeExamples) {
            // Filter out code examples and detailed explanations
            const lines = content.split('\n');
            const filteredLines: string[] = [];
            let inCodeBlock = false;
            let skipDetailedSection = false;
            
            for (const line of lines) {
              // Skip code blocks if examples not wanted
              if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                if (!includeExamples) continue;
              }
              
              if (inCodeBlock && !includeExamples) continue;
              
              // Skip detailed example sections
              if (line.match(/^###?\s+(Example|Usage|Code|Implementation)/i)) {
                skipDetailedSection = true;
                if (!includeExamples) continue;
              }
              
              if (line.match(/^#{1,6}\s+/) && !line.match(/^###?\s+(Example|Usage|Code|Implementation)/i)) {
                skipDetailedSection = false;
              }
              
              if (skipDetailedSection && !includeExamples) continue;
              
              filteredLines.push(line);
            }
            
            result.push(filteredLines.join('\n'));
          } else {
            result.push(content);
          }
          
          result.push('\n---\n');
        } catch (error) {
          result.push(`⚠️ Could not read ${fileInfo.title} (${fileInfo.path})\n\n---\n`);
        }
      }
      
      // Add summary at the end
      result.push('## Summary\n');
      result.push('This document contains all PatternFly standards and guidelines for React development.');
      result.push('Key points to remember:');
      result.push('- Always use PatternFly v6 components and classes');
      result.push('- Follow accessibility requirements (WCAG 2.1 AA)');
      result.push('- Use semantic design tokens for styling');
      result.push('- Implement proper error and loading states');
      result.push('- Reference official PatternFly documentation for latest updates');
      
      return result.join('\n');
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get all standards: ${error}`
      );
    }
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_documentation',
            description: 'List available PatternFly documentation categories and files',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Optional path to list contents of specific directory (relative to documentation)',
                },
              },
            },
          },
          {
            name: 'get_documentation',
            description: 'Get the content of a specific PatternFly documentation file',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to the documentation file (relative to documentation)',
                },
              },
              required: ['file_path'],
            },
          },
          {
            name: 'search_documentation',
            description: 'Search for specific text across all PatternFly documentation files',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Text to search for in the documentation',
                },
                case_sensitive: {
                  type: 'boolean',
                  description: 'Whether the search should be case sensitive',
                  default: false,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_quick_rules',
            description: 'Get essential PatternFly development rules and guidelines',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Specific category of rules (charts, chatbot, component-groups, components, guidelines, resources, setup, troubleshooting)',
                },
              },
            },
          },
          {
            name: 'get_all_standards',
            description: 'Get comprehensive PatternFly standards and guidelines from all documentation',
            inputSchema: {
              type: 'object',
              properties: {
                include_examples: {
                  type: 'boolean',
                  description: 'Whether to include code examples and detailed explanations',
                  default: true,
                },
                sections: {
                  type: 'array',
                  description: 'Specific sections to include (charts, chatbot, component-groups, components, guidelines, resources, setup, troubleshooting). If not provided, includes all sections.',
                  items: {
                    type: 'string',
                  },
                },
              },
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
          case 'list_documentation': {
            const path = args?.path as string || '';
            const result = await this.listDocumentation(path);
            return {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            };
          }

          case 'get_documentation': {
            const filePath = args?.file_path as string;
            if (!filePath) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Missing required parameter: file_path'
              );
            }
            const result = await this.getDocumentation(filePath);
            return {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            };
          }

          case 'search_documentation': {
            const query = args?.query as string;
            const caseSensitive = args?.case_sensitive as boolean || false;
            if (!query) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Missing required parameter: query'
              );
            }
            const result = await this.searchDocumentation(query, caseSensitive);
            return {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            };
          }

          case 'get_quick_rules': {
            const category = args?.category as string;
            const result = await this.getQuickRules(category);
            return {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            };
          }

          case 'get_all_standards': {
            const includeExamples = args?.include_examples !== false; // Default to true
            const sections = args?.sections as string[] || [];
            const result = await this.getAllStandards(includeExamples, sections);
            return {
              content: [
                {
                  type: 'text',
                  text: result,
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

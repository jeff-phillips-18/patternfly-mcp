# PatternFly MCP Server

A Model Context Protocol (MCP) server that provides access to PatternFly React development rules and documentation, built with Node.js and TypeScript.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI assistants to securely access external data sources and tools. This server provides a standardized way to expose PatternFly documentation and development rules to MCP-compatible clients.

## Features

- **TypeScript**: Full type safety and modern JavaScript features
- **PatternFly Documentation Access**: Browse, search, and retrieve PatternFly development rules
- **Comprehensive Rule Coverage**: Access setup, guidelines, components, charts, chatbot, and troubleshooting documentation
- **Smart Search**: Find specific rules and patterns across all documentation
- **Error Handling**: Robust error handling with proper MCP error codes
- **Modern Node.js**: Uses ES modules and the latest Node.js features

## Prerequisites

- Node.js 20.0.0 or higher
- npm or yarn package manager

## Installation

### For Development

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

### For Use with npx

After publishing to npm, you can use this server directly with npx:

```bash
npx @cdcabrera/pf-mcp
```

Or, to install locally in a project:
```bash
npm install @cdcabrera/pf-mcp
npx @cdcabrera/pf-mcp
```

## Development

### Scripts

- `npm run dev` - Run the server in development mode with hot reload
- `npm run build` - Build the TypeScript code to JavaScript
- `npm run start` - Start the built server
- `npm run watch` - Watch for changes and rebuild automatically
- `npm run clean` - Clean the build directory

### Running in Development

```bash
npm run dev
```

This will start the server using `tsx` for TypeScript execution without compilation.

## Usage

The MCP server communicates over stdio and provides access to PatternFly documentation through the following tools:

### Available Tools

#### `usePatternFlyDocs`
Fetch and return the content of one or more index documents (e.g., `llms.txt` or `README.md`) that enumerate or link to topic-specific docs. Typically you call this first, review the returned text to find specific doc URLs, then call `fetchDocs` next.

**Parameters:**
- `urlList` (array<string>, required): Each entry is either a fully-qualified URL (https://…) or a local file path to an index document. See “Local vs. docs-host mode” below for how local paths are resolved.

#### `fetchDocs`
Fetch and return the content of one or more specific documentation pages. Use this after you’ve identified URLs or files from a previous `usePatternFlyDocs` result.

**Parameters:**
- `urls` (array<string>, required): Each entry is either a fully-qualified URL or a local file path to a documentation file. See “Local vs. docs-host mode”.

#### `clearCache`
Clear internal memoization caches used for file and URL fetching.

**Parameters:**
- `scope` ("url" | "file" | "all", default: "all")

#### Local vs. docs-host mode
- By default (no flag), local file paths should reference files as they exist in this repo. Example:
  - `[YOUR_LOCAL_REPO_PATH]/documentation/chatbot/README.md`
- When running with the `--docs-host` flag, local file paths are resolved relative to the server’s `llms-files` directory. In this mode, pass entries that exist under `llms-files`. Example:
  - `react-core/6.0.0/llms.txt`

The server’s tool descriptions adapt to this mode: without `--docs-host` they list `.md` files from `documentation/`; with `--docs-host` they reference `llms.txt` files from `llms-files/`.

### Example Client Integration

To use this server with an MCP client, you typically need to configure the client to run this server as a subprocess. The exact configuration depends on your MCP client.

Example configuration for MCP clients using npx (see `mcp-config-example.json`):
```json
{
  "mcpServers": {
    "patternfly-docs": {
      "command": "npx",
      "args": ["-y", "@cdcabrera/pf-mcp@latest"],
      "description": "PatternFly React development rules and documentation"
    }
  }
}
```

For local development (without npx):
```json
{
  "mcpServers": {
    "patternfly-docs": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "[YOUR_LOCAL_REPO_PATH]",
      "description": "PatternFly React development rules and documentation"
    }
  }
}
```

### Example test commands using the inspector-cli:

#### usePatternFlyDocs (embedded guidelines, no --docs-host flag)
```
npx @modelcontextprotocol/inspector-cli \
  --config [YOUR_LOCAL_REPO_PATH]/mcp-config-example.json \
  --server patternfly-docs \
  --cli \
  --method tools/call \
  --tool-name usePatternFlyDocs \
  --tool-arg urlList='["[YOUR_LOCAL_REPO_PATH]/documentation/chatbot/README.md"]'
```

#### fetchDocs (remote URLs)
```
npx @modelcontextprotocol/inspector-cli \
  --config [YOUR_LOCAL_REPO_PATH]/mcp-config-example.json \
  --server patternfly-docs \
  --cli \
  --method tools/call \
  --tool-name fetchDocs \
  --tool-arg urls='["https://raw.githubusercontent.com/patternfly/patternfly-org/refs/heads/main/packages/documentation-site/patternfly-docs/content/design-guidelines/components/about-modal/about-modal.md", "https://raw.githubusercontent.com/patternfly/patternfly-org/refs/heads/main/packages/documentation-site/patternfly-docs/content/accessibility/components/about-modal/about-modal.md"]'
```

#### clearCache (optional)
```
npx @modelcontextprotocol/inspector-cli \
  --config [YOUR_LOCAL_REPO_PATH]/mcp-config-example.json \
  --server patternfly-docs \
  --cli \
  --method tools/call \
  --tool-name clearCache \
  --tool-arg scope='"all"'
```

#### Notes on inputs and behavior
- Both `usePatternFlyDocs` and `fetchDocs` accept a mix of fully-qualified URLs and local file paths.
- Duplicate entries are automatically deduplicated.
- Each fetched item is returned with a simple header and separated by a `---` divider.
- Failures are reported inline with a ❌ marker and the error message.

## Documentation Structure
TBD

## Publishing

To make this package available via npx, you need to publish it to npm:

1. Ensure you have an npm account and are logged in:
```bash
npm login
```

2. Update the version in package.json if needed:
```bash
npm version patch  # or minor/major
```

3. Publish to npm:
```bash
npm publish
```

After publishing, users can run your MCP server with:
```bash
npx @cdcabrera/pf-mcp
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 

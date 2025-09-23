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
- **Modern Node.js**: Uses ES modules and latest Node.js features

## Prerequisites

- Node.js 18.0.0 or higher
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
npx @jephilli-patternfly-docs/mcp
```

Or if installing locally in a project:
```bash
npm install @jephilli-patternfly-docs/mcp
npx @jephilli-patternfly-docs/mcp
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
Provides a list of URLs to `llms.txt` files that should be chosen to read for a particular context. These `llms.txt` files contain
a list of URLs to be read by the following `fetchDocs` tool.

**Parameters:**
- `urlList` (array of strings, required): Specific directory path to list (relative to the `llms-files` directory)

#### `fetchDocs`
Retrieves the full content of a specific PatternFly `llms.txt` files.

**Parameters:**
- `urls` (array of strings, required): Path to the documentation file (relative to documentation)

### Example Client Integration

To use this server with an MCP client, you typically need to configure the client to run this server as a subprocess. The exact configuration depends on your MCP client.

Example configuration for MCP clients using npx (see `mcp-config-example.json`):
```json
{
  "mcpServers": {
    "patternfly-docs": {
      "command": "npx",
      "args": ["-y", "@jephilli-patternfly-docs/mcp@latest"],
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
      "cwd": "/path/to/patternfly-mcp",
      "description": "PatternFly React development rules and documentation"
    }
  }
}
```

### Example test commands using the inspector-cli:

#### usePatternFlyDocs
```
npx @modelcontextprotocol/inspector-cli --config /Users/jeffreyphillips/.cursor/mcp.json --server patternfly-mcp-server --cli --method tools/call --tool-name usePatternFlyDocs --tool-arg urlList='["/Users/jeffreyphillips/repositories/patternfly-mcp/documentation/chatbot/README.md"]'
```

#### fetchDocs
```
npx @modelcontextprotocol/inspector-cli --config /Users/jeffreyphillips/.cursor/mcp.json --server patternfly-mcp-server --cli --method tools/call --tool-name fetchDocs --tool-arg urls='["https://raw.githubusercontent.com/patternfly/patternfly-org/refs/heads/main/packages/documentation-site/patternfly-docs/content/design-guidelines/components/about-modal/about-modal.md", "https://raw.githubusercontent.com/patternfly/patternfly-org/refs/heads/main/packages/documentation-site/patternfly-docs/content/accessibility/components/about-modal/about-modal.md"]'
```

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
npx @jephilli-patternfly-docs/mcp
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

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

#### `list_documentation`
Lists available PatternFly documentation categories and files.

**Parameters:**
- `path` (string, optional): Specific directory path to list (relative to documentation)

#### `get_documentation`
Retrieves the full content of a specific PatternFly documentation file.

**Parameters:**
- `file_path` (string, required): Path to the documentation file (relative to documentation)

#### `search_documentation`
Searches for specific text across all PatternFly documentation files.

**Parameters:**
- `query` (string, required): Text to search for in the documentation
- `case_sensitive` (boolean, optional): Whether the search should be case sensitive (default: false)

#### `get_quick_rules`
Gets essential PatternFly development rules and guidelines for specific categories.

**Parameters:**
- `category` (string, optional): Specific category of rules (charts, chatbot, component-groups, components, guidelines, resources, setup, troubleshooting). If not provided, returns overview of all categories.

#### `get_all_standards`
Gets comprehensive PatternFly standards and guidelines from all documentation in a single response.

**Parameters:**
- `include_examples` (boolean, optional): Whether to include code examples and detailed explanations (default: true)
- `sections` (array, optional): Specific sections to include (charts, chatbot, component-groups, components, guidelines, resources, setup, troubleshooting). If not provided, includes all sections.

### Example Client Integration

To use this server with an MCP client, you typically need to configure the client to run this server as a subprocess. The exact configuration depends on your MCP client.

Example configuration for MCP clients using npx (see `mcp-config-example.json`):
```json
{
  "mcpServers": {
    "patternfly-docs": {
      "command": "npx",
      "args": ["-y", "@jephilli-patternfly-docs/mcp@latest"]
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

## Project Structure

```
patternfly-mcp/
├── documentation/ # PatternFly development rules and guidelines
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript (after build)
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── mcp-config-example.json # Example MCP client configuration
├── .gitignore           # Git ignore patterns
└── README.md            # This file
```

## Documentation Structure

The server provides access to the PatternFly documentation located in `documentation/`:

- **charts/** - PatternFly Charts implementation rules
- **chatbot/** - PatternFly Chatbot component rules
- **component-groups/** - Component grouping and organization patterns
- **components/** - Component-specific usage rules and best practices
- **guidelines/** - Core development principles and standards
- **resources/** - External links and local documentation references
- **setup/** - Project initialization and environment setup rules
- **troubleshooting/** - Common issues and solutions

## Example Usage

### Browse Available Documentation
Use `list_documentation` to see what's available:
- List root categories: `list_documentation` (no parameters)
- List specific directory: `list_documentation` with `path: "guidelines"`

### Get Specific Rules
Use `get_documentation` to retrieve specific files:
- Get setup rules: `get_documentation` with `file_path: "setup/README.md"`
- Get styling standards: `get_documentation` with `file_path: "guidelines/styling-standards.md"`
- Get component groups rules: `get_documentation` with `file_path: "component-groups/README.md"`
- Get external links: `get_documentation` with `file_path: "resources/external-links.md"`

### Search for Specific Information
Use `search_documentation` to find relevant rules:
- Find all references to "v6": `search_documentation` with `query: "v6"`
- Search for accessibility rules: `search_documentation` with `query: "accessibility"`

### Quick Access to Essential Rules
Use `get_quick_rules` for common categories:
- Overview of all rules: `get_quick_rules` (no parameters)
- Specific category: `get_quick_rules` with `category: "components"`

### Comprehensive Standards Access
Use `get_all_standards` to get all PatternFly standards in one response:
- All standards with examples: `get_all_standards` (no parameters)
- All standards without code examples: `get_all_standards` with `include_examples: false`
- Only specific sections: `get_all_standards` with `sections: ["components", "guidelines"]`
- Component groups and charts only: `get_all_standards` with `sections: ["component-groups", "charts"]`

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
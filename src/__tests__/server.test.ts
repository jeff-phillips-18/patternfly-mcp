import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { runServer } from '../server';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

const MockMcpServer = McpServer as jest.MockedClass<typeof McpServer>;
const MockStdioServerTransport = StdioServerTransport as jest.MockedClass<typeof StdioServerTransport>;

describe('runServer', () => {
  let mockServer: any;
  let mockTransport: any;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock server instance
    mockServer = {
      registerTool: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    };

    // Mock transport instance
    mockTransport = {};

    MockMcpServer.mockImplementation(() => mockServer);
    MockStdioServerTransport.mockImplementation(() => mockTransport);

    // Spy on console methods
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should create MCP server with correct config', async () => {
    const mockOptions = {
      name: 'test-server',
      version: '1.0.0'
    };

    await runServer(mockOptions as any, { tools: [] });

    expect(MockMcpServer).toHaveBeenCalledWith(
      {
        name: 'test-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
  });

  it('should register tools', async () => {
    const mockTool1 = jest.fn().mockReturnValue([
      'tool1',
      { description: 'Tool 1', inputSchema: {} },
      jest.fn()
    ]);

    const mockTool2 = jest.fn().mockReturnValue([
      'tool2',
      { description: 'Tool 2', inputSchema: {} },
      jest.fn()
    ]);

    await runServer(undefined, { tools: [mockTool1, mockTool2] });

    expect(mockTool1).toHaveBeenCalled();
    expect(mockTool2).toHaveBeenCalled();
    expect(mockServer.registerTool).toHaveBeenCalledTimes(2);
    expect(mockServer.registerTool).toHaveBeenCalledWith('tool1', expect.any(Object), expect.any(Function));
    expect(mockServer.registerTool).toHaveBeenCalledWith('tool2', expect.any(Object), expect.any(Function));
  });

  it('should log registered tool names', async () => {
    const mockTool = jest.fn().mockReturnValue([
      'myTool',
      { description: 'My Tool', inputSchema: {} },
      jest.fn()
    ]);

    await runServer(undefined, { tools: [mockTool] });

    expect(consoleInfoSpy).toHaveBeenCalledWith('Registered tool: myTool');
  });

  it('should create transport and connect', async () => {
    await runServer(undefined, { tools: [] });

    expect(MockStdioServerTransport).toHaveBeenCalled();
    expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
  });

  it('should log success message after connection', async () => {
    await runServer(undefined, { tools: [] });

    expect(consoleLogSpy).toHaveBeenCalledWith('Patternfly MCP server running on stdio');
  });

  it('should handle errors during server creation', async () => {
    const error = new Error('Server creation failed');

    MockMcpServer.mockImplementation(() => {
      throw error;
    });

    await expect(runServer(undefined, { tools: [] })).rejects.toThrow('Server creation failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating MCP server:', error);
  });

  it('should handle errors during connection', async () => {
    const error = new Error('Connection failed');

    mockServer.connect.mockRejectedValue(error);

    await expect(runServer(undefined, { tools: [] })).rejects.toThrow('Connection failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating MCP server:', error);
  });

  it('should use default tools when none provided', async () => {
    // runServer should use default tools (usePatternFlyDocsTool, fetchDocsTool)
    await runServer();

    // Should register 2 default tools
    expect(mockServer.registerTool).toHaveBeenCalledTimes(2);
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringMatching(/^Registered tool:/));
  });
});

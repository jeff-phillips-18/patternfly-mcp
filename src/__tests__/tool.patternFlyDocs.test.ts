import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { usePatternFlyDocsTool } from '../tool.patternFlyDocs';
import { processDocsFunction } from '../server.getResources';

// Mock dependencies
jest.mock('../server.getResources');
jest.mock('../server.caching', () => ({
  memo: jest.fn(fn => fn)
}));

const mockProcessDocs = processDocsFunction as jest.MockedFunction<typeof processDocsFunction>;

describe('usePatternFlyDocsTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tool structure', () => {
    it('should return tuple with 3 elements', () => {
      const tool = usePatternFlyDocsTool();

      expect(tool).toHaveLength(3);
    });

    it('should have correct name', () => {
      const tool = usePatternFlyDocsTool();

      expect(tool[0]).toBe('usePatternFlyDocs');
    });

    it('should match structure snapshot', () => {
      const tool = usePatternFlyDocsTool();
      const [name, schema] = tool;

      expect({
        name,
        hasDescription: Boolean(schema.description),
        hasInputSchema: Boolean(schema.inputSchema)
      }).toMatchSnapshot();
    });
  });

  describe('callback', () => {
    it('should process urlList successfully', async () => {
      mockProcessDocs.mockResolvedValue('# PatternFly Button\n\nButton component docs');

      const tool = usePatternFlyDocsTool();
      const callback = tool[2];
      const result = await callback({ urlList: ['components/button.md'] });

      expect(mockProcessDocs).toHaveBeenCalledWith(['components/button.md']);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '# PatternFly Button\n\nButton component docs'
          }
        ]
      });
    });

    it('should throw error when urlList is missing', async () => {
      const tool = usePatternFlyDocsTool();
      const callback = tool[2];

      await expect(callback({})).rejects.toThrow(McpError);
      await expect(callback({})).rejects.toThrow('Missing required parameter: urlList');
    });

    it('should throw error when urlList is not an array', async () => {
      const tool = usePatternFlyDocsTool();
      const callback = tool[2];

      await expect(callback({ urlList: 'not-an-array' })).rejects.toThrow(McpError);
      await expect(callback({ urlList: 'not-an-array' })).rejects.toThrow('must be an array of strings');
    });

    it('should throw error when urlList is null', async () => {
      const tool = usePatternFlyDocsTool();
      const callback = tool[2];

      await expect(callback({ urlList: null })).rejects.toThrow(McpError);
    });

    it('should handle processing errors', async () => {
      mockProcessDocs.mockRejectedValue(new Error('File not found'));

      const tool = usePatternFlyDocsTool();
      const callback = tool[2];

      await expect(callback({ urlList: ['missing.md'] })).rejects.toThrow(McpError);
      await expect(callback({ urlList: ['missing.md'] })).rejects.toThrow('Failed to fetch documentation');
    });

    it('should handle empty urlList', async () => {
      mockProcessDocs.mockResolvedValue('');

      const tool = usePatternFlyDocsTool();
      const callback = tool[2];
      const result = await callback({ urlList: [] });

      expect(mockProcessDocs).toHaveBeenCalledWith([]);
      expect(result.content[0].text).toBe('');
    });

    it('should handle multiple URLs', async () => {
      mockProcessDocs.mockResolvedValue('Combined docs content');

      const tool = usePatternFlyDocsTool();
      const callback = tool[2];
      const result = await callback({ urlList: ['file1.md', 'file2.md', 'file3.md'] });

      expect(mockProcessDocs).toHaveBeenCalledWith(['file1.md', 'file2.md', 'file3.md']);
      expect(result.content[0].text).toBe('Combined docs content');
    });
  });
});

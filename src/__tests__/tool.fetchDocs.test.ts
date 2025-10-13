import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { fetchDocsTool } from '../tool.fetchDocs';
import { processDocsFunction } from '../server.getResources';

// Mock dependencies
jest.mock('../server.getResources');
jest.mock('../server.caching', () => ({
  memo: jest.fn(fn => fn)
}));

const mockProcessDocs = processDocsFunction as jest.MockedFunction<typeof processDocsFunction>;

describe('fetchDocsTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tool structure', () => {
    it('should return tuple with 3 elements', () => {
      const tool = fetchDocsTool();

      expect(tool).toHaveLength(3);
    });

    it('should have correct name', () => {
      const tool = fetchDocsTool();

      expect(tool[0]).toBe('fetchDocs');
    });

    it('should match structure snapshot', () => {
      const tool = fetchDocsTool();
      const [name, schema] = tool;

      expect({
        name,
        description: schema.description,
        hasInputSchema: Boolean(schema.inputSchema)
      }).toMatchSnapshot();
    });
  });

  describe('callback', () => {
    it('should process urlList successfully', async () => {
      mockProcessDocs.mockResolvedValue('# Doc 1\n\ncontent 1\n\n---\n\n# Doc 2\n\ncontent 2');

      const tool = fetchDocsTool();
      const callback = tool[2];
      const result = await callback({ urlList: ['file1.md', 'file2.md'] });

      expect(mockProcessDocs).toHaveBeenCalledWith(['file1.md', 'file2.md']);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '# Doc 1\n\ncontent 1\n\n---\n\n# Doc 2\n\ncontent 2'
          }
        ]
      });
    });

    it('should throw error when urlList is missing', async () => {
      const tool = fetchDocsTool();
      const callback = tool[2];

      await expect(callback({})).rejects.toThrow(McpError);
      await expect(callback({})).rejects.toThrow('Missing required parameter: urlList');
    });

    it('should throw error when urlList is not an array', async () => {
      const tool = fetchDocsTool();
      const callback = tool[2];

      await expect(callback({ urlList: 'not-an-array' })).rejects.toThrow(McpError);
      await expect(callback({ urlList: 'not-an-array' })).rejects.toThrow('must be an array of strings');
    });

    it('should throw error when urlList is null', async () => {
      const tool = fetchDocsTool();
      const callback = tool[2];

      await expect(callback({ urlList: null })).rejects.toThrow(McpError);
    });

    it('should handle processing errors', async () => {
      mockProcessDocs.mockRejectedValue(new Error('Network error'));

      const tool = fetchDocsTool();
      const callback = tool[2];

      await expect(callback({ urlList: ['file.md'] })).rejects.toThrow(McpError);
      await expect(callback({ urlList: ['file.md'] })).rejects.toThrow('Failed to fetch documentation');
    });

    it('should handle empty urlList', async () => {
      mockProcessDocs.mockResolvedValue('');

      const tool = fetchDocsTool();
      const callback = tool[2];
      const result = await callback({ urlList: [] });

      expect(mockProcessDocs).toHaveBeenCalledWith([]);
      expect(result.content[0].text).toBe('');
    });
  });
});

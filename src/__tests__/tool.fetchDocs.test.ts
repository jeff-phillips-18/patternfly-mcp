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

  it('should have a consistent return structure', () => {
    const tool = fetchDocsTool();

    expect(tool).toMatchSnapshot('structure');
  });
});

describe('fetchDocsTool, callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      description: 'default',
      value: 'components/button.md',
      urlList: ['components/button.md']
    },
    {
      description: 'multiple files',
      value: 'combined docs content',
      urlList: ['components/button.md', 'components/card.md', 'components/table.md']
    },
    {
      description: 'with empty files',
      value: 'trimmed content',
      urlList: ['components/button.md', '', '   ', 'components/card.md', 'components/table.md']
    },
    {
      description: 'with empty urlList',
      value: 'empty content',
      urlList: []
    },
    {
      description: 'with empty strings in a urlList',
      value: 'trimmed and empty content',
      urlList: ['', ' ']
    },
    {
      description: 'with invalid urlList',
      value: 'invalid path',
      urlList: ['invalid-url']
    }
  ])('should parse parameters, $description', async ({ value, urlList }) => {
    mockProcessDocs.mockResolvedValue(value);
    const [_name, _schema, callback] = fetchDocsTool();
    const result = await callback({ urlList });

    expect(mockProcessDocs).toHaveBeenCalledWith(urlList);
    expect(result).toMatchSnapshot();
  });

  it.each([
    {
      description: 'with missing or undefined urlList',
      error: 'Missing required parameter: urlList',
      urlList: undefined
    },
    {
      description: 'with null urlList',
      error: 'Missing required parameter: urlList',
      urlList: null
    },
    {
      description: 'when urlList is not an array',
      error: 'must be an array of strings',
      urlList: 'not-an-array'
    }
  ])('should handle errors, $description', async ({ error, urlList }) => {
    const [_name, _schema, callback] = fetchDocsTool();

    await expect(callback({ urlList })).rejects.toThrow(McpError);
    await expect(callback({ urlList })).rejects.toThrow(error);
  });

  it('should handle processing errors', async () => {
    mockProcessDocs.mockRejectedValue(new Error('Network error'));
    const [_name, _schema, callback] = fetchDocsTool();

    await expect(callback({ urlList: ['missing.md'] })).rejects.toThrow(McpError);
    await expect(callback({ urlList: ['missing.md'] })).rejects.toThrow('Failed to fetch documentation');
  });
});

import { fetchDocsTool } from '../tool.fetchDocs';

describe('fetchDocsTool', () => {
  it('should be defined', () => {
    expect(fetchDocsTool).toBeDefined();
  });

  it('should create tool without parameters', () => {
    const tool = fetchDocsTool();
    expect(tool).toHaveLength(3);
    expect(tool[0]).toBe('fetchDocs');
  });
});

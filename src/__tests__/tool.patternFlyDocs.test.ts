import { usePatternFlyDocsTool } from '../tool.patternFlyDocs';

describe('usePatternFlyDocsTool', () => {
  it('should be defined', () => {
    expect(usePatternFlyDocsTool).toBeDefined();
  });

  it('should create tool without parameters', () => {
    const tool = usePatternFlyDocsTool();
    expect(tool).toHaveLength(3);
    expect(tool[0]).toBe('usePatternFlyDocs');
  });
});

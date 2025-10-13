import * as options from '../options';
import { parseCliOptions, freezeOptions, OPTIONS } from '../options';

describe('options', () => {
  it('should return specific properties', () => {
    expect(options).toMatchSnapshot();
  });
});

describe('parseCliOptions', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should attempt to parse --docs-host flag', () => {
    process.argv = ['node', 'script.js', '--docs-host'];

    const result = parseCliOptions();

    expect(result.docsHost).toBe(true);
  });

  it('should attempt to return false for docsHost when flag is not present', () => {
    process.argv = ['node', 'script.js'];

    const result = parseCliOptions();

    expect(result.docsHost).toBe(false);
  });

  it('should attempt to handle other arguments', () => {
    process.argv = ['node', 'script.js', 'other', 'args'];

    const result = parseCliOptions();

    expect(result.docsHost).toBe(false);
  });
});

describe('freezeOptions', () => {
  it('should return frozen options with consistent properties', () => {
    const result = freezeOptions({ docsHost: true });

    expect(Object.isFrozen(result)).toBe(true);
    expect(result).toBe(OPTIONS);
    expect(result).toMatchSnapshot('frozen');
  });
});

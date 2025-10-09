import * as options from '../options';

describe('options', () => {
  it('should have expected values', () => {
    expect(options).toMatchSnapshot();
  });
});

import { readLocalFileFunction, fetchUrlFunction, resolveLocalPathFunction, processDocsFunction } from '../server.getResources';

describe('readLocalFileFunction', () => {
  it('should be defined', () => {
    expect(readLocalFileFunction).toBeDefined();
  });
});

describe('fetchUrlFunction', () => {
  it('should be defined', () => {
    expect(fetchUrlFunction).toBeDefined();
  });
});

describe('resolveLocalPathFunction', () => {
  it('should be defined', () => {
    expect(resolveLocalPathFunction).toBeDefined();
  });
});

describe('processDocsFunction', () => {
  it('should be defined', () => {
    expect(processDocsFunction).toBeDefined();
  });
});

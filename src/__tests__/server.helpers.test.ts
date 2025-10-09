import helpers, { generateHash } from '../server.helpers';

describe('Helpers', () => {
  it('should return specific properties', () => {
    expect(Object.keys(helpers)).toMatchSnapshot('specific properties');
  });

  it('should minimally generate a consistent hash', () => {
    expect({
      valueObject: generateHash({ lorem: 'ipsum', dolor: ['sit', null, undefined, 1, () => 'hello world'] }),
      valueObjectConfirm:
        generateHash({ lorem: 'ipsum', dolor: ['sit', null, undefined, 1, () => 'hello world'] }) ===
        generateHash({ lorem: 'ipsum', dolor: ['sit', null, undefined, 1, () => 'hello world'] }),
      valueObjectConfirmSort:
        generateHash({ lorem: 'ipsum', dolor: ['sit', null, undefined, 1, () => 'hello world'] }) ===
        generateHash({ dolor: ['sit', null, undefined, 1, () => 'hello world'], lorem: 'ipsum' }),
      valueInt: generateHash(200),
      valueFloat: generateHash(20.000006),
      valueNull: generateHash(null),
      valueUndefined: generateHash(undefined),
      valueArray: generateHash([1, 2, 3]),
      valueArraySort: generateHash([3, 2, 1]),
      valueArrayConfirmSort: generateHash([1, 2, 3]) !== generateHash([3, 2, 1]),
      valueSet: generateHash(new Set([1, 2, 3])),
      valueSetConfirmSort: generateHash(new Set([1, 2, 3])) === generateHash(new Set([3, 2, 1])),
      valueSymbol: generateHash(Symbol('lorem ipsum')),
      valueSymbolUndefined: generateHash(Symbol('lorem ipsum')) === generateHash(undefined),
      valueBoolTrue: generateHash(true),
      valueBoolFalse: generateHash(false)
    }).toMatchSnapshot('hash, object and primitive values');
  });
});

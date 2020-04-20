import { middlewares } from './middleware';

xdescribe('store/middlewares', () => {
  it('is an array of middleware functions', () => {
    expect(middlewares).toHaveLength(4);
  });
});

describe('store/makeEnhancers', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns a stanard redux funcitons', () => {
    // eslint-disable-next-line global-require
    const { makeEnhancers } = require('./middleware');
    const enhancers = makeEnhancers();
    expect(typeof enhancers).toBe('function');
  });

  it('returns overridden enhancers functions for redux dev tools', () => {
    const composeMock = jest.fn();
    global.__DEV__ = true;
    global.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = composeMock;

    // eslint-disable-next-line global-require
    const { makeEnhancers } = require('./middleware');
    makeEnhancers();
    expect(composeMock).toHaveBeenCalled();
  });
});

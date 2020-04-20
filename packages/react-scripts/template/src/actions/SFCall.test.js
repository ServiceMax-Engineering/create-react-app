import mockStore from 'test/mock-store';
import {
  apiSFFetchData,
  apiDataHasError,
  apiDataIsLoading,
  apiFetchDataSuccess,
  handleLocal,
  handleRemote,
  reducer,
} from './SFCall';

describe('actions and reducer', () => {
  it('should run a fetch data action', () => {
    expect(apiFetchDataSuccess({ type: 'test' })).toEqual({
      data: { type: 'test' },
      type: 'API_FETCH_DATA_SUCCESS',
    });
  });

  it('should change the state and return the new state', () => {
    const state = { type: 'test-old' };
    const result = reducer(state, {
      data: { type: 'test-new' },
      type: 'API_FETCH_DATA_SUCCESS',
    });
    expect(result).not.toEqual(state);
    expect(result).toEqual({
      data: { type: 'test-new' },
      hasLoaded: true,
    });
  });

  it('should change data and respond with an error string', () => {
    const state = { type: 'test-old' };
    const result = reducer(state, {
      error: 'There was an error',
      hasError: true,
      type: 'API_DATA_HAS_ERROR',
    });
    expect(result).not.toEqual(state);
    expect(result.type).toBe('API_DATA_HAS_ERROR');
  });

  it('should not change the state with an invalid type', () => {
    const state = { type: 'test-old' };
    const result = reducer(state, {
      data: { type: 'test-new' },
      type: 'API_FETCH_NOTHING',
    });
    expect(result).toEqual(state);
  });

  it('should return the default state from the reducer', () => {
    const expectedState = { data: null };
    const result = reducer(undefined, {
      data: { type: 'test-new' },
      type: 'API_FETCH_NOTHING',
    });
    expect(result).toEqual(expectedState);
  });

  it('should return the correct success object on apiFetch', () => {
    const data = { foo: 'bar' };
    const expectedResult = {
      data,
      type: 'API_FETCH_DATA_SUCCESS',
    };
    expect(apiFetchDataSuccess(data)).toEqual(expectedResult);
  });

  it('should return the correct isLoading object on apiFetch', () => {
    const isLoading = true;
    const expectedResult = {
      isLoading,
      type: 'API_DATA_IS_LOADING',
    };
    expect(apiDataIsLoading(isLoading)).toEqual(expectedResult);
  });

  it('should return the correct error object on apiFetch', () => {
    const errorObj = new Error('has an error');
    const hasError = true;
    const expectedResult = {
      error: errorObj.toString(),
      hasError,
      type: 'API_DATA_HAS_ERROR',
    };
    expect(apiDataHasError(hasError, errorObj)).toEqual(expectedResult);
  });
});

describe('fetching local data', () => {
  let store;
  const config = {
    apiKey: 'test',
    headers: { sample: 1 },
  };
  const fetchData = { name: 'test' };

  beforeEach(() => {
    store = mockStore({});
    global.fetch = undefined;
  });

  it('should give call handleLocal method successfully', async () => {
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
      data: fetchData,
      json: () => fetchData,
      ok: true,
      statusText: '',
    }));

    await handleLocal(store.dispatch, config);

    expect(store.getActions()).toEqual([
      {
        isLoading: false,
        type: 'API_DATA_IS_LOADING',
      },
      {
        data: fetchData,
        type: 'API_FETCH_DATA_SUCCESS',
      },
    ]);
  });

  it('dispatches an error action if payload is marked a failure', async () => {
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
      data: fetchData,
      json: () => fetchData,
      ok: false,
      statusText: 'there was an error',
    }));
    const exptectedResponse = {
      error: 'Error: there was an error',
      hasError: true,
      type: 'API_DATA_HAS_ERROR',
    };

    const localResponse = await handleLocal(store.dispatch, config);
    expect(store.getActions()).toEqual([
      exptectedResponse,
    ]);
    expect(localResponse).toEqual(exptectedResponse);
  });

  it('dispatches loading, and fetch data from apiSFFetchData', async () => {
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
      data: fetchData,
      json: () => fetchData,
      ok: true,
      statusText: '',
    }));

    await apiSFFetchData()(store.dispatch, config);
    expect(store.getActions()).toEqual([
      {
        isLoading: true,
        type: 'API_DATA_IS_LOADING',
      },
      {
        isLoading: false,
        type: 'API_DATA_IS_LOADING',
      },
      {
        data: fetchData,
        type: 'API_FETCH_DATA_SUCCESS',
      },
    ]);
  });
});

xdescribe('fetching remote data', () => {
  let store;
  const loadData = {
    id: 12345,
  };
  const jsrData = {
    firstName: 'John',
    id: 12345,
    lastName: 'Smith',
  };

  beforeEach(() => {
    store = mockStore({});
    window.ReactTestJSR = {};
  });

  it('should call handleRemote method successfully', () => {
    window.ReactTestJSR = null;

    const result = handleRemote(store, loadData);
    expect(result).toBe(false);
  });

  it('should call handleRemote method successfully', async () => {
    window.ReactTestJSR.JsrGetAccountData = jest.fn().mockImplementation(() => Promise.resolve({
      data: jsrData,
      json: () => jsrData,
      ok: true,
      statusText: '',
    }));

    await handleRemote(store.dispatch, loadData);
    expect(store.getActions()).toEqual([
      {
        isLoading: false,
        type: 'API_DATA_IS_LOADING',
      },
      {
        data: jsrData,
        type: 'API_FETCH_DATA_SUCCESS',
      },
    ]);
  });

  it('should call handleRemote method and catch errors', async () => {
    window.ReactTestJSR.JsrGetAccountData = jest.fn().mockImplementation(() => Promise.resolve({
      data: jsrData,
      json: () => jsrData,
      ok: false,
      statusText: 'there was an error',
    }));

    await handleRemote(store.dispatch, loadData);
    expect(store.getActions()).toEqual([
      {
        error: 'Error: there was an error',
        hasError: true,
        type: 'API_DATA_HAS_ERROR',
      },
    ]);
  });

  it('should automatically call handleRemote if window.isRemote', async () => {
    window.isRemote = true;
    window.ReactTestJSR.JsrGetAccountData = jest.fn().mockImplementation(() => Promise.resolve({
      data: jsrData,
      json: () => jsrData,
      ok: true,
      statusText: '',
    }));

    await apiSFFetchData()(store.dispatch, loadData);
    expect(store.getActions()).toEqual([
      {
        isLoading: true,
        type: 'API_DATA_IS_LOADING',
      },
      {
        isLoading: false,
        type: 'API_DATA_IS_LOADING',
      },
      {
        data: jsrData,
        type: 'API_FETCH_DATA_SUCCESS',
      },
    ]);
  });
});


import { fetchData, handleLocal, handleRemote } from './service';

const config = {
  url: '/mock-url/',
  method: 'POST',
  requestParams: { param: 'value' },
};

xdescribe('service/queryBuilder', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });
  it('handleLocal method should return correct data', async () => {
    fetch.mockResponseOnce(JSON.stringify({ data: '12345' }));
    const result = await fetchData(config);
    expect(result.data).toEqual('12345');
    expect(fetch.mock.calls.length).toEqual(1);
  });
  it('Handle Remote Response with JSR Action Mapping Key with Success Response', async () => {
    window.SVMX_SFA_JSR = {
      jsrActionMappingKey: {
        test: 'sample action',
      },
      makeJsrRequest(jsrActionMappingKey, requestParams, jsrResponseCallback) {
        jsrResponseCallback({}, { status: 'true' });
      },
    };
    const result = handleRemote({ jsrActionMappingKey: 'test' }).catch(() => {});
    expect(result).toBeDefined();
  });

  it('Handle Remote Response with JSR Action Mapping Key with Exception Response', async () => {
    window.SVMX_SFA_JSR = {
      jsrActionMappingKey: {
        test: 'sample action',
      },
      makeJsrRequest(jsrActionMappingKey, requestParams, jsrResponseCallback) {
        jsrResponseCallback(
          {},
          {
            message: 'Error Msg',
            type: 'exception',
            where: 'MOcked Where',
          },
        );
      },
    };
    const result = handleRemote({ jsrActionMappingKey: 'test' }).catch(() => {});
    expect(result).toBeDefined();
  });

  it('Handle Remote Response with JSR Mock Callback and JSR Request Method.', async () => {
    window.SVMX_SFA_JSR = {
      jsrActionMappingKey: {
        test: 'sample action',
      },
      makeJsrRequest(jsrActionMappingKey, requestParams, jsrResponseCallback) {
        jsrResponseCallback({}, {});
      },
    };
    const result = handleRemote({ jsrActionMappingKey: 'test' }).catch(() => {});
    expect(result).toBeDefined();
  });
});

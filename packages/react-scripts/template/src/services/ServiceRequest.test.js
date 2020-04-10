import ServiceRequest, { buildApiUrl } from './ServiceRequest';

const { apiStartPointConfig } = ServiceRequest;
describe('ServiceRequest', () => {
  it('should give empty url if give empty', () => {
    const result = ServiceRequest({ url: '' });
    expect(result.url).toEqual('');
  });

  it('should give GET method no method', () => {
    const result = ServiceRequest({ url: '' });
    expect(result.url).toEqual('');
    expect(result.method).toEqual('GET');
  });

  it('should give request url with appended params', () => {
    const esc = encodeURIComponent;
    // eslint-disable-next-line max-len
    const query = `${apiStartPointConfig.getRequestProxyPrefix}?url=${apiStartPointConfig.urlPrefix}${apiStartPointConfig.orgNamespace}` +
    `${apiStartPointConfig.urlSuffix}/test_Get/?${esc('data')}=${esc('test')}`;
    const result = ServiceRequest({
      method: 'GET',
      params: {
        data: 'test',
      },
      url: '/test_Get/',
    });
    expect(result.method).toEqual('GET');
    expect(result.url).toEqual(query);
  });

  it('should give request url without appended params if pramas value is undefined', () => {
  // eslint-disable-next-line max-len
    const query = `${apiStartPointConfig.getRequestProxyPrefix}?url=${apiStartPointConfig.urlPrefix}${apiStartPointConfig.orgNamespace}${apiStartPointConfig.urlSuffix}/test_Get/`;
    const result = ServiceRequest({
      params: {
        data: undefined,
      },
      url: '/test_Get/',
    });
    expect(result.method).toEqual('GET');
    expect(result.url).toEqual(query);
  });

  it('should give request only url in case params are not defined', () => {
  // eslint-disable-next-line max-len
    const query = `${apiStartPointConfig.getRequestProxyPrefix}?url=${apiStartPointConfig.urlPrefix}${apiStartPointConfig.orgNamespace}${apiStartPointConfig.urlSuffix}/?test_Get/`;
    const result = ServiceRequest({ url: '/?test_Get/' });
    expect(result.method).toEqual('GET');
    expect(result.url).toEqual(query);
  });

  xit('should give request url with post request', () => {
    const result = ServiceRequest({
      body: {
        data: 'test',
      },
      method: 'POST',
      url: '/test_Post/',
    });
    // eslint-disable-next-line max-len
    const query = `${apiStartPointConfig.postRequestProxyPrefix}?url=${apiStartPointConfig.urlPrefix}${apiStartPointConfig.orgNamespace}${apiStartPointConfig.urlSuffix}/test_Post/`;
    expect(result.url).toEqual(query);
    expect(result.method).toEqual('POST');
  });

  it('should give appended request url with post request testing buildAPIPath', () => {
    const result = buildApiUrl('/test_Post/', {
      body: {
        data: 'test',
      },
      method: 'POST',
    });
    // eslint-disable-next-line max-len
    const query = `${apiStartPointConfig.postRequestProxyPrefix}?url=${apiStartPointConfig.urlPrefix}${apiStartPointConfig.orgNamespace}${apiStartPointConfig.urlSuffix}/test_Post/`;
    expect(result).toEqual(query);
  });

  it('should give empty url with post request testing buildAPIPath', () => {
    const result = buildApiUrl('');
    expect(result).toEqual('');
  });

  it('should give empty url when method is not defined', () => {
    const result = buildApiUrl('test', { method: '' });
    expect(result).toEqual('');
  });

  xit('should give request url with post request with Headers', () => {
    window.enableHttpHeaders = true;
    // eslint-disable-next-line max-len
    const result = ServiceRequest({
      body: {
        data: 'test',
      },
      headers: {
        test: 1,
      },
      method: 'POST',
      url: '/test_Post/',
    });
    // eslint-disable-next-line max-len
    const query = `${apiStartPointConfig.postRequestProxyPrefix}?url=${apiStartPointConfig.urlPrefix}${apiStartPointConfig.orgNamespace}${apiStartPointConfig.urlSuffix}/test_Post/`;
    expect(result.url).toEqual(query);
    expect(result.method).toEqual('POST');
  });
});

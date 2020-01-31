import React from 'react';
import LCC from 'lightning-container';
const localhostServUrl = 'http://localhost:5000';

export function apiFetchDataSuccess(data) {
  return {
    data,
    type: 'API_FETCH_DATA_SUCCESS',
  };
}

export function apiDataIsLoading(bool) {
  return {
    isLoading: bool,
    type: 'API_DATA_IS_LOADING',
  };
}

export function apiDataHasError(bool, error) {
  return {
    error: error.toString(),
    hasError: bool,
    type: 'API_DATA_HAS_ERROR',
  };
}

function processResult(result, event, callback, context) {
  let ret = { success: false };
  if (event.status === true) {
    // typically replace is not required
    // in this case controller is returning the JSON.serialize(objSFA_RestResponse) hence replace
    ret = JSON.parse(result.replace(/&quot;/g, '"'));
  }
  callback.call(context, ret, event);
}

function makeJsrRequest(
  jsrActionMappingKey,
  requestParams, // Actual Request Params will go here..
  callback,
  context,
) {
  const requestParamsStr = JSON.stringify(requestParams);
  LCC.callApex(
    `SVMXDEV.SFA_Configuration.${jsrActionMappingKey}`,
    requestParamsStr,
    (result, event) => {
      processResult(result, event, callback, context);
    },
    { escape: true },
  );
}

/**
 *
 * @param {request configuration} config
 * @RemoteAction Apex Controller method calls from LCC.callApex
 */
export function handleRemoteCallApex(config) {
  const { jsrActionMappingKey, requestParams = {} } = config;
  const jsrResponseAsPromise = new Promise((resolve, reject) => {
    const jsrResponseCallback = (jsrResult, jsrEvent) => {
      if (jsrEvent.status) {
        resolve(jsrResult);
      } else if (jsrEvent.type === 'exception') {
        // eslint-disable-next-line no-console
        console.error('JSR Exception Event Type :', jsrEvent);
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({
          message: jsrEvent.message,
          success: false,
        });
      } else {
        // eslint-disable-next-line no-console
        console.error('JSR Unknown Response Event Type::', jsrEvent);
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({
          message: jsrEvent.message,
          success: false,
        });
      }
    };

    if (jsrActionMappingKey) {
      makeJsrRequest(
        jsrActionMappingKey,
        requestParams, // Actual Request Params will go here..
        jsrResponseCallback,
        this,
      );
    } else {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject({
        error: 'jsrActionMappingKey not defined in the request.',
        success: false,
      });
    }
  });
  return jsrResponseAsPromise;
}

export function handleLocal(dispatch, config) {
  // This url is the external Salesforce URL that gets executed by the local node server
  const url = '/services/data/v41.0/query?q=Select Id, Name from Account Limit 5';

  // Call "through" the local node server for local development
  return fetch(`${localhostServUrl}/get?url=${url}`, config)
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      dispatch(apiDataIsLoading(false));
      return response;
    })
    .then(response => response.json())
    .then(data => dispatch(apiFetchDataSuccess(data)))
    .catch((error) => dispatch(apiDataHasError(true, error)));
}

export function handleRemoteInvokeAction(dispatch, loadData) {
  if (window && window.ReactTestJSR) {
    return window.ReactTestJSR.JsrGetAccountData(loadData)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        dispatch(apiDataIsLoading(false));
        return response;
      })
      .then(response => response.json())
      .then(data => dispatch(apiFetchDataSuccess(data)))
      .catch((error) => dispatch(apiDataHasError(true, error)));
  }
  return false;
}

export function apiSFFetchData() {
  return (dispatch, config) => {
    dispatch(apiDataIsLoading(true));
    if (window && window.isRemote) {
      if(typeof isTargetLightningPage !== 'undefined' && isTargetLightningPage) {
        return handleRemoteCallApex(dispatch, config);
      }
      
      return handleRemoteInvokeAction(dispatch, config);
    }
    return handleLocal(dispatch, config);
  };
}

const initialState = {
  data: null,
};

export function reducer(state = initialState, action) {
  switch (action.type) {
    case 'API_FETCH_DATA_SUCCESS':
      return {
        data: action.data,
        hasLoaded: true,
      };
    case 'API_DATA_HAS_ERROR':
      action.error = (
        <React.Fragment>
          <p>{action.error}</p>
          <p>Make sure that <tt>npm run sf-server</tt> is running.</p>
        </React.Fragment>
      );
      return {
        ...action,
        hasLoaded: true,
      };
    default:
      return state;
  }
}

import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  mapDispatchToProps,
  mapStateToProps,
  SFAPICallContainer,
} from './SFAPICallContainer';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('SFAPICallContainer', () => {
  let store;

  beforeEach(() => {
    store = mockStore({});
  });

  afterEach(() => {
    store = null;
  });

  it('renders without crashing', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <SFAPICallContainer />
      </Provider>);
    expect(wrapper).toBeDefined();
  });

  it('maps state and dispatch to props', () => {
    const fetchDataMock = jest.fn();
    const wrapper = shallow(<Provider store={store}>
      <SFAPICallContainer fetchData={fetchDataMock} />
    </Provider>);
    expect(wrapper.props()).toEqual(expect.objectContaining({
      fetchData: fetchDataMock,
    }));
  });

  it('calls mapStateToProps properly', () => {
    const mockData = {
      data: true,
      hasLoaded: true,
    };
    const mockState = {
      SFCall: mockData,
    };
    const result = mapStateToProps(mockState);
    expect(result).toEqual(mockData);
  });

  xit('calls mapDispatchToProps properly', () => {
    const mockDispatch = jest.fn();
    const result = mapDispatchToProps(mockDispatch);
    expect(result).toEqual(expect.objectContaining({
      fetchData: expect.any(Function),
    }));

    result.fetchData('');
    expect(mockDispatch).toHaveBeenCalled();
  });
});

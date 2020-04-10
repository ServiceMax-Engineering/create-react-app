import React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router';
import mockStore from 'test/mock-store';
import { Route } from 'react-router-dom';
import Routes from './Routes';

describe('Routes', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = mockStore();
  });

  afterEach(() => {
    store = null;
    wrapper = null;
  });

  it('root url should redirect to /hello', () => {
    wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <Routes />
        </MemoryRouter>
      </Provider>);
    expect(wrapper).toBeDefined();
    expect(wrapper.find(Route)).toHaveLength(2);
    expect(wrapper.find(Route).at(0).prop('path')).toBe('/hello');
  });

  it('invalid url should redirect to /hello', () => {
    wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/random']}>
          <Routes />
        </MemoryRouter>
      </Provider>);
    expect(wrapper).toBeDefined();
    expect(wrapper.find(Route)).toHaveLength(2);
    expect(wrapper.find(Route).at(0).prop('path')).toBe('/hello');
  });

  it('/hello url should render the HelloContainer route', () => {
    wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/hello']}>
          <Routes />
        </MemoryRouter>
      </Provider>);
    expect(wrapper).toBeDefined();
    expect(wrapper.find(Route)).toHaveLength(2);
    expect(wrapper.find(Route).at(0).prop('path')).toBe('/hello');
  });

  it('/apicall url should render the APICallContainer route', () => {
    wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/apicall']}>
          <Routes />
        </MemoryRouter>
      </Provider>);
    expect(wrapper).toBeDefined();
    expect(wrapper.find(Route)).toHaveLength(2);
    expect(wrapper.find(Route).at(0).prop('path')).toBe('/apicall');
  });

  xit('/sfapicall url should render the SFAPICallContainer route', () => {
    wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/sfapicall']}>
          <Routes />
        </MemoryRouter>
      </Provider>);
    expect(wrapper).toBeDefined();
    expect(wrapper.find(Route)).toHaveLength(2);
    expect(wrapper.find(Route).at(0).prop('path')).toBe('/sfapicall');
  });
});

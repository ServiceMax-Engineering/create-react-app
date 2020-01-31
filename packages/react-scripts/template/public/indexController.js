({
  doInit: function(cmp) {
    // Set the attribute value.
    var msg = {
      ASSET_ROOT: '/_slds/',
    };
    cmp.find('SFAReactApp').message(msg);
  },

  // To send/or receive message between aura component and ReactJS App in pub/sub passion
  sendMessage: function(component, event, helper) {
    var msg = {
      name: 'General',
      value: component.get('v.messageToSend'),
    };
    component.find('SFAReactApp').message(msg);
  },
  handleMessage: function(component, message, helper) {
    var payload = message.payload;
    var name = payload.name;
    if (name === 'General') {
      var value = payload.value;
      component.set('v.messageReceived', value);
    } else if (name === 'Foo') {
      // A different response
    }
  },
});

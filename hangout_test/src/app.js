function init() {
  gapi.hangout.onApiReady.add(function(eventObj) {
    if (eventObj.isApiReady) {
      console.log('ready');
    }
  });
}

gadgets.util.registerOnLoadHandler(init);

function init() {
  console.log('app init');

  gapi.hangout.onParticipantsAdded.add(function (participants) {
    console.log('onParticipantsAdded', participants);
  });
}

gadgets.util.registerOnLoadHandler(function () {
  gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
      init();
    }
  });
});

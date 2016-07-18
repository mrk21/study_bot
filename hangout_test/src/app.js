function showParticipants() {
  var participants = gapi.hangout.getParticipants();
  var ul = document.getElementById('participants');

  participants.forEach(function (participant) {
    var li = document.createElement('li');
    console.log(participant.person.displayName);
    li.innerHTML = participant.person.displayName;
    ul.appendChild(li);
  });
}

function init() {
  console.log('app init');
  console.log('getEnabledParticipants', gapi.hangout.getEnabledParticipants());
  showParticipants();

  gapi.hangout.onParticipantsAdded.add(function (participants) {
    console.log('onParticipantsAdded', participants);
    showParticipants();
  });
}

gadgets.util.registerOnLoadHandler(function () {
  gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
      init();
    }
  });
});

function updateParticipants() {
  var participants = gapi.hangout.getParticipants();
  var ul = document.getElementById('participants');
  ul.innerHTML = '';

  participants.forEach(function (participant) {
    var li = document.createElement('li');
    li.innerHTML = participant.person.displayName;
    ul.appendChild(li);
  });
}

function appendActivities(activity) {
  var ol = document.getElementById('activities');

  var li = document.createElement('li');
  li.innerHTML = activity;
  ol.appendChild(li);
}

function onParticipantsAdded(participants) {
  participants.forEach(function (participant) {
    appendActivities('Join ' + participant.person.displayName);
  });
  updateParticipants();
}

function init() {
  gapi.hangout.onParticipantsAdded.add(onParticipantsAdded);
  updateParticipants();
  appendActivities('Initialized');
}

gadgets.util.registerOnLoadHandler(function () {
  gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
      init();
    }
  });
});

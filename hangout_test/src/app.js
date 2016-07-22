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

function updateActivities() {
  var activities = getActivities();
  var ol = document.getElementById('activities');

  activities.forEach(function (activity) {
    var li = document.createElement('li');
    li.innerHTML = activity;
    ol.appendChild(li);
  });
}

function getActivities() {
  var activities = gapi.hangout.data.getValue('activities');
  return activities ? JSON.parse(activities) : [];
}
function appendActivity(activity) {
  var activities = getActivities();
  activities.push(activity);
  gapi.hangout.data.setValue('activity', JSON.stringify({activities: activities}));
  updateActivities();
}

function onParticipantsAdded() {
  var participants = gapi.hangout.getParticipants();
  participants.forEach(function (participant) {
    appendActivity('Join ' + participant.person.displayName);
  });
  updateParticipants();
}

function onStateChanged(addedKeys, metadata, removedKeys, state) {
  console.log('onStateChanged', addedKeys, metadata, removedKeys, state);
  updateActivities();
}

function init() {
  gapi.hangout.onParticipantsAdded.add(onParticipantsAdded);
  gapi.hangout.data.onStateChanged.add(onStateChanged);
  updateParticipants();
}

gadgets.util.registerOnLoadHandler(function () {
  gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
      init();
    }
  });
});

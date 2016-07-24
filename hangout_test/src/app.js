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
  console.log(activities);
  gapi.hangout.data.setValue('activities', JSON.stringify(activities));
  updateActivities();
}

function onParticipantsAdded(participants) {
  participants.addedParticipants.forEach(function (participant) {
    appendActivity('Join ' + participant.person.displayName);
  });
  updateParticipants();
}

function onStateChanged(addedKeys, metadata, removedKeys, state) {
  console.log('onStateChanged', addedKeys, metadata, removedKeys, state);
  updateActivities();
}

function createDebugButton() {
  var button = document.createElement('button');
  button.innerHTML = 'click me!';
  button.type = 'button';
  button.onclick = function () {
    console.log(getActivities());
  };
  document.body.appendChild(button);
}

function init() {
  gapi.hangout.onParticipantsAdded.add(onParticipantsAdded);
  gapi.hangout.data.onStateChanged.add(onStateChanged);
  updateParticipants();
  updateActivities();
  createDebugButton();
}

gadgets.util.registerOnLoadHandler(function () {
  gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
      init();
    }
  });
});

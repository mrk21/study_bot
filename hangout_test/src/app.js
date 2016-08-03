import React from 'react';
import { render } from 'react-dom';
import axios from 'axios';

let Slack = {
  token: null,
  channel: null,

  sendMessage(text) {
    return axios.get('https://slack.com/api/chat.postMessage', {
      params: {
        token: this.token,
        channel: this.channel,
        username: 'hangout_test',
        text: text,
        as_user: false,
      }
    });
  }
};

function DebugButton({ app }) {
  const onClick = () => {
    axios.get(`${window.secretServerUrl}/secret.json`).then(res => console.log(res));
    console.log(app.getActivities());
  };

  return (
    <button onClick={onClick}>click me!</button>
  );
}

class ParticipantList extends React.Component {
  constructor() {
    super();
    this.onParticipantsAdded = this.onParticipantsAdded.bind(this);
  }

  componentWillMount() {
    this.setState({
      participants: gapi.hangout.getParticipants()
    });
  }

  onParticipantsAdded(participants) {
    for (const participant of participants) {
      this.props.app.appendActivity(`Joined ${participant.person.displayName}`);
    }
    this.setState({
      participants: this.participants.concat(participants)
    });
  }

  render() {
    return (
      <ul id="participants">
      {this.state.participants.map(participant => 
        <li>{participant.person.displayName}</li>
      )}
      </ul>
    );
  }
}

class ActivityList extends React.Component {
  constructor() {
    super();
    this.appendActivity = this.appendActivity.bind(this);
    this.onStateChanged = this.onStateChanged.bind(this);
  }

  componentWillMount() {
    gapi.hangout.data.onStateChanged.add(this.onStateChanged);
    this.updateActivities();
  }

  getActivities() {
    const activities = gapi.hangout.data.getValue('activities');
    return activities ? JSON.parse(activities) : [];
  }

  updateActivities() {
    this.setState({
      activities: this.getActivities()
    });
  }

  appendActivity(activity) {
    let activities = this.getActivities();
    activities.push(activity);
    console.log(activities);
    gapi.hangout.data.setValue('activities', JSON.stringify(activities));
    this.setState({
      activities: activities
    });
    Slack.sendMessage(activity);
  }

  onStateChanged(addedKeys, metadata, removedKeys, state) {
    console.log('onStateChanged', addedKeys, metadata, removedKeys, state);
    this.updateActivities();
  }

  render() {
    return (
      <ol id="participants">
      {this.state.activities.map(activity => 
        <li>{activity}</li>
      )}
      </ol>
    );
  }
}

class Application extends React.Component {
  componentWillMount() {
    this.setState({
      isPrepare: false,
      isAuth: false,
      secret: {},
    });

    gadgets.util.registerOnLoadHandler(() => {
      gapi.hangout.onApiReady.add(eventObj => {
        if (eventObj.isApiReady) {
          this.setState({ isPrepare: true });
        }
      });
    });
  }

  getActivities() {
    return this.refs.activities.getActivities();
  }

  appendActivity(activity) {
    this.refs.activities.appendActivity(activity);
  }

  render() {
    if (!this.state.isAuth) {
      const onClick = () => {
        axios.get(`${window.secretServerUrl}/secret.json`).then(res => {
          const secret = res.data;
          Slack.token = secret.slackToken;
          Slack.channel = secret.slackChannel;
          Slack.sendMessage('init');
          this.setState({ isAuth: true, secret });
        });
      };
      return (
        <div>
          <h1>Hello World!</h1>
          <h2>Login</h2>
          <button type="button" onClick={onClick}>Auth</button>
        </div>
      );
    }

    const content = !this.state.isPrepare ? (
      <p>Now loading...</p>
    ) : (
      <div>
        <ParticipantList app={this} />
        <ActivityList app={this} ref='activities' />
      </div>
    );
    return (
      <div>
        <h1>Hello World!</h1>
        {content}
        <DebugButton app={this} />
      </div>
    );
  }
}

render(
  <Application />,
  document.getElementById('app')
);

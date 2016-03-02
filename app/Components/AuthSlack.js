import React from 'react';
import qs from 'qs';

const clientId = process.env.NODE_ENV === 'production' ?
  '2376554812.23846206866':
  '2376554812.23645499953';
const clientSecret = process.env.NODE_ENV === 'production' ?
  '0aafceac20b11bf475e1ca5118390811' :
  'a8fc14196984beee9faa03c827d90dc0';

var getQueryString = function ( field, url ) {
  var href = url ? url : window.location.href;
  var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
  var string = reg.exec(href);
  return string ? string[1] : null;
};

export default class AuthSlack extends React.Component {
  componentDidMount() {
    let slackCode = getQueryString('code');

    if(slackCode) {
      this.getAccessToken(slackCode);
    }
  }

  getAccessToken(code) {
    fetch('https://slack.com/api/oauth.access?' + qs.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      }), {
      method: 'get',
    })
      .then((r) => r.json())
      .then((resp) => {
        this.props.onAuthenticated(resp);
      });
  }

  render() {
    let authUrl = "https://slack.com/oauth/authorize?client_id=" + clientId + "&scope=chat%3Awrite%3Auser"
    return (
      <a href={authUrl} className="btn btn-default" onClick={this.signIn}>
        <em>#</em> Sign in with Slack
      </a>
    );
  }
}
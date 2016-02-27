
var React = require('react');
var googleApiLoader = require('../Lib/GoogleAPILoader');

module.exports = React.createClass({

    getInitialState: function() {
      return { serverData: null };
    },

    componentDidMount: function () {
      var _this = this;

      googleApiLoader.apiReady.then(() => {
        _this.setState({isAuthorized: true});

        return googleApiLoader.execute(() => {
          return gapi.client.drive.files.list({
            'pageSize': 10,
            'fields': "nextPageToken, files(id, name)"
          });
        }).then(resp => {
          var files = resp.files;
          console.log(files);
          _this.setState({files: files});
        });
      });
    },

    signIn: function () {
      googleApiLoader.login();
    },

    render: function () {
      var toggleLoginButton = (
        <button className="btn btn-block btn-google-plus" onClick={this.signIn}>
          <span className="ion-social-googleplus"></span>Sign in with Google
        </button>
      );

      if (this.state.isAuthorized) {
        return (<div>
           You're now free to use the Google APIs!
        </div>)
      }
      else {
        return toggleLoginButton;
      }

    }
});

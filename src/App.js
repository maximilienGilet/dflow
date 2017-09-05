import React, { Component } from 'react';
import './App.css';

class App extends Component {

    constructor() {
        super();
        this.state = {
            user: null
        }
    }

    componentDidMount() {
        window.DZ.init({
            'appId': '251042',
            'channelUrl': 'http://react.dev/',
            player : {
                onload : function(){}
            }
        });
        window.DZ.login(function(response) {
            if (response.authResponse) {
                console.log('Welcome!  Fetching your information.... ');
                window.DZ.api('/user/me', function(response) {
                    console.log('Good to see you, ' + response.name + '.');
                    window.user = response;
                });
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {perms: 'basic_access,email'});

        var thisReact = this;
        var logUser = setInterval(function(){
            if (window.user){
                clearInterval(logUser);
                thisReact.setState({user: window.user});
            }
        }, 1000);


    }

    render() {
        // console.log(logUser);
        // if (window.user){
        //
        //     clearInterval(logUser);
        // }
        return this.state.user ? this.renderApp() : (
            <div>Loading...</div>
            // <Fetch url="https://cors-anywhere.herokuapp.com/http://api.deezer.com/user/me" mode="no-cors">
            //   <TestComponent/>
            // </Fetch>
        );
    }

    renderApp() {
        return (
            <div>
                {this.state.user.firstname}{this.state.user.lastname}
                <button onClick={() => window.DZ.player.pause()}>Pause</button>
                <button onClick={() => window.DZ.player.play()}>Resume</button>
                <DzProgress id="progress"/>
                <DzFlowList dz-user={this.state.user} />
            </div>
        )
    }
}

class DzProgress extends React.Component {
    constructor() {
        super();
    }

    componentDidMount() {
        var that = this;
        window.DZ.Event.subscribe('player_position', function(arg){
			window.DZ.player.progress = arg;
			document.getElementById(that.props.id).setAttribute('max', arg[1]);
            document.getElementById(that.props.id).setAttribute('value', arg[0]);
		});
    }

    render() {
        if (window.DZ.player.progress) {
            return (
                <progress id={this.props.id} max={window.DZ.player.progress[1]} value={window.DZ.player.progress[0]}></progress>
            )
        }
        return (
            <progress id={this.props.id} max="100" value="0"></progress>
        )


    }
}

class DzFlowList extends React.Component{

    constructor (){
        super();
        this.state = {
            playlist: null
        };
    }

    componentDidMount() {
        window.DZ.api('/user/me/flow', function(response) {
            window.playlist = response.data;
        });


        var thisReact = this;
        var loadPlaylist = setInterval(function(){
            if (window.playlist){
                clearInterval(loadPlaylist);
                thisReact.setState({playlist: window.playlist});
            }
        }, 1000);
    }

    render(){

        if (this.state.playlist){
            var songs = this.state.playlist;
            const listItems = songs.map((song) =>
              <li>{song.artist.name} - {song.title} <button onClick={() => window.DZ.player.playTracks([song.id])}>Play</button></li>
            );

            return (
                <div>
                    <h3>Dz Flow List</h3>
                    <ul>{listItems}</ul>
                </div>
            )
        }

        return <div/>


    }
}

export default App;

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
        var thisReact = this;

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
                    thisReact.setState({user: response});
                    window.DZ.Event.subscribe('player_loaded', function(){
                        window.DZ.player.setRepeat(1);
                    });
                });
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {perms: 'basic_access,email'});
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
                <DzFlowList dz-user={this.state.user} />
            </div>
        )
    }
}

class DzTrack extends React.Component {
    constructor() {
        super();
        this.state = {
            btnText: "Pause"
        }
    }

    togglePlayer() {
        if (window.DZ.player.isPlaying()){
            window.DZ.player.pause();
            this.setState({btnText: "Resume"});
        } else {
            window.DZ.player.play();
            this.setState({btnText: "Pause"});
        }
    }

    render() {
        if (this.props.track) {
            var size = this.props.size ? this.props.size : "128"

            return (
                <div>
                    <img src={this.props.track.album.cover} width={size}  alt="Album Art" />
                    <DzProgress id="progress"/>
                    <div>{this.props.track.artist.name} - {this.props.track.title}</div>
                    <div>
                        <DzPrevBtn/>
                        <button onClick={() => this.togglePlayer()}>{this.state.btnText}</button>
                        <DzNextBtn/>
                    </div>
                    <DzVolume volume={window.DZ.player.getVolume()}/>
                </div>
            )
        }

        return (
            <div/>
        )
    }
}

class DzProgress extends React.Component {

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

class DzVolume extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            volume: props.volume
        }
    }

    changeVolume(e) {
        window.DZ.player.setVolume(e.target.value);
    }

    render() {
        return (
            <input type="range" onChange={this.changeVolume} />
        )
    }
}

class DzFlowList extends React.Component{

    constructor (){
        super();
        this.state = {
            playlist: null,
            track: null
        };
    }

    componentDidMount() {
        var thisReact = this;
        window.DZ.api('/user/me/flow', function(response) {
            thisReact.setState({playlist: response.data});
        });

        window.DZ.Event.subscribe('current_track', function(newTrack){
            var track = thisReact.state.playlist.find(function(o){return o.id === newTrack.track.id});
            thisReact.setState({track: track});
        });

    }

    playTracks(id){
        var firstIndex = this.state.playlist.indexOf(this.state.playlist.find(function(o){return o.id === id}));
        var tracksToPlay = this.state.playlist.slice(firstIndex, -1);
        var tracklist = tracksToPlay.map(function(track){
            return track.id;
        });
        window.DZ.player.playTracks(tracklist);
    }

    render(){

        if (this.state.playlist){
            var songs = this.state.playlist;
            const listItems = songs.map((song) =>
              <li key={song.id}>{song.artist.name} - {song.title} <button onClick={() => this.playTracks(song.id)}>Play</button></li>
            );

            return (
                <div>
                    <DzTrack track={this.state.track}/>
                    <h3>Dz Flow List</h3>
                    <ul>{listItems}</ul>
                </div>
            )
        }

        return <div/>


    }
}

class DzNextBtn extends React.Component {
    render(){
        return (
            <button onClick={() => window.DZ.player.next()}>NEXT</button>
        )
    }
}

class DzPrevBtn extends React.Component {
    render(){
        return (
            <button onClick={() => window.DZ.player.prev()}>PREV</button>
        )
    }
}

export default App;

import React, { Component } from 'react';
import './App.css';

var DZ = window.DZ;

class App extends Component {

    constructor() {
        super();
        this.state = {
            user: null
        }
    }

    componentDidMount() {
        var thisReact = this;

        DZ.init({
            'appId': '251042',
            'channelUrl': 'http://react.dev/',
            'player' : {
                onload : function(){
                    DZ.player.setRepeat(1);
                }
            }
        });
        DZ.login(function(response) {
            if (response.authResponse) {
                console.log('Welcome!  Fetching your information.... ');
                DZ.api('/user/me', function(response) {
                    console.log('Good to see you, ' + response.name + '.');
                    thisReact.setState({user: response});
                });
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {perms: 'basic_access,email'});
    }

    render() {
        return this.state.user ? this.renderApp() : (
            <div>Loading...</div>
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
            btnText: "Play"
        }
    }

    togglePlayer() {
        if (DZ.player.isPlaying()){
            DZ.player.pause();
            this.setState({btnText: "Resume"});
        } else {
            DZ.player.play();
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
                    <DzVolume volume={DZ.player.getVolume()}/>
                </div>
            )
        }

        return (
            <div/>
        )
    }
}

class DzProgress extends React.Component {

    constructor(){
        super();
        this.state = {
            value: 0,
            max: 0,
        }
    }

    componentDidMount() {
        var that = this;
        DZ.Event.subscribe('player_position', function(arg){
            that.setState({
                value: arg[0],
                max: arg[1]
            });
		});
    }

    render() {
        var timeValue = new Date(this.state.value * 1000).toISOString().substr(14, 5);
        var timeMax = new Date(this.state.max * 1000).toISOString().substr(14, 5);

        return (
            <div>
                {timeValue}
                <progress id={this.props.id} max={this.state.max} value={this.state.value}></progress>
                {timeMax}
            </div>
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
        DZ.player.setVolume(e.target.value);
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
            playlist: [],
            track: null
        };
    }

    componentDidMount() {
        var thisReact = this;
        this.loadMoreTracks();

        DZ.Event.subscribe('current_track', function(newTrack){
            var track = thisReact.state.playlist.find(function(o){
                return o.id == newTrack.track.id;
            });
            thisReact.setState({track: track});

            // Auto load next tracks when playing the last track
            var index = thisReact.state.playlist.indexOf(track);
            if (thisReact.state.playlist.length === index + 1 ){
                console.log('load more tracks');
                thisReact.loadMoreTracks();
            }
        });
    }

    loadMoreTracks() {
        var thisReact = this;
        DZ.api('/user/me/flow', function(response) {
            thisReact.setState({playlist: thisReact.state.playlist.concat(response.data)});
            var ids = response.data.map(function(track){ return track.id });
            DZ.player.addToQueue(ids);
        });
    }

    playTracks(track){
        var id = track.id;
        var firstIndex = this.state.playlist.indexOf(this.state.playlist.find(function(o){
            return o.id == id
        }));
        var tracksToPlay = this.state.playlist.slice(firstIndex);
        var tracklist = tracksToPlay.map(function(track){
            return track.id;
        });
        DZ.player.playTracks(tracklist);
    }

    render(){

        if (this.state.playlist.length > 0){
            var songs = this.state.playlist;
            const listItems = songs.map((song) =>
              <li key={song.id}>{song.artist.name} - {song.title} <button onClick={() => this.playTracks(song)}>Play</button></li>
            );

            return (
                <div>
                    <DzTrack track={this.state.track}/>
                    <h3>Dz Flow List</h3>
                    <ul>{listItems}</ul>
                    <button onClick={() => this.loadMoreTracks()}>Load more tracks</button>
                </div>
            )
        }

        return <div/>


    }
}

class DzNextBtn extends React.Component {
    render(){
        return (
            <button onClick={() => DZ.player.next()}>NEXT</button>
        )
    }
}

class DzPrevBtn extends React.Component {
    render(){
        return (
            <button onClick={() => DZ.player.prev()}>PREV</button>
        )
    }
}

export default App;

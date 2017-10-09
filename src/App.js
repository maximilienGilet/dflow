import React, { Component } from 'react';
import './App.css';
import classNames from 'classnames';
import * as Icon from 'react-feather';
import {DebounceInput} from 'react-debounce-input';

var DZ = window.DZ;

function dateToStr(secs){
    return new Date(secs * 1000).toISOString().substr(14, 5);
}

function togglePlayer() {
    if (DZ.player.isPlaying()){
        DZ.player.pause();
    } else {
        DZ.player.play();
    }
}

function throttle(callback, delay) {
    var last;
    var timer;
    return function () {
        var context = this;
        var now = +new Date();
        var args = arguments;
        if (last && now < last + delay) {
            // le délai n'est pas écoulé on reset le timer
            clearTimeout(timer);
            timer = setTimeout(function () {
                last = now;
                callback.apply(context, args);
            }, delay);
        } else {
            last = now;
            callback.apply(context, args);
        }
    };
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

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
            <div className="loader">
                <span className="loader-item"></span>
                <span className="loader-item"></span>
                <span className="loader-item"></span>
            </div>
        );
    }

    renderApp() {
        return (
            <div>
                {/* <button className="user button">
                    <Icon.User className="user-icon"/>
                    <span className="user-text">{this.state.user.firstname} {this.state.user.lastname}</span>
                </button> */}
                <div className="app">
                    <DzFlowList dz-user={this.state.user}/>
                    {/* <div className="controls"> */}

                    {/* </div> */}
                </div>
            </div>
        )
    }
}

class DzTrack extends React.Component {
    constructor() {
        super();
        this.state = {
            btnText: "Play",
            isPlaying: false
        }
    }

    render() {
        if (this.props.track) {
            var that = this;
            var containerStyle = {
                'backgroundImage': 'url(' + this.props.track.album.cover_big + ')'
            };

            return (
                <div className="track">
                    <div className="background-container" style={containerStyle}>
                    </div>
                    <div className="album-container">
                        <div className="album">
                            <img className={classNames({'spin': that.state.isPlaying, 'album-art': true})} src={this.props.track.album.cover_big} alt="Album Art" />
                        </div>
                        <div className="container">
                            <div>
                                <h3 className="trackTitle" title={this.props.track.title}>{this.props.track.title}</h3>
                                <h4 className="trackArtist" title={this.props.track.artist.name}>{this.props.track.artist.name}</h4>
                            </div>
                            <div className="media-controls">
                                <div className="media-buttons">
                                    <DzProgress id="progress"/>
                                    <div className="buttons">
                                        {/* <div className="volume-container"><Icon.Volume2 className="rotate90"/><DzVolume volume={DZ.player.getVolume()}/></div> */}
                                        <DzPrevBtn/>
                                        <DzPlayBtn/>
                                        <DzNextBtn/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
            clicked: false
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

    onChange(event){
        var thisReact = this;
        DZ.player.seek((event.target.value/thisReact.state.max)*100);
    }

    render() {
        var timeValue = dateToStr(this.state.value);
        var timeMax = dateToStr(this.state.max);

        return (
            <div className="progress">
                <div className="progress-values">
                    <div>{timeValue}</div>
                    <div>{timeMax}</div>
                </div>
                {/* <progress className="progressbar" id={this.props.id} max={this.state.max} value={this.state.value}></progress> */}
                <DebounceInput
                    type="range"
                    value={this.state.value}
                    max={this.state.max}
                    debounceTimeout={300}
                    onChange={(evt) => this.onChange(evt)}
                />
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
            var that = this;
            const listItems = songs.map(function(song){
                var duration = dateToStr(song.duration);
                var icon = that.state.track === song ? <Icon.Disc className="icon" /> : <Icon.Play className="icon" />;
                return  <li onClick={() => that.playTracks(song)} className={classNames({'playing': that.state.track === song, 'song': true})} key={song.id}>
                            {icon}
                            <span className="song-title" title={song.title}>{song.title}<br/><small className="artist" title={song.artist.name}>{song.artist.name}</small></span>
                            <span className="duration">{duration}</span>
                        </li>
            });

            return (
                <div className="content">
                    <DzTrack track={this.state.track}/>
                    <div className="tracklist">
                        <ul className="tracklist-content">
                            {listItems}
                            <li className="song"><span className="song-title" onClick={() => this.loadMoreTracks()}><Icon.PlusCircle/></span></li>
                        </ul>
                    </div>
                </div>
            )
        }

        return <div/>


    }
}

class DzNextBtn extends React.Component {
    render(){
        return (
            <Icon.FastForward className="player-button" onClick={() => DZ.player.next()} />
        )
    }
}

class DzPrevBtn extends React.Component {
    render(){
        return (
            <Icon.Rewind className="player-button" onClick={() => DZ.player.prev()} />
        )
    }
}

class DzPlayBtn extends React.Component {
    constructor() {
        super();
        this.state = {
            isPlaying: false
        }
    }

    componentDidMount() {
        var that = this;
        DZ.Event.subscribe('player_play', () => {
            that.setState({isPlaying: true});
        });

        DZ.Event.subscribe('player_paused', () => {
            that.setState({isPlaying: false});
        });
    }

    render(){
        var button = this.state.isPlaying ? <Icon.PauseCircle className="play-button" onClick={() => togglePlayer()}/> : <Icon.PlayCircle className="play-button" onClick={() => togglePlayer()}/> ;

        return (
            <div>
                {button}
            </div>
        );
    }
}

export default App;

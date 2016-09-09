(function(){

    "use strict";

//    var APPLICATIONID = '5C3D1B2E'; //Beachbody Dev Application ID
      var APPLICATIONID = 'B37C3029'; //Beachbody PROD Application ID
//    var APPLICATIONID = 'BD65A3A0'; //Accedo Application ID -> Testing purposes only
    
        var DEVICE_STATE = {
            'IDLE' : 0,
            'ACTIVE' : 1,
            'WARNING' : 2,
            'ERROR' : 3,
        };

    var PLAYER_STATE = {
        'IDLE' : 'IDLE',
        'LOADING' : 'LOADING',
        'LOADED' : 'LOADED',
        'PLAYING' : 'PLAYING',
        'PAUSED' : 'PAUSED',
        'STOPPED' : 'STOPPED',
        'SEEKING' : 'SEEKING',
        'ERROR' : 'ERROR'
    };
    /**
     * Cast player object
     * main variables:
     *  - deviceState for Cast mode:
     *    IDLE: Default state indicating that Cast extension is installed, but showing no current activity
     *    ACTIVE: Shown when Chrome has one or more local activities running on a receiver
     *    WARNING: Shown when the device is actively being used, but when one or more issues have occurred
     *    ERROR: Should not normally occur, but shown when there is a failure
     *  - Cast player variables for controlling Cast mode media playback
     *  - Current media variables for transition between Cast and local modes
     */


    var CastPlayer = function( ){
        this.deviceState = DEVICE_STATE.IDLE;
        this.receivers_available = false;
        this.currentMediaSession = null;
        this.session = null;
 
        this.timer = null;
        this.currentTime = 0;
        this.PLAYER_STATE = PLAYER_STATE;

        this.initializeCastPlayer();
    };

    CastPlayer.prototype.activateSession = function() {
        this.deviceState = DEVICE_STATE.ACTIVE;
        if (this.session.media && this.session.media[0] && !this.isLaunchApp) {
           this.onMediaDiscovered('activeSession' , this.session.media[0]);
        } 
        this.session.removeUpdateListener(this.sessionUpdateListener);
        this.session.addUpdateListener(this.sessionUpdateListener.bind(this));
    };

    CastPlayer.prototype.initializeCastPlayer = function(){
        if (!chrome.cast || !chrome.cast.isAvailable) {
            setTimeout(this.initializeCastPlayer.bind(this), 1000);
            return;
        }

        var applicationID = APPLICATIONID;

        var autoJoinPolicy = chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED;

        // request session
        var sessionRequest = new chrome.cast.SessionRequest(applicationID);
        var apiConfig = new chrome.cast.ApiConfig(
            sessionRequest,
            this.sessionListener.bind(this, "initialize"),
            this.receiverListener.bind(this),
            autoJoinPolicy
        );

        chrome.cast.initialize(apiConfig, this.onInitSuccess.bind(this), this.onError.bind(this));

    };

    CastPlayer.prototype.onInitSuccess = function(){
    };

    CastPlayer.prototype.onError = function(e){
		console.log("chromecast - error: "+e.code);
        this.session = null;
        this.deviceState = DEVICE_STATE.IDLE;
        this.currentMediaSession = null;
        clearInterval(this.timer);
    };
    CastPlayer.prototype.sessionListener = function(type, e){
        if (type == "initialize") {
            this.currentTime = 0; // Reset currentTime for connect-and-start progress bar
        }

        this.session = e;

        if (this.session){//!isOldSession){ // Skip old session when user already stop app
            this.activateSession();
        }
    };

    CastPlayer.prototype.receiverListener = function(e){
        if (e == 'available'){
            this.receivers_available = true;
        }
        else{
			this.receivers_available = false;
            console.log('receiver list empty');
        }
    };

    CastPlayer.prototype.reset = function() {
		console.log("STOP MEDIA>>>>>>> XXX......xxx");
        this.session = null;
        this.deviceState = DEVICE_STATE.IDLE;
        this.currentMediaSession = null;
        clearInterval(this.timer);
    };

    /**
     * Requests that a receiver application session be created or joined. By default, the SessionRequest
     * passed to the API at initialization time is used; this may be overridden by passing a different
     * session request in opt_sessionRequest.
     */
    CastPlayer.prototype.launchApp = function() {
        this.isLaunchApp = true; // For multiple source casting the same device
        chrome.cast.requestSession(
                this.sessionListener.bind(this, "launchApp"),
                this.onLaunchError.bind(this));
        if( this.timer ) {
            clearInterval(this.timer);
        }
    };
    /**
     * Callback function for request session success
     * @param {Object} e A chrome.cast.Session object
     */
    CastPlayer.prototype.onRequestSessionSuccess = function(e) {
        this.session = e;
        this.deviceState = DEVICE_STATE.ACTIVE;
        //this.loadMedia();
    };

    /**
     * Callback function for launch error
     */
    CastPlayer.prototype.onLaunchError = function() {
        this.deviceState = DEVICE_STATE.ERROR;
    };

    /**
     * Stops the running receiver application associated with the session.
     */
    CastPlayer.prototype.stopApp = function() {
        if (!this.session) {
            return false;
        }

        this.session.stop(
            this.onStopAppSuccess.bind(this, 'Session stopped'),
            this.onError.bind(this)
        );
    };

    /**
     * Callback function for stop app success
     */
    CastPlayer.prototype.onStopAppSuccess = function(message) {
        this.session = null;
        this.deviceState = DEVICE_STATE.IDLE;
        this.currentMediaSession = null;
        clearInterval(this.timer);

    };

    /**
     * Callback function for loadMedia success
     * @param {Object} mediaSession A new media object.
     */
    CastPlayer.prototype.onMediaDiscovered = function(how, mediaSession) {
        this.currentMediaSession = mediaSession;
        switch(how) {
            case 'activeSession':
                showOverlayPanel({
                    videoTitle: castPlayer.session.media[0].media.metadata.title,
                    receiverName: "Playing on " + castPlayer.session.receiver.friendlyName,
                    thumbnailUrl: castPlayer.session.media[0].media.metadata.images[0].url
                });

                break;
        }

        this.currentMediaSession.addUpdateListener(this.onMediaStatusUpdate.bind(this));
    };


    /**
     * Callback function for media status update from receiver
     * @param {!Boolean} e true/false
     */
    CastPlayer.prototype.onMediaStatusUpdate = function(e) {
        if( e === false ) {
            return true;
        }

        updateCastingInfo({
            videoTitle: castPlayer.currentMediaSession.media.metadata.title,
            receiverName: "Playing on " + castPlayer.session.receiver.friendlyName
        });

        switch(this.currentMediaSession.playerState) {
            case PLAYER_STATE.PLAYING:
                setPersistentBar("pause");
                break;
            case PLAYER_STATE.PAUSED:
                setPersistentBar("play");
                break;
        }
    };

    CastPlayer.prototype.playMedia = function() {
        if( !this.currentMediaSession ) {
            return;
        }
        this.currentMediaSession.play(null,
                this.mediaCommandSuccessCallback.bind(this,"playing started for " + this.currentMediaSession.sessionId),
                this.onError.bind(this));

    };

    /**
     * Pause media playback in Cast mode
     */
    CastPlayer.prototype.pauseMedia = function() {
        if( !this.currentMediaSession ) {
            return;
        }

        this.currentMediaSession.pause(null,
                this.mediaCommandSuccessCallback.bind(this,"paused " + this.currentMediaSession.sessionId),
                this.onError.bind(this));
        clearInterval(this.timer);

    };

    /**
     * Stop media playback in either Cast or local mode
     */
    CastPlayer.prototype.stopMedia = function() {
        if( !this.currentMediaSession ) {
            return;
        }
		
        this.currentMediaSession.stop(null,
                this.mediaCommandSuccessCallback.bind(this,"stopped " + this.currentMediaSession.sessionId),
                this.onError.bind(this));
        clearInterval(this.timer);

    };


    CastPlayer.prototype.mediaCommandSuccessCallback = function(info, e) {
        console.log(info);
    };

    window.CastPlayer = CastPlayer;
})();

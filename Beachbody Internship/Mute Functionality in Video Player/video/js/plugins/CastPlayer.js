(function(){

    "use strict";
    var CONTENT_API_URL = "https://feed.theplatform.com/f/VSsHaC/all_content?byGuid={GUID}&fields=title,media:content,defaultThumbnailUrl,description&form=json";
    var CAPTION_CONVERTER_URL = 'http://52.10.15.81/beachbody/php/caption.php?smil=';

//    var APPLICATIONID = '5C3D1B2E'; //Beachbody Dev Application ID
      var APPLICATIONID = 'B37C3029'; //Beachbody PROD Application ID
//    var APPLICATIONID = 'BD65A3A0'; //Accedo Application ID -> Testing purposes only
//    var APPLICATIONID = '6A9E4C2C'; //Nezzoh Dev Application ID    
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

	//$("#connecting-icon").hide();
    //$pdk.controller.setPlayerLayoutUrl("//"+window.bbDomain+"/wp-includes/js/pdk/data/metaLayout_glass_lite_beachbody_cast.xml");
	

    var CastPlayer = function( videoID ){
        this.isPlaying = null; // For prevent old session start automatically
        this.deviceState = DEVICE_STATE.IDLE;
        this.receivers_available = false;
        this.currentMediaSession = null;
        this.currentVolume = 0.5;
        this.autoplay = true;
        this.session = null;
        this.castPlayerState = PLAYER_STATE.IDLE;
        this.currentMediaDuration = 0;

        this.fullscreen = false;
		this.initialCast = true; 
        this.audio = true;
        this.timer = null;
        this.progressFlag = true;
        this.timerStep = 1000;
        this.currentTime = 0;
        this.PLAYER_STATE = PLAYER_STATE;

        this.playerReadyEventCustom = null;

        if (videoID != undefined){
        }
        this.initializeCastPlayer();
    };

    CastPlayer.prototype.activateSession = function() {
        this.deviceState = DEVICE_STATE.ACTIVE;
        if (this.session.media && this.session.media[0]) {
            if (!this.isLaunchApp) {
                this.onMediaDiscovered('activeSession' , this.session.media[0]);
            } else {
                this.isLaunchApp = false;
                this.loadMedia();
            }
        } else {
            this.loadMedia();
        }

        this.session.removeUpdateListener(this.sessionUpdateListener);
        this.session.addUpdateListener(this.sessionUpdateListener.bind(this));
    };

    CastPlayer.prototype.loadVideo = function(videoID, callback){
        this.retrieveMediaJSON(CONTENT_API_URL.replace('{GUID}' , videoID), callback);
        this.videoID = videoID;

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

    CastPlayer.prototype.onError = function(){
        this.session = null;
        this.deviceState = DEVICE_STATE.IDLE;
        this.castPlayerState = PLAYER_STATE.IDLE;
        this.currentMediaSession = null;
        clearInterval(this.timer);
    };
    CastPlayer.prototype.sessionListener = function(type, e){
        // Tracking cast button event
		console.log("SESSION LISTENER - IFRAME");
		try{
			utag.link({event_type: 'chromecast_sent'});
		}catch(e){
			console.log("[BB][CastPlayer] Tealium event link failed: "+e);
		}
        

        if (type == "initialize") {
            this.currentTime = 0; // Reset currentTime for connect-and-start progress bar
        }

        this.session = e;
//        var isOldSession = $(".modal-video").length == 0 && (this.isPlaying === false); // Make sure isPlaying is false, not null
        if (this.session){//!isOldSession){ // Skip old session when user already stop app
            this.activateSession();
        }
        
        // Pre-sync sender's volume to receiver's volume
		//TODO: hook bb to parents BB object??? is this needed? 
		//probably hook into the PDK volume instead
        //if (bb && bb.senderVolume) {
        //    this.setReceiverVolume(bb.senderVolume);
        //}
    };

    CastPlayer.prototype.receiverListener = function(e){
        if (e == 'available'){
            if (isChromeQualified()) {
                this.receivers_available = true;
                loadCastLayout();
                console.log('[CastPlayer] Chromecast receivers available.');
            } else {
                console.log('[CastPlayer] Chromecast not currently available for device.');
            }
        }else{
            this.receivers_available = false;
            loadNormalLayout();
            console.log('[CastPlayer] Receiver list empty.');
        }
    };

    CastPlayer.prototype.reset = function() {
        this.session = null;
        this.deviceState = DEVICE_STATE.IDLE;
        this.castPlayerState = PLAYER_STATE.IDLE;
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
        this.loadMedia();
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
        this.isPlaying = false;
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
        this.castPlayerState = PLAYER_STATE.IDLE;
        this.currentMediaSession = null;
        clearInterval(this.timer);

    };

    /**
     * Loads media into a running receiver application
     * @param {Number} mediaIndex An index number to indicate current media content
     */
    CastPlayer.prototype.loadMedia = function() {
        if (!this.session) {
            return;
        }
        if (this.mediaContent != undefined)
        {
            var mediaInfo = new chrome.cast.media.MediaInfo( this.mediaContent.source );

            mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
            mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
            mediaInfo.contentType = 'application/x-mpegurl';

            mediaInfo.metadata.title = this.mediaContent.title;
            mediaInfo.metadata.subtitle = this.mediaContent.subtitle;
            mediaInfo.metadata.images = [{'url': this.mediaContent.thumb}];

            var request = new chrome.cast.media.LoadRequest(mediaInfo);
            // Add extra video data for receiver
            digitalData.video = {
                id: this.videoID,
                title: mediaInfo.metadata.title
            };
            var title = "Build: Chest/Tris";//TODO NU: window.currentContent.data('title');
            var infos = title.split('/');
            var category = "";
            var program_name = digitalData.page_name;
            try{
                if (infos.length == 3){
                    category = infos[1] + ":" + infos[2];
                }
                else if (infos.length == 1){

                    category = program_name + ':' + infos[0];
                }

            }
            catch(err){
                
            }
            digitalData.page = {
              category : {
                pageType : "video-modal",
                primaryCategory : "video",
                subCategory1 : category
              }
            };

            mediaInfo.customData = {
                digitalData: digitalData,
                track: {
                    src: CAPTION_CONVERTER_URL + this.mediaContent.smil
                }
            };
            request.autoplay = this.autoplay;

            this.castPlayerState = PLAYER_STATE.LOADING;
            this.session.loadMedia(
                request,
                this.onMediaDiscovered.bind(this, 'loadMedia'),
                this.onLoadMediaError.bind(this)
            );
        }
    };

    /**
     * Callback function for loadMedia success
     * @param {Object} mediaSession A new media object.
     */
    CastPlayer.prototype.onMediaDiscovered = function(how, mediaSession) {
        this.isPlaying = true;
        this.currentMediaSession = mediaSession;
        switch(how) {
            case 'loadMedia':
                this.seek(this.currentTime);
                this.castPlayerState = this.autoplay ? PLAYER_STATE.PLAYING : PLAYER_STATE.LOADED;
                break;
            case 'activeSession':
                this.castPlayerState = this.session.media[0].playerState;
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
     * Callback function when media load returns error
     */
    CastPlayer.prototype.onLoadMediaError = function(e) {
        this.castPlayerState = PLAYER_STATE.IDLE;
    };

    /**
     * Callback function for media status update from receiver
     * @param {!Boolean} e true/false
     */
    CastPlayer.prototype.onMediaStatusUpdate = function(e) {
        if( e === false ) {
            this.castPlayerState = PLAYER_STATE.IDLE;
            return true;
        }

        updateCastingInfo({
            videoTitle: castPlayer.currentMediaSession.media.metadata.title,
            receiverName: "Playing on " + castPlayer.session.receiver.friendlyName
        });
        castPlayer.castPlayerState = this.currentMediaSession.playerState;
        switch(this.currentMediaSession.playerState) {
            case PLAYER_STATE.PLAYING:
                setCastIcon("pause");
                setExpandedControls("pause");
                setPersistentBar("pause");
                $("#connecting-icon").hide();
                this.startProgressTimer();
                loadCastingLayout();
                break;
            case PLAYER_STATE.PAUSED:
                setCastIcon("play");
                setExpandedControls("play");
                setPersistentBar("play");
                clearInterval(this.timer);
                break;
        }
    };

    CastPlayer.prototype.playMedia = function() {
        if( !this.currentMediaSession ) {
            return;
        }

        switch( this.castPlayerState )
        {
            case PLAYER_STATE.LOADED:
            case PLAYER_STATE.PAUSED:
                this.currentMediaSession.play(null,
                        this.mediaCommandSuccessCallback.bind(this,"playing started for " + this.currentMediaSession.sessionId),
                        this.onError.bind(this));
                this.castPlayerState = PLAYER_STATE.PLAYING;
                break;
            case PLAYER_STATE.IDLE:
            case PLAYER_STATE.LOADING:
            case PLAYER_STATE.STOPPED:
                this.loadMedia();
                this.castPlayerState = PLAYER_STATE.PLAYING;
                break;
            default:
                break;
        }
    };

    /**
     * Pause media playback in Cast mode
     */
    CastPlayer.prototype.pauseMedia = function() {
        if( !this.currentMediaSession ) {
            return;
        }

        if( this.castPlayerState == PLAYER_STATE.PLAYING ) {
            this.castPlayerState = PLAYER_STATE.PAUSED;
            this.currentMediaSession.pause(null,
                    this.mediaCommandSuccessCallback.bind(this,"paused " + this.currentMediaSession.sessionId),
                    this.onError.bind(this));
            clearInterval(this.timer);
        }
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
        this.castPlayerState = PLAYER_STATE.STOPPED;
        clearInterval(this.timer);

    };

    CastPlayer.prototype.setReceiverVolume = function(volume) {
        this.session.setReceiverVolumeLevel(
            volume,
            this.mediaCommandSuccessCallback.bind(this),
            this.onError.bind(this)
        );
    };

    CastPlayer.prototype.setReceiverMute = function(mute) {
		/*
        this.session.setReceiverMuted(
            mute,
            this.mediaCommandSuccessCallback.bind(this),
            this.onError.bind(this)
        );
		*/
    };

    /**
     * Mute media function in either Cast or local mode
     */
    CastPlayer.prototype.muteMedia = function() {
        if( this.audio === true ) {
            this.audio = false;
            document.getElementById('audio_on').style.display = 'none';
            document.getElementById('audio_off').style.display = 'block';
            if( this.currentMediaSession ) {
                this.setReceiverVolume(true);
            }
            else {
                return;
            }
        }
        else {
            this.audio = true;
            document.getElementById('audio_on').style.display = 'block';
            document.getElementById('audio_off').style.display = 'none';
            if( this.currentMediaSession ) {
                this.setReceiverVolume(false);
            }
            else {
                return;
            }
        }
    };
    CastPlayer.prototype.retrieveMediaJSON = function(src, callback) { 
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', this.onMediaJsonLoad.bind(this, callback));
        xhr.addEventListener('error', this.onMediaJsonError.bind(this));
        xhr.open('GET', src);
        xhr.responseType = "json";
        xhr.send(null);
    };

    /**
     * Callback function for AJAX call on load success
     * @param {Object} evt An object returned from Ajax call
     */
    CastPlayer.prototype.onMediaJsonLoad = function(callback, evt) {
        var data = evt.srcElement.response;
		if(data === undefined || data.entries[0] === undefined){
			return;
		}
        this.mediaContent = {
            subtitle : data.entries[0].description,
            title : data.entries[0].title,
            thumb : data.entries[0].plmedia$defaultThumbnailUrl,
            source : data.entries[0].media$content[0].plfile$url.replace(/meta.*/, ""),
            smil: data.entries[0].media$content[0].plfile$url.replace('feed=All%20Published%20Content&' , '')
        };        
		try{
			parent.setMediaCookie(JSON.stringify(this.mediaContent));
		}catch(e){
			console.log("[BB][CastPlayer] Unable to set cookie in parent container");
		}
		
		$.cookie('_media' , JSON.stringify(this.mediaContent), {path:'/'} );
        
        // Callback from CastPlyser.loadvideo, if any
        if (callback) {
            callback();
        }

        // Dispatches the custom player ready event as this point of execution matches when the player shows the contorls.
        this.dispatchPlayerReadyEvent();
    };

    CastPlayer.prototype.onMediaJsonError = function() {
        console.log("Failed to load media JSON");
    };

    CastPlayer.prototype.mediaCommandSuccessCallback = function(info, e) {
        console.log(info);
    };

    CastPlayer.prototype.seek = function(toPosition) {
        clearInterval(this.timer);
        if (!this.currentMediaSession) {
            return false;
        }

        this.currentTime = toPosition;
        var seekRequest = new chrome.cast.media.SeekRequest();
        seekRequest.currentTime = toPosition;
        this.currentMediaSession.seek(
            seekRequest,
            function(e) {
                // On Success
            },
            function(e) {
                // On Error
            }
        );
    };
    CastPlayer.prototype.toggleCaption = function(value){
        if (this.session){
            this.session.sendMessage('urn:x-cast:beachbody.chromecast.caption' , value , null, null);
        }
    };
    /**
     * @param {function} A callback function for the function to start timer 
     */
    CastPlayer.prototype.startProgressTimer = function() {
        if( this.timer ) {
          clearInterval(this.timer);
          this.timer = null;
        }

        // start progress timer
        this.timer = setInterval(castPlayer.incrementMediaTime.bind(this), this.timerStep);
    };
    /**
     * Helper function
     * Increment media current position by 1 second 
     */
    CastPlayer.prototype.incrementMediaTime = function() {
        if (!this.session)
            return;
        if (window.fromExpandedBar)
            return;
        if(this.session.media && this.session.media[0] && this.castPlayerState == PLAYER_STATE.PLAYING) {
          if( this.currentTime < this.currentMediaDuration ) {
            this.updateProgressBarByTimer();
          }
          else {
            clearInterval(this.timer);
          }
        }
    };

    CastPlayer.prototype.updateProgressBarByTimer = function(){
        var tempCurrentTime = this.session.media[0].getEstimatedTime() - 1;
        var timeStr = toHHMMSS(parseInt(tempCurrentTime));
        var adjustment = 0;
        if (timeStr.length > 4) {
            // Adjust position for longer time string, we add 4px for every character 
            // when the timeStr is more than 4 chanracters
            adjustment = (timeStr.length - 4)*4;
        }
        $(".tpGroup .PlayerLabelFont").first().css("margin-left", -adjustment + "px")
        $($('.tpGroup').find('td div')[0]).text(timeStr);
        var totalWidth = parseInt( $('.tpScrubber').css('width') );
        var width = parseInt(totalWidth * tempCurrentTime / this.currentMediaDuration);
        var currentWidth = parseInt( $('canvas.ScrubberProgressSkin').css('width') );
        if (Math.abs( currentWidth - width ) > 5){
            return;
        }
        $('canvas.ScrubberProgressSkin').css('width' , width + 'px' );
    };


    // Dispatches a custome event that coincides with the appearence of the player controls.
    CastPlayer.prototype.dispatchPlayerReadyEvent = function(){
        this.definePlayerReadyEvent();

        // Dispatch the custom event now that the event data has changed.
        document.dispatchEvent(this.playerReadyEventCustom);
    }


    // Redefines the custom event object.
    CastPlayer.prototype.definePlayerReadyEvent = function(){

        // Define the custom event here
        this.playerReadyEventCustom = new CustomEvent(
            "OnPlayerReadyBB", 
            {
                detail: "player.ready",
                bubbles: true,
                cancelable: true
            }
        );
    }


    window.CastPlayer = CastPlayer;
})();

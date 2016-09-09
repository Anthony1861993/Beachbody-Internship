/**
 *
 *  This is a MPX Player JS Plugin for customizing Beach Body Player
 *
 *  To use within MPX Console, Load plugin through "Custom player settings" within "Advanced Settings"
 *  (i.e. pluginBB: priority=1|type=overlay|URL={replace with hosting location of this file})
 *
 *  Otherwise, the plugin can be loaded the standard way through player params,
 *      Javascript: player.pluginBB = "priority=1|type=overlay|URL={replace with hosting location of this file}" ;
 *      HTML: <div class="tpPlayer" tp:pluginBB = "priority=1|type=overlay|URL={replace with hosting location of this file}" ...
 *
 *  The following variables regarding progressive seeking can be set during load time:
 *      seekDelay: The delay in milliseconds of a button press before subsequent FF/RWD seeking is done
 *      seekStepSize: The amount of time in milliseconds that is skipped per seek through FF/RWD
 *
 *   e.g. player.pluginBB = "priority=1|type=overlay|URL={replace with hosting location of this file}|seekDelay=5000|seekStepSize=45000" ;
 *   // When FF/RWD Button is pressed and hold down, it'll seek forward/backward 45 seconds every 5 seconds.
 *
 *
 *  This plugin consist of the following:
 *  - Overlay control
 *  - Implementation of Rewind and Fast Forward through progressive seeking
 *  - interception of PDK standard components events, mainly for the forward/backward button.
 *  - Keyboard short cuts
 *
 *
 */
if (typeof bb_plugin === 'undefined') { var bb_plugin = {}; }
var userAgent = navigator.userAgent;
var isMoz = userAgent.indexOf("Firefox") != -1;
var TOP_LEVEL = 1000;
bb_plugin.BBPlayerPlugin = Class.extend({
    init: function() {
        this.initOverlay();
        
        this.currentTime = 0;
        this.currentTimeAggregate = 0;
        this.duration=0;
        this.durationAggregate=0;

        this.overlayTimer = 0;

        this.seekTimer = 0;
        this.isSeeking = false;
        this.isPaused = false;
        this.seekingTo = 0;
        this.volume = 100;
        this.lastKeyDown = -1;
        this.chapters = [];
		this.disable	= false;
        // default settings for FF & RWD
        this.seekDelay = 1500; // skip every 2 seconds
        this.seekStepSize = 60*1000; // skip 30 seconds
        
    },

    initialize: function(loadObj) { // PDK Controller setup
        var self = this;
        this.controller = loadObj.controller;

        bb_plugin.utils.debug(JSON.stringify(loadObj.vars));

        if (!isNaN(parseInt(loadObj.vars.seekDelay))) {
            this.seekDelay = parseInt(loadObj.vars.seekDelay);
        }

        if (!isNaN(parseInt(loadObj.vars.seekStepSize))) {
            this.seekStepSize = parseInt(loadObj.vars.seekStepSize);
        }

	    $pdk.controller.addPlayerCard(
	      "ad-overlay",
	      "adClickThrough",
	      '<div style="width:100%;height:100%;"><div id="container-more-info" style="cursor:pointer;"><div id="btn-more-info-bg"><div id="lbl-more-info">MORE INFO</div></div></div></div>',
	      "urn:theplatform:pdk:area:overlay",
	      "",//initVars
	      this.presenter,
	      10
	    );

        this.controller.addEventListener("OnMediaPlaying", function(){ self.handleMediaPlaying.apply(self, arguments);});
        this.controller.addEventListener("OnMediaPause", function(){ self.isPaused = true; self.updatePlayButtons();});
        this.controller.addEventListener("OnMediaUnpause", function(){ self.isPaused = false; self.updatePlayButtons();});
        this.controller.addEventListener("OnMediaUnpause", function(){ self.isPaused = false; self.updatePlayButtons();});
        this.controller.addEventListener("OnMediaStart", function(){ self.handleOnMediaStart.apply(self, arguments);});
        this.controller.addEventListener("OnVolumeChange", function(e){ self.volume = e.data; });

		this.controller.addEventListener("castConnected", function(e){ 
			self.disable	= true;});
		this.controller.addEventListener("castDisconnected", function(e){ 
			self.disable	= false;});
        this.controller.addEventListener("OnReleaseStart", function(){ self.handleReleaseStart.apply(self, arguments);});
        this.controller.addEventListener("OnReleaseEnd", function(){ self.handleReleaseEnd.apply(self, arguments);});

        bb_plugin.utils.debug("BB Plugin Loaded: v0.1.0");
    },

    initOverlay: function() {
        var self = this;
		var userAgent = navigator.userAgent.toLowerCase();
		
        this.overlay = document.createElement("div");
        this.overlay.className = "bb-overlay player_bottom";

        this.overlayRWArea = document.createElement("button");
        this.overlayRWArea.className = "bb-overlay-button bb-rw-button-large";

        this.overlayPlayArea = document.createElement("button");
        this.overlayPlayArea.className = "bb-overlay-button bb-play-button-large";

        this.overlayFFArea = document.createElement("button");
        this.overlayFFArea.className = "bb-overlay-button bb-ff-button-large";
		
		//hotfix - don't show arrows for android devices. 
		var hideControls	= false;
		
		if(userAgent.indexOf("android") > -1){
			hideControls	 = true;
		}
		
		if(hideControls){
			this.overlayRWArea.setAttribute("style", "opacity:0");
			this.overlayFFArea.setAttribute("style", "opacity:0");
		}
		
		this.overlay.appendChild(this.overlayRWArea);
        this.overlay.appendChild(this.overlayPlayArea);
		this.overlay.appendChild(this.overlayFFArea);

		
        $(this.overlayRWArea).on("click", function(){ self.handleOverlayPrev(event); });
        $(this.overlayPlayArea).on("click", function(){ self.togglePlay(); });
        $(this.overlayFFArea).on("click", function(){ self.handleOverlayNext(event); });

        this.updatePlayButtons();
        
    },
	presenter :  {
      show: function(initVars) {
		  self.$card	= $(initVars.card.children[0]);
		  self.$card.click(function(){
			  $pdk.controller.pause(true);
			  window.open(initVars.linkUrl, "_blank");
		  })
      },
      hide: function() {

      }
    },
    updatePlayButtons: function() {
        if (this.isPaused) {
            $(this.overlayPlayArea).addClass("paused");
        } else {
        	$(this.overlayPlayArea).removeClass("paused");
        }
    },

    showOverlay: function(a) {
    
        var self = this;
        
		if(self.disable)return;

        try {
            if(isMoz) {
                this.overlay.style.zIndex = TOP_LEVEL;
                this.overlay.style.backgroundColor = " rgba(255, 255, 255, 0.0)";
                $(this.overlay).fadeIn();
            } else {
                $(this.overlay).stop(true, true).fadeIn();
            }

        }catch(e){
            console.log("bb-overlay stop(true,true).fadeIn error");
        }

        clearTimeout(this.overlayTimer);
        this.overlayTimer = setTimeout(function() {
        	self.hideOverlay.apply(self, arguments);
        }, 2500);
    },

    hideOverlay: function() {
    
        clearTimeout(this.overlayTimer);

        if (this.isSeeking) { // leave controls on, through the press and hold of FF
            this.showOverlay();
        } else {

            try {
                if(isMoz) {
                    this.overlay.style.backgroundColor = " rgba(255, 255, 255, 0.0)";
                    $(this.overlay).fadeOut();
                } else {
                    $(this.overlay).stop(true, true).fadeOut();
                }

            }catch(e){
                console.log("bb-overlay stop(true,true).fadeOut error");
            }
        }
    },

	handleOnMediaStart: function(event) {
		self = this;
		//get player element ID
		var playerElem = $(".player").attr("id");
		//default button is no longer needed after start of stream, so let's hide. 
		$("#"+playerElem+"\\.standby\\.playButtonHolder").css("visibility", "hidden");
		
        $(document.body).on("mousemove", function(e) {
        	if (!$(self.overlay).is(':visible')) {
        		self.showOverlay(e);
        	}
        });
		
		
		if(event.data.baseClip.isAd){
			this.disable = true;
		}else{
			this.disable = false;
		}
			
		if(event.data.baseClip.isAd && event.data.title !== undefined){
			var linkUrl	= event.data.title;

			$pdk.controller.showPlayerCard(
				"ad-overlay",
				"adClickThrough",
				"urn:theplatform:pdk:area:overlay",
				{"linkUrl":linkUrl}
			)
		}else{
			$pdk.controller.hidePlayerCard(
				"ad-overlay",
				"adClickThrough"
			)
		}

        this.hideOverlay.apply(this, arguments);
	},

    handleMediaPlaying: function(event) {
    
        this.currentTime = event.data? event.data.currentTime : 0;
        this.currentTimeAggregate = event.data? event.data.currentTimeAggregate : 0;
        this.duration = event.data? event.data.duration : 0;;
        this.durationAggregate = event.data? event.data.durationAggregate : 0;
    },

    handleReleaseStart: function(event) {
    
        this.releaseClips = event.data.clips;
        if (event.data.chapters && event.data.chapters.chapters) {
        	this.chapters = event.data.chapters.chapters;
        }
        this.attachUIListeners();
    },

    handleReleaseEnd: function(event) {
        this.detachUIListeners();
    },

    attachUIListeners: function() {
        var self = this;

        this.detachUIListeners();

        // Keyboard Event
        $(document.body)[0].bb_plugin_delegate = self;
        $(document.body).on('keydown', self.handleKeyDown);
        $(document.body).on('keyup', self.handleKeyUp);

        if ($(".tpPrevious").length > 0) {
            this.addPreviousButton($(".tpPrevious")[0]);
        }

        this.addPreviousButton(this.overlayRWArea);

        if ($(".tpNext").length > 0) {
            this.addNextButton($(".tpNext")[0]);
        }

        this.addNextButton(this.overlayFFArea);
    },

    addPreviousButton: function (element) {
        var self = this;
        element.bb_plugin_delegate = self;
        element.addEventListener("touchstart", self.handlePreviousBtnTouchStart);
        element.addEventListener("touchend", self.handlePreviousBtnTouchEnd);
        element.addEventListener("mousedown", self.handlePreviousBtnDown);
        element.addEventListener("mouseout", self.handlePreviousBtnOut);
        element.addEventListener("click", self.handlePreviousBtnClick, true);
    },

    addNextButton: function (element) {
        var self = this;
        element.bb_plugin_delegate = self;
        element.addEventListener("touchstart", self.handleNextBtnTouchStart);
        element.addEventListener("touchend", self.handleNextBtnTouchEnd);
        element.addEventListener("mousedown", self.handleNextBtnDown);
        element.addEventListener("mouseout", self.handleNextBtnOut);
        element.addEventListener("click", self.handleNextBtnClick, true);
    },

    detachUIListeners: function() {
        var self = this;

        $(document.body).off('keydown', self.handleKeyDown);
        $(document.body).off('keyup', self.handleKeyUp);
        delete $(document.body)[0].bb_plugin_delegate;

        if ($(".tpPrevious").length > 0) { // locate class of MPX built-in controls
            this.removePreviousButton($(".tpPrevious")[0]);
        }

        if ($(".tpNext").length > 0) {
            this.removeNextButton($(".tpNext")[0]);
        }
    },

    removePreviousButton: function (element) {
        var self = this;
        element.removeEventListener("touchstart", self.handlePreviousBtnTouchStart);
        element.removeEventListener("touchend", self.handlePreviousBtnTouchEnd);
        element.removeEventListener("mouseup", self.handlePreviousBtnUp);
        element.removeEventListener("mousedown", self.handlePreviousBtnDown);
        element.removeEventListener("mouseout", self.handlePreviousBtnOut);
        element.removeEventListener("click", self.handlePreviousBtnClick, true);
        delete element.bb_plugin_delegate;

    },
    
    handleOverlayNext: function(event) {
    	event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.beginFastForward();
        self.seekNext();
    },
    handleOverlayPrev: function(event) {
   		event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.beginRewind();
        self.seekPrevious();
    },

    removeNextButton: function (element) {
        var self = this;
        element.removeEventListener("touchstart", self.handleNextBtnTouchStart);
        element.removeEventListener("touchend", self.handleNextBtnTouchEnd);
        element.removeEventListener("mouseup", self.handleNextBtnUp);
        element.removeEventListener("mousedown", self.handleNextBtnDown);
        element.removeEventListener("mouseout", self.handleNextBtnOut);
        element.removeEventListener("click", self.handleNextBtnClick, true);
        delete element.bb_plugin_delegate;

    },

    handleKeyDown: function(event) {
        var self = event.currentTarget.bb_plugin_delegate;
        
		//block if is disabled - quick and dirty until we rewrite in the PoC
		if(this.disable)return;
		
        event.stopImmediatePropagation();
        event.preventDefault();
        
         // ignore auto repeat keys
        if (self.lastKeyDown === event.keyCode) {
        	return;
        }

        self.lastKeyDown = event.keyCode;
        
		switch (event.keyCode) {
			case 37:
            	self.beginRewind();
                break;
            case 39:
                self.beginFastForward();
            	break;
        }
        
    },
    
    hasChapters: function() {
    
    	return this.chapters.length > 1;
    },
    
    seekPrevious: function(event) {
		//block if is disabled - quick and dirty until we rewrite in the PoC
		if(this.disable)return;
		
        if (this.hasChapters()) {
        	if (!this.isSeeking) { 
            	this.controller.previousClip();
            } else {
            	this.doRewind();
            }
        } else {
        	this.doRewind();
        }

        this.cancelSeeking();
    
    },
    
    seekNext: function(event) {
		//block if is disabled - quick and dirty until we rewrite in the PoC
		if(this.disable)return;
		
		if (this.hasChapters()) {
			if (!this.isSeeking) {
        		this.controller.nextClip();
        	} else {
        		this.doFastForward();
        	}
        } else {
        	this.doFastForward();
        }
        
        this.cancelSeeking();
    
    },

    handleKeyUp: function(event) {
		
        var self = event.currentTarget.bb_plugin_delegate;
		
		//block if is disabled - quick and dirty until we rewrite in the PoC
		if(self.disable)return;

        self.lastKeyDown = -1;
        
   		// we need to prevent defaults for the left and right key -- since by default they are go to next/previous playlist
        event.stopImmediatePropagation();
        event.preventDefault();
        		
        switch (event.keyCode) {
        	case 32:
				self.togglePlay();
				break;
        	case 37: // left
        	
        		self.seekPrevious(event);
	            
                break;
            case 39: // right
            
            	self.seekNext(event);
		        
	            break;
	            
	        case 38: // up
	        
				self.controller.setVolume(Math.min(self.volume + 10, 100));
	        	break;
	        	
	        case 40: // down
	        
	        	self.controller.setVolume(Math.max(self.volume - 10, 0));
	        	
	        	break;
        }
        
    },

    handlePreviousBtnTouchStart: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.beginRewind();
    },

    handlePreviousBtnTouchEnd: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.seekPrevious();
        self.cancelSeeking();
        
    },
    
    handlePreviousBtnUp: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
    },

    handlePreviousBtnDown: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.beginRewind();
    },

    handlePreviousBtnOut: function(event) {
        var self = event.currentTarget.bb_plugin_delegate;
        self.cancelSeeking();
    },

    handlePreviousBtnClick: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.seekPrevious();
        self.cancelSeeking();
    },


    handleNextBtnTouchStart: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.beginFastForward();
    },

    handleNextBtnTouchEnd: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.seekNext();
        self.cancelSeeking();
    },

    handleNextBtnDown: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.beginFastForward();
    },
    
    handlePreviousBtnUp: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
    },

    handleNextBtnOut: function(event) {
    	event.stopImmediatePropagation();
        event.preventDefault();
        var self = event.currentTarget.bb_plugin_delegate;
        self.cancelSeeking();
    },

    handleNextBtnClick: function(event) {
        var self = event.currentTarget.bb_plugin_delegate;
        event.stopImmediatePropagation();
        event.preventDefault();
        self.seekNext();
        self.cancelSeeking();
    },

    // Playback Functionalities
    beginRewind: function() {
        var self = this;
        this.cancelSeeking();
        this.seekingTo = this.currentTimeAggregate;
        this.seekTimer = setInterval(function(){ self.doRewind.apply(self, arguments);}, self.seekDelay);
    },

    beginFastForward: function() {
        var self = this;
        this.cancelSeeking();
        this.seekingTo = this.currentTimeAggregate;
        this.seekTimer = setInterval(function(){ self.doFastForward.apply(self, arguments);}, self.seekDelay);
    },

    togglePlay: function() {
        this.controller.pause(!this.isPaused);
    },

    doRewind: function() {
    
        this.isSeeking = true;
        this.seekingTo = Math.min(Math.max(0, this.seekingTo - this.seekStepSize), this.durationAggregate);
        this.controller.seekToPosition(this.currentTimeAggregate = this.seekingTo);

    },

    doFastForward: function() {
		//block if is disabled - quick and dirty until we rewrite in the PoC
		if(this.disable)return;
        this.isSeeking = true;
        this.seekingTo = Math.min(Math.max(0, this.seekingTo + this.seekStepSize), this.durationAggregate);
        this.controller.seekToPosition(this.currentTimeAggregate = this.seekingTo);
    },

    cancelSeeking: function() {
		//block if is disabled - quick and dirty until we rewrite in the PoC
		if(this.disable)return;
		
        clearInterval(this.seekTimer);
        this.isSeeking = false;
        this.seekingTo = -1;
    }
});

bb_plugin.utils = {
    debug: function(msg) {
        console.log("bb_debug: " + msg)
    },

    loadPlugin: function () {
        // CSS for this plugin
//        $('head').append('<link rel="stylesheet" type="text/css" href="//'+window.bbDomain+'/css/bbPlugin.css">');

        // PDK Code to attach this plugin
        bb_plugin.instance = new bb_plugin.BBPlayerPlugin();
        $pdk.controller.plugInLoaded(bb_plugin.instance, bb_plugin.instance.overlay);

    }
};

$(document).ready(function(){
    bb_plugin.utils.loadPlugin();
});
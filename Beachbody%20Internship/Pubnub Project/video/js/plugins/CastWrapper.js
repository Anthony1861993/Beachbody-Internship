var currentTime = 0;

var data , description , title ,thumb, source, digitalData, castPlayer, ischrome;
var ischrome	= false;
window.currentContent = null;
window.fromExpandedBar = false;

var getParameterByName = function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

window['__onGCastApiAvailable'] = function(loaded, errorInfo) { 
    //Doug - 03/02/16
    ischrome = isChromeQualified();

    pdkAddEventListeners();
}

var getKeyValue = function(str){
	var pairs = str.split('&');
	var result = {};
	pairs.forEach(function(pair){
		pair = pair.split('=');
		result[pair[0]] = decodeURIComponent(pair[1] || '');
	});
	
	return result;
}

//Doug - 03/02/16
//Runs through the user agent looking for specific strings and determines whether Chromecast is allowed.
var isChromeQualified = function() {
    var ua = navigator.userAgent.toLowerCase()

    //hide for all mobile devices
    if(ua.indexOf("iphone") > -1 || 
        ua.indexOf("ipad") > -1 || 
        ua.indexOf("android") > -1 || 
        ua.indexOf("mobile") > -1){
        
        return false;
    }else if(ua.indexOf("chrome") > -1){
        return true;
    }
}

var showChromecast = function() {
    if (castPlayer) {
        // Make sure exit fullscreen to show chrome's extension
        $pdk.controller.showFullScreen(false);
    	if(castPlayer.initialCast){
        	castPlayer.loadVideo();//TODO NU:
    		castPlayer.initialCast	= false;
    	} 
        castPlayer.launchApp();
    }
};

var playbackTimer; 

var checkPlayback = function(){
	
	var response = getCookie("bbCastState");
	
	if (response === "play"){
		//console.log("PLAY");
	}else if(response === "pause"){
		//console.log("PAUSE");		
	}
	
	//AD6276B4-0C88-459F-AE8F-E956481B62EB
}

var getCookie = function(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}


var setCastingControlBar = function(status){
    switch(status) {
        case chrome.cast.SessionStatus.CONNECTED:
			document.cookie = "bbCastState=started";
			/*
			if($("#expanded-controls-play").length === 0){
				$('<div id="expanded-controls-play" class="play" style=""></div>').appendTo($(".player"));
			}
			*/
			$pdk.controller.dispatchEvent("castConnected");
            if (castPlayer.castPlayerState == "IDLE") { // When casting end naturally wihtout sender's video page
                hideOverlayPanel();
            } else {
                showOverlayPanel({
                    videoTitle: castPlayer.mediaContent.title,
                    receiverName: "Casting to " + castPlayer.session.receiver.friendlyName,
                    thumbnailUrl: castPlayer.mediaContent.thumb
                });
                $pdk.controller.pause(true);
                setCastIcon("load");
				playbackTimer	= setInterval(checkPlayback, 1000);
                // Prevent connect-play wave-icon issue
                if (castPlayer.castPlayerState == "PAUSED") {
                    $("#connecting-icon").show();
                }
            }
			$("#casting-icon").show();
			//$("#expanded-controls-play").show();
            break;
        case chrome.cast.SessionStatus.STOPPED:
			$pdk.controller.dispatchEvent("castDisconnected");
			$("#casting-icon").hide();
			//$("#expanded-controls-play").hide();
            stopCasting();
            break;
    }
};

var handleOnMediaPause = function(event) {
    //castPlayer.pauseMedia(); this breaks load other video outside video page
};

var handleOnMediaUnpause = function(event) {
    if (window.fromExpandedBar)
        return;

    if (castPlayer) {
        castPlayer.stopApp();
    }
};

var handleOnMediaEnd = function(event) {
    if (castPlayer) {
        castPlayer.stopMedia();
    }
};

var handleOnMediaError = function(event) {
    //bb.mediaError = true;
};

var handleOnMediaPlaying = function(event) {
    currentTime =  event.data.currentTime/1000;
	
	if(castPlayer && castPlayer.currentTime !== undefined){
    	castPlayer.currentTime = currentTime;
	}
};

var handleOnMediaSeek = function(event) {
    if (castPlayer) {
        clearInterval(castPlayer.timer);
        if (window.fromExpandedBar == true){
            castPlayer.startProgressTimer();
            window.fromExpandedBar = false;
            return;
        }
        castPlayer.seek(Math.round(event.data.end.currentTime/1000));
    }
};

var handleOnMediaStart = function(event) {
	if (castPlayer) { //Only executes if castPlayer is defined. - Doug 03/01/16
        if(event.data.baseClip.isAd){
        		loadNormalLayout();
    			return;
    		}
    		
    	if(ischrome && castPlayer.receivers_available){ 
    		loadCastLayout();
    		$pdk.controller.showPlayerCard("overlays", "chromecastIntro", "urn:theplatform:pdk:area:player");
    	}

        var castingModal = '<div id="connecting-icon"></div>'+
        '<div id="casting-icon"></div>'+
        '<div class="video-box"></div>'+
        '<div id="video-modal-footer">'+
            '<div id="video-modal-footer-title"></div>'+
            '<div id="video-modal-footer-receiver"></div>'+
            '<!--div id="expanded-controls-play" class="pause"></div-->'+
        '</div>';

    	$(castingModal).appendTo(document.body);
    	
        var paramsObj = getKeyValue(getParameterByName("params"));
    	
    	var bbuid	= (paramsObj.bbuid)?paramsObj.bbuid:"not available";
    	
    	digitalData = {
           page_name : "video",
           site : {
             name : "club",
             section : "bbod"
           },
           page : {
             category : {
               pageType : "video-modal",
               primaryCategory : "video",
               subCategory1 : event.data.title
             }
           },
           user : {
             profile : {
               profileInfo : {
             //    profileID : "0960E660-903F-4AB6-9AF2-029F807E4020",
                 email: bbuid
               }
             }
           },
    	   video: {
    			id: event.data.baseClip.guid,
    			title: event.data.title
    	   }
         }
        //TODO:  END: NU added
    	
        clearInterval(castPlayer.timer);
    	//fallback to marketingtime if truelength is not available.  convert marketing time from minutes to milliseconds
    	var duration 	= (event.data.trueLength/1000)?(event.data.trueLength/1000):(Number(event.data.baseClip.contentCustomData.marketingTime) * 60000);
    	
        castPlayer.currentMediaDuration = duration;
        castPlayer.startProgressTimer();

        if (!castPlayer.session || castPlayer.session.status != "connected" || window.fromExpandedBar) {
            return false;
        }
        
        if (castPlayer.castPlayerState == castPlayer.PLAYER_STATE.PLAYING ||
            castPlayer.castPlayerState == castPlayer.PLAYER_STATE.PAUSED) {
            castPlayer.currentTime = 0;
            
            delete castPlayer.session.media[0];
            castPlayer.session.media = [];
        }
        
        // Wait for the first buffer to finish
        var interval = setInterval(function() {
            if (castPlayer.currentTime === 0) {
                return false;
            }
            // Clean up interval as we only check at the video's beginning
            clearInterval(interval);

            // Update UI infomation
            showOverlayPanel({
                videoTitle: castPlayer.mediaContent.title,
                receiverName: "Casting to " + castPlayer.session.receiver.friendlyName,
                thumbnailUrl: castPlayer.mediaContent.thumb
            });
            setCastIcon("load");
            castPlayer.loadVideo(event.data.baseClip.guid, function() {
                castPlayer.activateSession();
                
                // Make sure we pause sender video
                $pdk.controller.pause(true);
            });
        }, 1000); // Checkout every second
    }
};

var isVolumeChange 	= {
	oldValue: null,
	newItem: null,
	state:"",
	set val (obj){
		if(this.newItem == null){
			this.newItem 	= obj
		}else if(this.newItem !== null){
			this.oldValue	= this.newItem;
			this.newItem 	= obj
		}
		manageVolumeChange(this);
	},
	get val (){
		//debugger;
		return this.newItem;
	}
};

//var isVolumeChange 	= {val:"", state:""};

var manageVolumeChange	 = function(e){
	var castingIcon = $("#casting-icon");
	switch(castPlayer.castPlayerState){
		case castPlayer.PLAYER_STATE.PAUSED:
			castingIcon.removeClass();
			castingIcon.addClass("play").show();
			break;
		case castPlayer.PLAYER_STATE.PLAYING:
			castingIcon.removeClass();
			castingIcon.addClass("pause").show();
			break;
	}
}

var handleOnMute = function(event) {
	if (castPlayer) {
        isVolumeChange.val	 = true;
        castPlayer.setReceiverMute(event.data);
    }
};

var handleOnVolumeChange = function(event) {
	if (castPlayer) {
        isVolumeChange.val = true;
        //bb.senderVolume = event.data/100;
        // castPlayer.setReceiverVolume(bb.senderVolume);
    }
};

var loadCastingLayout = function() {
    uiManagerCallbackGlobal({type:UI_TYPES.ui_controls, control:"casting", status:true});
};

var loadCastLayout = function() {
    $("#connecting-icon").hide();
    uiManagerCallbackGlobal({type:UI_TYPES.ui_controls, control:"cast", status:true});
};

var loadNormalLayout = function() {
    uiManagerCallbackGlobal({type:UI_TYPES.ui_controls, control:"standard", status:true});
};

var stopCasting = function() {
    castPlayer.stopApp();
    pdkRemoveEventListeners();
    hideOverlayPanel();
    loadCastLayout();
	//TODO: no more modal-video or do we need to keep. 
//    if ($(".modal-video").length) { // When user stop casting within the sender's video page
        if (castPlayer.session){
            var sessionMedia = castPlayer.session.media[0];
            if (sessionMedia) {
                $pdk.controller.seekToPosition(Math.round(sessionMedia.getEstimatedTime()*1000));
                $pdk.controller.pause(false);
            }
//        }
    } else { // When user stop casting after leaving sender's video page
        $pdk.controller.clearCurrentRelease();
        castPlayer.reset();
    }
    updateCastingInfo();
};

var updateCastingInfo = function(opts) {
    if (opts) {
        var receiverInfo = opts.receiverName;
        $("#video-modal-footer-title").text(opts.videoTitle);
        $("#video-modal-footer-receiver").text(receiverInfo);
        $("#pdk-player-overlay-title").text(opts.videoTitle);
        $("#pdk-player-overlay-receiver").text(receiverInfo);
        $("#video-modal-footer").show();

        setupExpandedControls();
    }
    else {
        $("#video-modal-footer").hide();
        $("#video-modal-footer-title").text("");
        $("#video-modal-footer-receiver").text("");
        $("#pdk-player-overlay-title").text("");
        $("#pdk-player-overlay-receiver").text("");
    }
};

var loadCastPlayer = function(){
	castPlayer = new CastPlayer();
	castPlayer.sessionUpdateListener = function() {
	    if (!this.session) {
	        return false;
	    }
		//console.log("CAST PLAYER::::: "+this.session.status);
	    setCastingControlBar(this.session.status);
	};
}

var  markup = '<div id="chromecast-intro" style="background-color:rgba(0,0,0,0.8)">'+
                '<div class="text">Touch to cast workouts to your TV</div>'+
                '<div class="focus"></div>'+
'</div>';

var presenter = {
  show: function(initVars) {
      if (!$.cookie("chromecast-Introduction") && castPlayer.receivers_available) {
          $.cookie("chromecast-Introduction", true, {expires: 30, path:'/'});
	      $("#chromecast-intro").on('click', function() {
	          $(this).hide();
	      }).show();
      }
  },
  hide: function() {
	  $("#chromecast-intro").hide();
	  //console.log("HIDE");
  }
};


$pdk.controller.addEventListener("OnPlayerLoaded", function(e){
	if(window.hasOwnProperty("chrome")){
		try{
			parent.destroyCastPlayer();
		}catch(e){
			console.log("destroy parent cast player");
		}finally{
			loadCastPlayer();
		}
		
		
	}
});

var pdkAddEventListeners = function() {

    $pdk.controller.addEventListener("OnMediaEnd", handleOnMediaEnd);
    $pdk.controller.addEventListener("OnMediaError", handleOnMediaError);
    $pdk.controller.addEventListener("OnMediaPlaying", handleOnMediaPlaying);
    $pdk.controller.addEventListener("OnMediaSeek", handleOnMediaSeek);
    $pdk.controller.addEventListener("OnMediaStart", handleOnMediaStart);
	$pdk.controller.addEventListener("OnShowFullScreen", handleOnFullScreen);
    $pdk.controller.addEventListener("OnMediaLoadStart", function(e){
		//Added android restriction - Doug 03/01/16
        if(window.hasOwnProperty("chrome") && isChromeQualified()){
            castPlayer.loadVideo(e.data.baseClip.guid, null);
        }
    });
    $pdk.controller.addEventListener("OnMute", handleOnMute);
    $pdk.controller.addEventListener("OnPlayerPause", handleOnMediaPause);
    $pdk.controller.addEventListener("OnPlayerUnPause", handleOnMediaUnpause);
    $pdk.controller.addEventListener("OnVolumeChange", handleOnVolumeChange);
    $pdk.controller.addEventListener("OnCastPlay", function(e){
    	castPlayer.playMedia();
    });
    $pdk.controller.addEventListener("OnCastPause", function(e){
		castPlayer.pauseMedia();
    });
    $pdk.controller.addEventListener("OnCastLaunch", function(e){
		castPlayer.launchApp();
    });
	
	$pdk.controller.addPlayerCard("overlays", "chromecastIntro", markup);
    
	$pdk.controller.addPlayerCard(
      "overlays",
      "chromecastIntro",
      markup,
      "urn:theplatform:pdk:area:player",
      null,
      presenter,
      10,
      null
    );
};

var pdkRemoveEventListeners = function() {
    $pdk.controller.removeEventListener("OnMediaEnd", "handleOnMediaEnd");
    $pdk.controller.removeEventListener("OnMediaError", "handleOnMediaError");
    $pdk.controller.removeEventListener("OnMediaPlaying", "handleOnMediaPlaying");
    $pdk.controller.removeEventListener("OnMediaSeek", "handleOnMediaSeek");
    $pdk.controller.removeEventListener("OnMediaStart", "handleOnMediaStart");
    $pdk.controller.removeEventListener("OnMute", "handleOnMute");
    $pdk.controller.removeEventListener("OnPlayerPause", "handleOnMediaPause");
    $pdk.controller.removeEventListener("OnPlayerUnPause", "handleOnMediaUnpause");
    $pdk.controller.removeEventListener("OnVolumeChange", "handleOnVolumeChange");
};

var hideOverlayPanel = function() {
    $("#casting-icon").hide();
    $("#pdk-player-overlay").hide();
    $("#pdk-player-overlay-play").off();
    $("#pdk-player-overlay-cast").off();
    updateCastingInfo();
};

var setCastIcon = function(type) {
//	if(type == "load"){
//	}
    var castingIcon = $("#casting-icon");
    castingIcon.removeClass();
    castingIcon.addClass(type).show();
	isVolumeChange.val = type;
};

var setExpandedControls = function(type) {
//    var castingIcon = $("#expanded-controls-play");
//    castingIcon.removeClass();
//    castingIcon.addClass(type).show();
};

var setupExpandedControls = function() {
    $("#casting-icon").off().on("click", updateExpandedControls);
//    $("#expanded-controls-play").off().on("click", updateExpandedControls);
};

var handleOnFullScreen	= function(e){
	if (castPlayer) {
        //when going into fullscreen and castPlayer is not in idle state
    	if(e.data == true && castPlayer.castPlayerState !== castPlayer.PLAYER_STATE.IDLE){
    //		$("#expanded-controls-play").css("visibility", "hidden");
    	}else if(e.data == false && castPlayer.castPlayerState !== castPlayer.PLAYER_STATE.IDLE){
    //		$("#expanded-controls-play").css("visibility", "visible");
    	}
    }
}

var updateExpandedControls = function() {
    $(this).removeClass();
    if (castPlayer.castPlayerState != "PAUSED") {
        castPlayer.pauseMedia();
        setExpandedControls("play");
        setCastIcon("play");
    }
    else {
        castPlayer.playMedia();
        setExpandedControls("pause");
        setCastIcon("pause");
    }

};

var showOverlayPanel = function(castingInfo) {
    if (!castPlayer.session || castPlayer.session.status == "stopped") {
        return false;
    }

	//NU: Persistent controls 
	//$pdk.controller.dispatchEvent("CastPlayerEvents", {"type":"CastShowOverlayPanel", "value":castingInfo});
	//parent.showOverlayPanel(castingInfo);
	castingInfo.session 	= castPlayer.session;
	try{
		parent.startSiteCastPlayer(castingInfo);
	}catch(e){
		console.log("[BB] - unable to start parent Site Cast Player");
	}
	
	return;

    var playerOverlay = $("#pdk-player-overlay");
    
    // Checkout if the overlay is ready show
    if (playerOverlay.is(":visible")) {
        return false;
    }

    updateCastingInfo(castingInfo);
    $("#pdk-player-overlay-thumbnail").css("background-image", "url(" + castingInfo.thumbnailUrl + ")").off().on("click", function() {
        $('.control-panel').trigger("click");
    });
    playerOverlay.show();
    $('.control-panel').off().on('click' , returnToPlayer);
    
    // Check video playback status
    updateOverlayPlaybutton();
    $("#pdk-player-overlay-cast").off().on("click", function() {
        castPlayer.launchApp();
    });

    $("#pdk-player-overlay-play").off().on("click", function() {
        if (castPlayer.castPlayerState != "PAUSED") {
            castPlayer.pauseMedia();
            setPersistentBar("play");
        }
        else {
            castPlayer.playMedia();
            setPersistentBar("pause");
        }
    });
};

var setPersistentBar = function(type) {
	try{
		parent.setPersistentBar(type);
	}catch(e){
		console.log("[BB] - unable to set parent persistent controls");
	}
    //$("#pdk-player-overlay-play").removeClass(type == "play" ? "pause" : "play").addClass(type);
};

var updateOverlayPlaybutton = function() {
    var isPlaying = castPlayer.castPlayerState != "PAUSED";
    $("#pdk-player-overlay-play").removeClass(isPlaying ? "play" : "pause").addClass(isPlaying ? "pause" : "play");
};

var checkCCOption = function(){

    if (castPlayer && castPlayer.session){
        var value = $.cookie('tp_subtitles_settings');
        if (typeof value == 'undefined'){
            return;
        }
        value = decodeURIComponent(value); 
        var setting = JSON.parse(value);
        if (setting.subtitleLanguage == 'none'){
            setCastCaption(false);
        }
        else {
            setCastCaption(true);
        }
    }
};

var setCastCaption = function(showCaptions){
    castPlayer.toggleCaption(showCaptions);
}

setInterval(checkCCOption , 1000);
var returnToPlayer = function(e){
    var tar = $(e.target);
    if (!tar.hasClass('control-panel'))
        return;
    
	var content_cookie = $.cookie('_cast_content');
	if (content_cookie == null)
        return;
	
    content_cookie = decodeURIComponent(content_cookie);
    var temp = $( '<a></a>' );
    var obj = JSON.parse(content_cookie);
    for (var prop in obj){
        temp.attr(prop , obj[prop]);
    }
    temp.attr('data-title' , obj.title);
    temp.attr('data-program' , obj.program);
    temp.attr('data-description' , obj.description);
    temp.attr('data-preloadingimg' , obj.preloadingimg);
    temp.hide();
    temp.appendTo('body');
    //bb.modalVideo();
    window.fromExpandedBar = true;
    temp.trigger('click');
    temp.remove();
    delete temp;
};

var toHHMMSS = function (s) {
    var sec_num = parseInt(s, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    //if (hours   < 10) {hours   = "0"+hours;}
    //if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    
    var time = minutes+':'+seconds;
    if (hours != "00") {
        if (minutes < 10) {minutes = "0"+minutes;}
        time = hours+':'+minutes+':'+seconds;
    }
    return time;
};

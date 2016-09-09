var bbVideoPlayer, castPlayer;
var iframeDomain = "http://club.teambeachbody.com";//"http://local.teambeachbody.com:8181/";

var handleVideoModalLoaded = function() {
  $("#bbPlayButton").mousedown(function(){
	  castPlayer.playMedia();
  })
  $("#bbPauseButton").mousedown(function(){
	  castPlayer.pauseMedia();		  	
  })
};

//video player depends on jquery to be loaded.  set timer to query availability before usage. 

var checkJQueryTimer = "";

window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
  if (loaded) {
	  checkJQueryTimer = setInterval(function(){checkForJQuery()},1000);
  } else {
    console.log(errorInfo);
  }
}

function removeCastCookie(){
	$.removeCookie('chromeCasted', { path: '/' });
}

function checkForJQuery(){
	if(window.jQuery){
		clearInterval(checkJQueryTimer);
		if($.cookie("chromeCasted") === "1"){
			initalizeCastPlayer();
		}
	}
}


var setCastingControlBar = function(status){
    switch(status) {
        case chrome.cast.SessionStatus.CONNECTED:
			break;
        case chrome.cast.SessionStatus.STOPPED:
            stopCasting();
            break;
    }
};


var stopCasting = function() {
  hideOverlayPanel();
  updateCastingInfo();
};

var startSiteCastPlayer = function(castingInfo){
	//set cookie to expire in 1hr(.05)
	$.cookie("chromeCasted", 1, {expires : .05, path: '/'});
	
	$(".back-btn").click(function(){
		initalizeCastPlayer();
	})

	showOverlayPanel(castingInfo);
}

var initalizeCastPlayer	= function(e){
	if(!castPlayer){
		castPlayer	 = new CastPlayer();
		
		castPlayer.sessionUpdateListener = function() {
		    if (!this.session) {
		        return false;
		    }
		    setCastingControlBar(this.session.status);
		};
		
	}
}

//this is called by the iframe. 
//when a cast session is initialized by cast player,
//we destroy the host's cast player to avoid a sessionListener conflict when sessions are cast. 
//we then allow the iframe to create the castPlayer when cast happens. 
var destroyCastPlayer	= function(){
//	castPlayer.stopMedia();
}


var setPersistentBar = function(type) {
    $("#pdk-player-overlay-play").removeClass(type == "play" ? "pause" : "play").addClass(type);
};

//sets media cookie.  we'll refer to this when user navigates through pages. 
var setMediaCookie	= function(val){
	$.cookie('_media' , val, {path:'/'} );
}

var showOverlayPanel = function(castingInfo) {

    var playerOverlay = $("#pdk-player-overlay");
    
    updateCastingInfo(castingInfo);
    $("#pdk-player-overlay-thumbnail").css("background-image", "url(" + castingInfo.thumbnailUrl + ")").off().on("click", function() {
        $('.control-panel').trigger("click");
    });
    playerOverlay.show();

    updateOverlayPlaybutton();
    $("#pdk-player-overlay-cast").off().on("click", function() {
		castPlayer.launchApp();
    });

    $("#pdk-player-overlay-play").off().on("click", function() {
        if ($("#pdk-player-overlay-play").hasClass("pause")) {
			//pause media
            setPersistentBar("play");
			castPlayer.pauseMedia();
        }else {//play media
            setPersistentBar("pause");
			castPlayer.playMedia();
        }
    });
};

var updateOverlayPlaybutton = function() {
	$("#pdk-player-overlay-play").removeClass("play").addClass("pause");
};

var hideOverlayPanel = function() {
	removeCastCookie();
    $("#pdk-player-overlay").hide();
    $("#pdk-player-overlay-play").off();
    $("#pdk-player-overlay-cast").off();
    updateCastingInfo();
};

var updateCastingInfo = function(opts) {
    if (opts) {
        var receiverInfo = opts.receiverName;
        $("#pdk-player-overlay-title").text(opts.videoTitle);
        $("#pdk-player-overlay-receiver").text(receiverInfo);
    }
    else {
        $("#pdk-player-overlay-title").text("");
        $("#pdk-player-overlay-receiver").text("");
    }
};

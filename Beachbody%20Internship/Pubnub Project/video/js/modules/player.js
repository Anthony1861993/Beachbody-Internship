define(['jquery', 'loaders', 'qs'], function($,loaders,qs){
	var self = null;
	var methods = {
		init: function(callback){
			var loadCount	= 0;
			var releaseUrl	= "";
			var playerConf	= {};
			var environmentVariables = {};
			var response	= function(response){
				console.log("[BB] "+response.type +" loaded.")
		
				switch(response.type){
				case "json":
					$.each(response.data.styles, function(kkey, vval){
						var jQueryElem = document.createElement('link');
							jQueryElem.type	= 'text/css';
							jQueryElem.rel	= 'stylesheet';
							jQueryElem.href	= bbPlayer.config.data.videoDomain+vval;
						document.head.appendChild(jQueryElem, document.head.firstChild);
					});
					loadCount++;
					break;
				case "release":
					releaseUrl	= response.data+qs.getCxenseQueryString();
					loadCount++;
					break;
				case "player":
					playerConf	= response.data;
					loadCount++;
					break;		
				case "environment":
					environmentVariables = response.data["env-maps"][document.domain];
					//Conviva ID
					bbPlayer.config.data.convivaID 			= environmentVariables.bbConviva;
					//Feed (Playlist) id
					bbPlayer.config.data.mpxAccount 		= environmentVariables.bbAccountMPX;
					//MPX Player ID
					bbPlayer.config.data.mpxPlayerID 		= environmentVariables.bbP;
					//Tealium tag
					bbPlayer.config.data.tealiumEnv 		= environmentVariables.bbTeaEnv;
					//video player resource domain
					bbPlayer.config.data.videoDomain 		= environmentVariables.bbD;
					//TODO: Comment out when deploying
					bbPlayer.config.data.videoDomain 		= "";					
					break;					
				}
				
				if(loadCount === 3){
					callback.call(window.bbPlayer,{releaseUrl: releaseUrl, config: playerConf});
				}
			}
			loaders.getMPXPlayer(response);
			loaders.getAppJson(response);
			loaders.getMPXRelease(response);

			//Assign this to self.
			self = this;

			//Set up player event listener[s]
			$pdk.controller.addEventListener("OnMediaBuffering", self.mediaBufferingHandler);
			$pdk.controller.addEventListener("OnMediaStart", self.mediaStartHandler);
		},
		// General catch all handler for actions that need to occur during onMediaStart.
		mediaBufferingHandler: function(e) {
			console.log("MEDIA BUFFERING");

			bbPlayer.config.data.bbTitle = e.data.title; //Stores the workout title for later use.

			// If a start time is defined, then seek to that position now.
			if (bbPlayer.config.data.bbStartTime) {
				$pdk.controller.seekToPosition(bbPlayer.config.data.bbStartTime);
				bbPlayer.config.data.bbStartTime = null;
			}
		},
		// General catch all handler for actions that need to occur during onMediaStart.
		mediaStartHandler: function(e) {
			console.log("MEDIA START");
		}
	}
	return methods;
});

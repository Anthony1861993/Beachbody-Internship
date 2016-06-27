//TEST
define(['jquery', 'loaders', 'qs'], function($,loaders,qs){
	var self = null;
	var arr = [0, 100];
	var buttonnode= document.createElement('input');
	var methods = {
		init: function(callback){
			var loadCount	= 0;
			var releaseUrl	= "";
			var playerConf	= {};
			var response	= function(response){
				console.log("[BB] "+response.type +" loaded.")
		
				switch(response.type){
				case "json":
					$.each(response.data.styles, function(kkey, vval){
						var jQueryElem = document.createElement('link');
							jQueryElem.type	= 'text/css';
							jQueryElem.rel	= 'stylesheet';
							jQueryElem.href	= bbConfig.bbPath+vval;
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
				}
				
				if(loadCount === 3){
					callback({releaseUrl: releaseUrl, config: playerConf});
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

			$pdk.controller.addEventListener("OnMediaEnd", self.mediaEndHandler);

			$pdk.controller.addEventListener("OnMediaPlaying", self.mediaPlayingHandler);

		},
		load: function(data){
			var bbPlayer = new Player("player");

			//configure player parameters
			for (var key in data.config){
				if (key.indexOf("Color") > -1 && data.config[key].indexOf("0x") == -1){
					data.config[key]	= "0x"+data.config[key];
				}
				switch(key){
				case "skinUrl":
					bbPlayer[key]	= bbConfig.bbPath+"/conf/json/defaultLayout.json";
					break;
				case "layoutUrl":
					bbPlayer[key]	= bbConfig.bbPath+"/conf/layout/metaLayout_glass_lite_beachbody.xml";
					break;
				default:
					bbPlayer[key]	= data.config[key];	
				}
			}

			//** Touchstone Service URL = https://beachbody.testonly.conviva.com
			
			bbPlayer.pluginConvivaUniversal = "type=reporting|priority=1|customerId=" + bbConfig.bbConviva + "|assetName=[" + bbConfig.bbVID + "] " + bbConfig.bbPN + " - {title}|serviceUrl=https://livepass.conviva.com|URL=https://livepassdl.conviva.com/thePlatform/ConvivaThePlatformUniversalPlugin.js|cdnName=EDGECAST|playerName=Web Player " + bbConfig.bbVersion + " [" + bbConfig.bbSite + "]|viewerId=" + bbConfig.bbE;
			bbPlayer.pluginConvivaBuffering = "type=reporting|priority=1|customerId=" + bbConfig.bbConviva + "|assetName=[" + bbConfig.bbVID + "] " + bbConfig.bbPN + " - {title}|serviceUrl=https://livepass.conviva.com|URL=https://livepassdl.conviva.com/thePlatform/ThePlatformUniversalBufferingPlugin.js|cdnName=EDGECAST|playerName=Web Player " + bbConfig.bbVersion + " [" + bbConfig.bbSite + "]|viewerId=" + bbConfig.bbE;
			bbPlayer.pluginBBCustomMetrics  = "type=reporting|priority=1|URL="+bbConfig.bbPath+"/js/plugins/bbCustomMetrics.js";
			bbPlayer.pluginBB				= "type=overlay|priority=1|URL="+bbConfig.bbPath+"/js/plugins/bb.js";
			
			//add bbuid and ad policy
			var adpolicy = ["",""];

			if(data.config.policy !== undefined){
				adpolicy = data.config.policy.toLowerCase().split("adpolicy/");
			}
			//set content
			bbPlayer.releaseUrl=data.releaseUrl+"&policy="+adpolicy[1]+"&bbuid="+bbConfig.bbE+"";

			//fire up player
			bbPlayer.bind();
			
			console.log("[BB] Web Player "+bbConfig.bbVersion+" [" + bbConfig.bbSite + "] Initialized.");
			$pdk.initialize();
		},
		// General catch all handler for actions that need to occur during onMediaStart.
		mediaBufferingHandler: function(e) {
			console.log("MEDIA BUFFERING");

			bbConfig.bbTitle = e.data.title; //Stores the workout title for later use.

			// If a start time is defined, then seek to that position now.
			if (bbConfig.bbStartTime) {
				$pdk.controller.seekToPosition(bbConfig.bbStartTime);
				bbConfig.bbStartTime = null;
			}
		},

		// General catch all handler for actions that need to occur during onMediaStart.
		mediaStartHandler: function(e) {
			var videoDuration = e.data.baseClip.trueLength;
			console.log("[BB] MEDIA START: True Length", videoDuration);
		},

		mediaEndHandler: function(e) {
			console.log("[BB] MEDIA END: ", e);
		},
		
		mediaPlayingHandler: function(e){

				var percent = parseInt(e.data.percentComplete, 10);
				if (!(percent%5) && (arr.indexOf(percent) == -1)) {
					console.log("[BB] 5% mark: ", percent, "%");
					arr.push(percent);
				}
		}


			
		
	}
	return methods;
})
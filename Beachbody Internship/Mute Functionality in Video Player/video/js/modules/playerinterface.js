define(['jquery','loaders','qs','disclaimer'], function($,loaders,qs,disclaimer){
	var Class = function(methods){
		var klass = function(){
			this.initialize.apply(this, arguments);
		};
	
		for (var property in methods){
			klass.prototype[property] = methods[property];
		}
		if(!klass.prototype.initialize) klass.prototype.initialize = function(){};
	
		return klass;
	}

	//player class.  instantiate a new player by : var bbPlayer = new BBPlayer();
	var BBPlayer = Class({
		disclaimer: {},
		initialize: function(){
			console.log("[BB] API Initialize");
		},
		setReleaseUrl: function(url){
		
		},
		playerConfig: function(data){
			//TODO NU: check disclaimer before loading content
//			this.disclaimer.init();
			var pdkPlayer = new Player(this.config.id);
			//var uiData = {handler:null};
				
			//set player config object in global object. 
			bbPlayer.config.data["playerConfig"]	= data.config;

			//configure player parameters
			for (var key in data.config){
				if (key.indexOf("Color") > -1 && data.config[key].indexOf("0x") == -1){
					data.config[key]	= "0x"+data.config[key];
				}
				switch(key){
				case "skinUrl":
					pdkPlayer[key]	= bbPlayer.config.data.videoDomain+"/conf/json/defaultLayout.json";
					break;
				case "layoutUrl":
					pdkPlayer[key]	= bbPlayer.config.data.videoDomain+"/conf/layout/metaLayout_glass_lite_beachbody.xml";
					break;
				default:
					pdkPlayer[key]	= data.config[key];	
				}
			}

			//** Touchstone Service URL = https://beachbody.testonly.conviva.com
			
			pdkPlayer.pluginConvivaSwf		= "type=reporting|priority=1|toggleTraces=false|customerId=" + bbPlayer.config.data.convivaID + "|assetName=[" + bbPlayer.config.data.mpxReferenceID + "] " + bbPlayer.config.data.programName + " - {title}|serviceUrl=https://livepass.conviva.com|URL=https://livepassdl.conviva.com/thePlatform/ConvivaThePlatformPlugin_5_0_5.swf|cdnName=EDGECAST|playerName=Web Player " + bbPlayer.config.data.bbVersion +  "|viewerId=" + bbPlayer.config.data.emailHash;
			pdkPlayer.pluginConvivaJS		= "type=reporting|priority=1|toggleTraces=false|customerId=" + bbPlayer.config.data.convivaID + "|assetName=[" + bbPlayer.config.data.mpxReferenceID + "] " + bbPlayer.config.data.programName + " - {title}|serviceUrl=https://livepass.conviva.com|URL=https://livepassdl.conviva.com/thePlatform/ConvivaThePlatformPlugin.js|cdnName=EDGECAST|playerName=Web Player " + bbPlayer.config.data.bbVersion +  "|viewerId=" + bbPlayer.config.data.emailHash;
			pdkPlayer.pluginBBCustomMetrics = "type=reporting|priority=1|URL="+bbPlayer.config.data.videoDomain+"/js/plugins/bbCustomMetrics.js";
			pdkPlayer.pluginBB				= "type=overlay|priority=1|URL="+bbPlayer.config.data.videoDomain+"/js/plugins/bb.js";
			
			
			//add bbuid and ad policy
			var adpolicy = ["",""];
			if(data.config.policy !== undefined){
				adpolicy = data.config.policy.toLowerCase().split("adpolicy/");
			}
			
			//set content
			//debugger;

			pdkPlayer.releaseUrl=data.releaseUrl+"&policy="+adpolicy[1]+"&bbuid="+bbPlayer.config.data.emailHash+"";
//			this.disclaimer.checkAcceptance();
			//debugger;
			//fire up player
			pdkPlayer.bind();
			console.log("[BB] Web Player "+bbPlayer.config.data.playerVersion+" Initialized.");
			$pdk.initialize();
			
			//uiData.handler = new uimanager();
		},
		createPlayer: function(data, id, width, height){
//			data.mpxReferenceID 	= "21X19400B08";
			
			for (var item in data){
				this.config.data[item] = data[item];
			}
			this.config["id"]		= id;
			this.config["width"]	= width;
			this.config["height"]	= height;
		//	this.config = {data: data, id:id, width:width, height:height};
		},
		idle: 		function() {
			$pdk.controller.clearCurrentRelease();
		},
		endMedia: 	function(){
			$pdk.controller.endMedia();
		},
		pause: 		function(){
			$pdk.controller.getVideoProxy()._ve.pause();
		},
		play: 		function(){
			$pdk.controller.getVideoProxy()._ve.play();
		},
		setVolume: 	function(val){
			$pdk.controller.setVolume(val);
		},
		destroy: 	function(){
			
		},
		create: 	function(){
			
		},
		playReferenceID: function(refID){
			//TODO NU: check disclaimer before loading content
			//return;
			var loadContent	= function(response){
				if(response == false){
					return;
				}
				var url = "https://feed.theplatform.com/f/VSsHaC/B0Xsr4HI9Tzx?byGuid="+refID+"&form=json&fields=content.url";
			    $.get(url, function(data, status){
					//add bbuid and ad policy
					//debugger;
					var adpolicy = ["",""];
					//bbPlayer.config.data
					if(bbPlayer.config.data["playerConfig"]["policy"] !== undefined){
						adpolicy = bbPlayer.config.data["playerConfig"]["policy"].toLowerCase().split("adpolicy/");
					}
					var obj = JSON.parse(data);
					var linkUrl = obj.entries[0]["media$content"][0]["plfile$url"];
					var currentTime	= $pdk.controller.getVideoProxy()._ve.getCurrentTime()/1000;
					$pdk.controller.setReleaseURL(linkUrl+"&start="+currentTime+"&policy="+adpolicy[1]+"&bbuid="+bbPlayer.config.data.emailHash);
			    });	
			}
//			this.disclaimer.checkAcceptance(loadContent);
		}
	});
	var playerAPI = new BBPlayer();
//		playerAPI.disclaimer = disclaimer;
	return playerAPI;
});

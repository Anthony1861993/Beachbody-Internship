/*
1. User/Viewer ID (For the Viewer Module) Use the email hash that is currently being passed to the player. We will switch to the user guid as soon as it is made available by the web dev team, but for the short term we will pass the email hash.
2. thePlatform Player Errors
3. Browser Errors
XXXX 4. HTTP Errors (404's, 503's, etc.)
XXXX 5. Network Conditions or Network Errors if accessible.
XXXX 6. Memory errors if accessible. 
7. Plug in load times based on thresholds. We should decide upon a threshold that we deem "too long" for a plugin to load and send a long load time message to Conviva. 
8. Plugin errors - any errors that we get back from plugins. This would include Uplynk, Conviva, and especially FreeWheel.

Custom Conviva Events:
OnWindowError
*/

if (typeof bb_custom_plugin === 'undefined') { var bb_custom_plugin = {}; }

bb_custom_plugin.bbCustomMetrics = Class.extend({
    init: function() {
    	console.log("[BB][bbCustomMetrics] Init Called");
    },
    initialize: function() { // PDK Controller setup
        var self = this;
        this.controller = $pdk.controller;
	
		//get system info and pass along with user data. 
		this.controller.addEventListener("OnPluginErrors", function(e){
			self.handleEvent(
				{type:"OnMediaBuffering", 
				 params: {
						"name":e.name, 
						"data":e.data, 
						"user":self.getUserData()
						}
				}
			);
		})
		this.controller.addEventListener("OnPluginsComplete", function(e){ 
			console.log("ON PLUGINS CMPOLETE");});		
			
		this.controller.addEventListener("OnMediaBuffering", function(e){ 
			
			self.handleEvent(
				{type:"OnMediaBuffering", 
				 params: {
						"url":e.data.URL, 
						"title":e.data.title, 
						"releasePID":e.data.releasePID, 
						"user":self.getUserData()
						}
				}
			);
		});
        this.controller.addEventListener("OnMediaError", function(e){ 
			
			//reportPlaybackError("Error: "+ERROR_TYPES.error_media, "An error occurred while attempting to play this video:<br /><br /><span class='error_text_underscore'>"+bbPlayer.config.data.programName+"</span><br /><br />If refreshing this page or resetting your router doesn't fix this problem, please call customer service at: <span class='error_text_underscore'>&nbsp;800-470-7870</span>");
			
			self.handleEvent(
				{type:"OnMediaError", 
				 params: {
						"friendlyMessage":bbPlayer.config.data.emailHash.slice(0, 6)+" | "+e.data.friendlyMessage, 
						"globalDataType":"["+bbPlayer.config.data.mpxReferenceID+"] "+e.data.clip.title+" | "+e.data.friendlyMessage, 
						"releasePID":"["+bbPlayer.config.data.mpxReferenceID+"] "+bbPlayer.config.data.programName+" - "+e.data.clip.title, 
						"user":self.getUserData()
						}
				}
			);
		});
        this.controller.addEventListener("OnReleaseError", function(e){ 
			self.handleEvent(
				{type:"OnReleaseError", 
				 params: {
						"url":e, 
						"user":self.getUserData()
						}
				}
			);
		});
        this.controller.addEventListener("OnVersionError", function(e){ 
			self.handleEvent(
				{type:"OnVersionError", 
				 params: { 
						"user":self.getUserData()
						}
				}
			);
		});
		window.onerror = function(error, url, line){

			//CAPTURE PAGE SCRIPT ERRORS
			console.log("[ERROR] - ERROR: 	" + error);
			console.log("[ERROR] - URL: 	" + url);
			console.log("[ERROR] - LINE: 	" + line);

			//** DOUG - Error Test
			//reportPlaybackError("Error: "+ERROR_TYPES.error_media, "An error occurred while attempting to play this video:<br /><br /><span class='error_text_underscore'>"+bbPlayer.config.data.programName+"</span><br /><br />If refreshing this page or resetting your router doesn't fix this problem, please call customer service at: <span class='error_text_underscore'>&nbsp;800-470-7870</span>");

			self.handleEvent(
				{type:"OnWindowError", 
				 params: {
						"error":bbPlayer.config.data.emailHash + " | " + error, 
						"url":url + " | Line: " + String(line), 
						"line":"Line: " + String(line) + " | " + error, 
						"user":self.getUserData()
						}
				});
		  	return true; 
		}

    },
	getUserData: function(){
		var response = "";
		
		//Break out response so that it can be manipulated prior to returning
		response = bbPlayer.config.data.emailHash + " | " + window.userAgent; //LEGACY: digitalData.user.profile.profileInfo.email
		
		return response;
	},
	handleEvent: function(arg){
		console.log("TYPE: " + arg.type);
		console.log(arg);
		
		var paramsObj = {};
		for (var key in arg.params){
			paramsObj[key]	= arg.params[key];
		}
		Conviva.LivePass.metrics.sendEvent(arg.type, paramsObj);
	}    
});

bb_custom_plugin.utils = {
    debug: function(msg) {
        console.log("bb_custom_debug: " + msg)
    },

    loadPlugin: function () {
        // PDK Code to attach this plugin
        bb_custom_plugin.instance = new bb_custom_plugin.bbCustomMetrics();
        $pdk.controller.plugInLoaded(bb_custom_plugin.instance, bb_custom_plugin.instance.overlay);

    }
};

$(document).ready(function(){
    bb_custom_plugin.utils.loadPlugin();
});
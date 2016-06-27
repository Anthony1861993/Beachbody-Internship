define(['jquery','underscore','menu'], function($,_,menu){
	var self = null;
	var parentData = {callback:null, element:null};
	var moduleData = {module_designator:"module.modifierhandler", menu_designator:"menu.modifier", status:{is_modifier:false, media_playing:false, transitioned_out:false}, object:null, timeout:null};
	var currentMediaTime = 0;

	// Constructor
	function modifierhandler(callback, element) {
		self = this;
		var _self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");
		
		parentData.callback = callback;
		parentData.element = element;

		moduleData.object = $("<div>", {id: "modifierIndicator", class: "in_player_text_indicator player_top player_right"});
		moduleData.object.html("MODIFIER");
		moduleData.object.hide();
		moduleData.object.appendTo(parentData.element);


		//bind to this so it stays within modifier scope
		var bLoadModifier = self.loadModifiers.bind(self);
		var bMediaPlayingHandler = self.mediaPlayingHandler.bind(self);
		
		$pdk.controller.addEventListener("OnMediaStart", bLoadModifier);
		$pdk.controller.addEventListener("OnMediaPlaying", bMediaPlayingHandler);
		$pdk.controller.addEventListener("OnMediaSeek", self.mediaSeekHandler);

		parentData.callback(UI_MODEL_STATES.state_init, moduleData); //Pass model data getter upon init.
	}
	// Developed to only support 1 modifier
	modifierhandler.prototype.modifierIDs = [];

	// This callback captures all click events on menu items.
	modifierhandler.prototype.menuCallback= function(e) {
		//toggle guid
		this.modifierIDs = this.modifierIDs.reverse();

		// Toggles the is_modifier status and controls the visibility of the corresponding UI accordingly.
		moduleData.status.is_modifier = !moduleData.status.is_modifier;
		
		var url = "https://feed.theplatform.com/f/"+bbPlayer.config.data.mpxAccount+"/B0Xsr4HI9Tzx?byGuid="+this.modifierIDs[0]+"&form=json&fields=content.url";
	    $.get(url, function(data, status){
			var obj = JSON.parse(data);
			var linkUrl = obj.entries[0]["media$content"][0]["plfile$url"];
			
			currentMediaTime = $pdk.controller.getVideoProxy()._ve.getCurrentTime();
			//console.log("[BB]["+moduleData.module_designator+"] Current Time = "+currentMediaTime);
			
			$pdk.controller.setReleaseURL(linkUrl);
	    });
	}
	

	// Shows or hides the modifier indicator based on the parameter passed.
	modifierhandler.prototype.showModifierIndicator = function(showIndicator){
		if (showIndicator) {
			moduleData.object.fadeIn(200);
		} else {
			moduleData.object.fadeOut(200);
		}
	}


	// Responds to the video playing, which is our cue to try our clip start seek.
	modifierhandler.prototype.mediaPlayingHandler = function(event) {
		
		// If the clip is just starting, seek to the saved media time.
		if (!moduleData.status.media_playing) {
			moduleData.status.media_playing = true;

			// If the start time is greater than a second, then seek to that position.  Otherwise start from beginning.
			if (currentMediaTime > 1000) {
				//console.log("[BB]["+moduleData.module_designator+"] Seeking to Current Time = "+currentMediaTime);
				$pdk.controller.seekToPosition(currentMediaTime);
			}
		}
	}


	// Responds to video seek events, which is when we want to transition the player back in.
	modifierhandler.prototype.mediaSeekHandler = function(event) {
		
		// If the player is currently transitioned out, transition it back in.
		if (moduleData.status.transitioned_out) {
			//moduleData.timeout = setTimeout(function() {
				self.transitionPlayerOut(false);
				//moduleData.timeout = null;
			//}, 1000);
		}
	}


	// Loads the current modifier
	modifierhandler.prototype.loadModifiers = function(event) {
				
		var result = _.contains(this.modifierIDs, event.data.baseClip.guid);
		
		var hasModifier	= false;

		moduleData.status.media_playing = false;
		
		if(result){
			//This may be part of a modifier playback
			hasModifier	= true;
		}else{
			//This is a new clip playback, check for modifiers. 
			//first clip is always the active guid
			this.modifierIDs.push(event.data.baseClip.guid);
			
			//this will allow for fast key access.  will expand later for multiple modifiers. 
			if(event.data.baseClip.contentCustomData["relatedVideos.mod.1"] !== undefined){
				this.modifierIDs.push(event.data.baseClip.contentCustomData["relatedVideos.mod.1"]);

				parentData.callback(UI_MODEL_STATES.state_ready, moduleData);
			}else{
				//set modifier array to empty when none exists
				this.modifierIDs = [];
			}
		}

		// Update the visibility state of the modifier indicator.
		this.showModifierIndicator(moduleData.status.is_modifier);

		// If the start time is greater than a second, then mute in anticipation of a seek upon play.
		if (currentMediaTime > 1000) {
			// Initially mute the player until it has a change to catch up and play at the right spot.
			self.transitionPlayerOut(true);
		}
	}


	// Loads the current modifier
	modifierhandler.prototype.transitionPlayerOut = function(transitionOut) {
		if (transitionOut) {
			$pdk.controller.mute(true);
			$('.tpVideo').css('visibility', 'hidden');
			moduleData.status.transitioned_out = true;
			console.log("Transitioned Out");
		} else {
			$pdk.controller.mute(false);
			$('.tpVideo').css('visibility', 'visible');
			moduleData.status.transitioned_out = false;
			console.log("Transitioned In");
		}
	}

	return modifierhandler;
});

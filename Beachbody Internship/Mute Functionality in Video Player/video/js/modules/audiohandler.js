define(['jquery','menu','cookie'], function($,menu,cookie){
	var self = null;
	var parentData = {callback:null, element:null};
	var moduleData = {module_designator:"module.audiohandler", menu_designator:"menu.language", type:"audioTracks", data:{menu_config:null, audio_tracks:null, audio_tracks_raw:null, active_tracks:{previous:null, current:null}}, menu_handler:null, menu_object:null, video_object:null};
	var audioSwitchObject = null;
	var audioTrackSwitchEventCustom = null;


	// Constructor
	function audiohandler(callback, element) {
		self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");

		// Store the parent callback and element for later use.
		parentData.callback = callback;
		parentData.element = element;

		// If the runtime is HTML5, define listeners for HTML5 events.
		if ($pdk.videoEngineRuntime === "html5") {
			moduleData.video_object = document.getElementsByTagName("video")[0];
			moduleData.video_object.addEventListener("loadeddata", self.collectHTML5TrackData);	

		// If the runtime is flash, define listeners for PDK events.
		} else {
			$pdk.controller.addEventListener("OnMediaStart", self.collectFlashTrackData);
			$pdk.controller.addEventListener("OnAudioTrackSwitched", function(event) {
				self.dispatchAudioSwitchedBB();
			});
		}

		// Listener for custom event added to document for feedback.
		document.addEventListener("OnAudioTrackSwitchedBB", self.audioTrackSwitched);

		// Inform the menu manager that this module is initializing.
		parentData.callback(UI_MODEL_STATES.state_init, moduleData);
	}


	/**********************************************************************************************/
	/********************************* Audio Track Handling ***************************************/
	/**********************************************************************************************/
	

	// Upon the appropriate player event, this method looks for audio tracks within the HTML5 video tag's data.
	audiohandler.prototype.collectHTML5TrackData = function() {
		
		moduleData.data.audio_tracks_raw = new Array();

		// Since the audioTrack array is handled a little differently, transfer each of the audio tracks to our raw array.
		for (var i=0; i < moduleData.video_object.audioTracks.length; i++) {
			moduleData.data.audio_tracks_raw[i] = moduleData.video_object.audioTracks[i];
		}

		moduleData.data.audio_tracks = moduleData.data.audio_tracks_raw.slice();

		console.log("[BB]["+moduleData.module_designator+"] moduleData.data.audio_tracks: ", moduleData.data.audio_tracks_raw);

		// If audio tracks are found, prepare them now for menu creation
		if (moduleData.data.audio_tracks.length > 0) {
			
			// Prepares the HTML5 array for menu creation
			self.prepareHTML5TrackArray(moduleData.data.audio_tracks);

		// If no audio tracks are found, then insert two standard items into the menu array
		} else {
			
			// Populates the audio tracks with placeholder values.
			moduleData.data.audio_tracks = [
				{markup:"Audio",type:UI_MENU_ITEM_TYPES.menu_item_title}, 
				{markup:"English", type:UI_MENU_ITEM_TYPES.menu_item_selectable}
			];

			self.setInitialMenuState(1, true);
		}
	}


	// Upon the appropriate player event, this method looks for audio tracks within the PDK's controller.
	audiohandler.prototype.collectFlashTrackData = function(event) {

		moduleData.data.audio_tracks_raw = event.data.baseClip.availableAudioTracks;
		moduleData.data.audio_tracks = moduleData.data.audio_tracks_raw.slice();

		console.log("[BB]["+moduleData.module_designator+"] moduleData.data.audio_tracks: ", moduleData.data.audio_tracks_raw);

		// If audio tracks are found, parse through them now
		if (moduleData.data.audio_tracks.length > 0) {
			
			//Load the M3U8 for parsing
			self.loadM3U8(event.data.URL);

		// If no audio tracks are found, then insert two standard items into the menu array
		} else {
			
			// Populates the audio tracks with placeholder values.
			moduleData.data.audio_tracks = [
				{markup:"Audio",type:UI_MENU_ITEM_TYPES.menu_item_title}, 
				{markup:"English", type:UI_MENU_ITEM_TYPES.menu_item_selectable}
			];

			self.setInitialMenuState(1, true);
		}
	}
		

	// Flash Runtime Only - Loads the raw M3U8 so that language and title values can be obtained.
	audiohandler.prototype.loadM3U8 = function(loadURL) {	        
        // Load the raw M3U8
        $.ajax({
            url: loadURL,
            async: true,
            success: function(dataObject){
				//console.log("[BB] M3U8 = " + dataObject);
				self.prepareFlashTrackArray(dataObject); // Now parse the data
			}
        });
	}


	// Parses the returned raw M3U8 file and grabs specific values that we deem important.
	audiohandler.prototype.prepareFlashTrackArray = function(dataObject) {
		var resultsArray = [];
		var propertyArray = [];
		var tracksArray = [];
		var audioTrackIndex = 0;
		var startIndex = 0;

		// Split the M3U into lines using the # as a delimiter
		resultsArray = dataObject.split("#");

		// Iterate through each line of the M3U8
		for (var i=0; i < resultsArray.length; i++){

			// Looks for audio track data
			if (resultsArray[i].indexOf("TYPE=AUDIO") > -1) {
				propertyArray = resultsArray[i].split(",");

				//console.log("Audio Track found at index "+i);
				tracksArray[audioTrackIndex] = new Object();
				
				// Iterates through each property.
				for (var j=0; j < propertyArray.length; j++){
					startIndex = propertyArray[j].indexOf("\""); //Grab the index of the first quotation mark.

					// Looks for the NAME property.
					if (propertyArray[j].indexOf("NAME=") > -1) {
						tracksArray[audioTrackIndex].title = propertyArray[j].substring(startIndex + 1, propertyArray[j].length - 1);
					// Looks for the LANGUAGE property.
					} else if (propertyArray[j].indexOf("LANGUAGE=") > -1) {
						tracksArray[audioTrackIndex].language = propertyArray[j].substring(startIndex + 1, propertyArray[j].length - 1);
					}
				}

				audioTrackIndex++;

				// Clear the array for the next pass.
				propertyArray = [];
			}
		}

		//console.log("[BB]["+moduleData.module_designator+"] Tracks found = " + moduleData.data.audio_tracks.length + ", Tracks Parsed = " + tracksArray.length);

		//Adjust for the old and new ways the PDK uses to handle audio tracks
		if (moduleData.data.audio_tracks.length > tracksArray.length) {
			audioTrackIndex = moduleData.data.audio_tracks.length - tracksArray.length;

			// Set the default audio track to English
			moduleData.data.audio_tracks[0].title = "English";
			moduleData.data.audio_tracks[0].language = "en";
			moduleData.data.audio_tracks[0].markup = moduleData.data.audio_tracks[0].title;
			moduleData.data.audio_tracks[0].type = UI_MENU_ITEM_TYPES.menu_item_selectable;
		} else {
			audioTrackIndex = 0;
		}

		//Transcribe each track to the global moduleData.data.audio_tracks array.
		for (var k=0; k < tracksArray.length; k++) {
			moduleData.data.audio_tracks[audioTrackIndex].title = tracksArray[k].title;
			moduleData.data.audio_tracks[audioTrackIndex].language = tracksArray[k].language;
			moduleData.data.audio_tracks[audioTrackIndex].markup = tracksArray[k].title; // The value used to by the menu module.
			moduleData.data.audio_tracks[audioTrackIndex].type = UI_MENU_ITEM_TYPES.menu_item_selectable;

			audioTrackIndex++;
		}

		//Add the Menu Title Box
		moduleData.data.audio_tracks.unshift({markup:"Audio",type:UI_MENU_ITEM_TYPES.menu_item_title});

		self.setInitialMenuState();
	}


	// Prapares the HTML5 track array so that it's ready for menu creation.
	audiohandler.prototype.prepareHTML5TrackArray = function(tracksArray) {
		
		//Transcribe each track to the global moduleData.data.audio_tracks array.
		for (var i=0; i < tracksArray.length; i++) {
			moduleData.data.audio_tracks[i].markup = moduleData.data.audio_tracks[i].label; // The value used to by the menu module.
			moduleData.data.audio_tracks[i].type = UI_MENU_ITEM_TYPES.menu_item_selectable;
		}

		//Add the Menu Title Box
		moduleData.data.audio_tracks.unshift({markup:"Audio",type:UI_MENU_ITEM_TYPES.menu_item_title});

		self.setInitialMenuState();
	}


	// Prepares the menu for use considering past user selections to prepare the initial state.
	audiohandler.prototype.setInitialMenuState = function(indexOveride, bypassCookie) {
		var adjustedIndex = cookie.getCookie(bbPlayer.config.data.mpxReferenceID+"_audio"); // Retrieve the program specific audio cookie here

		adjustedIndex = (indexOveride) ? indexOveride : ((adjustedIndex) ? (Number(adjustedIndex)+1) : 1);  // Check if the cookie exists first.

		// If the adjusted index is greater than or equal to the audio track count, then set the adjusted index first option
		if (adjustedIndex >= moduleData.data.audio_tracks.length) {
			adjustedIndex = 1;
			bypassCookie = true;
		}

		// Configure the Audio Menu UI for use.
		self.audioControlsHandler(moduleData.data.audio_tracks);

		//console.log("[BB]["+moduleData.module_designator+"] Default Audio Track Index["+adjustedIndex+"]");

		// By default, index 0 is chosen if there isn't a value pulled from cookie
		self.menuItemSelectHandler(adjustedIndex, bypassCookie);
	}


	// Prepares the menu data and initializes/updates a menu object using the newly constructed data.
	audiohandler.prototype.audioControlsHandler = function(trackArray) {
		moduleData.data.menu_config = {id:moduleData.type, data:trackArray, callback:self.menuCallback, element:parentData.element};

		// If the menu handler and menu object haven't yet been defined, do so now.
		if (!moduleData.menu_handler && !moduleData.menu_object) {
			moduleData.menu_handler = new menu(moduleData.data.menu_config);
			moduleData.menu_object = moduleData.menu_handler.getMenuObject();

			// Inform menu manager of ready status
			parentData.callback(UI_MODEL_STATES.state_ready, moduleData);

		// If the menu handler and object have been defined, then simply update the existing elements.
		} else {
			moduleData.menu_handler.updateMenuWithData(moduleData.menu_object, trackArray);

			// Inform menu manager of update status.
			parentData.callback(UI_MODEL_STATES.state_update, moduleData);
		}
	}


	/**********************************************************************************************/
	/******************************* Menu Item Select Handling ************************************/
	/**********************************************************************************************/
		

	// This callback captures all click events on menu items.
	audiohandler.prototype.menuCallback = function(e) {
		self.menuItemSelectHandler( Number(e.target.id.slice(-1)) );
	}


	// Selects an audio track and menu item with the passed index.
	audiohandler.prototype.menuItemSelectHandler = function(audioTrackIndex, bypassCookie) {
		var pdkAdjustedIndex = audioTrackIndex - 1; //Accounts for the additional index needed for title.

		if (audioTrackIndex > 0) {
			// If the current track has a language property, then it's a valid audio track, select it now.
			if (moduleData.data.audio_tracks[audioTrackIndex].language) {
				
				// Performs the action of actually selecting the new track within the player.
				self.selectAudioTrackByIndex(pdkAdjustedIndex);
			}

			// Updates the menu item selection within the menu
			moduleData.menu_handler.selectMenuItemWithIndex(audioTrackIndex, moduleData.type);

			// If allowed, remember the user's decision now.
			if (!bypassCookie) {
				cookie.setCookie(bbPlayer.config.data.mpxReferenceID+"_audio", pdkAdjustedIndex, INTERVAL_2_DAY_SEC); // Set cookie here. Prepends program name so that these settings will only persist within the program.
			}
		}
	}


	// Selects the current audio track by index and selctively handles this based on the video engine runtime
	audiohandler.prototype.selectAudioTrackByIndex = function(audioTrackIndex) {
		
		moduleData.data.audioTrackIndex = audioTrackIndex; // Update the audio track index.
		moduleData.data.active_tracks.previous = moduleData.data.active_tracks.current; // Transfers the current audio track to the previous track object.

		// If the video runtime is html5, handle audio tracks manually
		if ($pdk.videoEngineRuntime === "html5") {
			
			// Iterate through each audio track object and determine the enabled status of each.
			for (var i=0; i < moduleData.data.audio_tracks_raw.length; i++) {
				if (i === audioTrackIndex) {
					moduleData.data.audio_tracks_raw[i].enabled = true;
					moduleData.data.active_tracks.current = {index:i, data:moduleData.data.audio_tracks_raw[i]};
				} else {
					moduleData.data.audio_tracks_raw[i].enabled = false;
				}
			}

			// Since HTML5 handles things a little differently, dispatch the custom event now.
			self.dispatchAudioSwitchedBB();

		// If the video runtime is flash, handle audio tracks through the PDK
		} else {
			
			$pdk.controller.setAudioTrackByIndex(audioTrackIndex);

			moduleData.data.active_tracks.current = {index:audioTrackIndex, data:moduleData.data.audio_tracks_raw[audioTrackIndex]};
		}
	}


	/**********************************************************************************************/
	/********************************* Custom Event Handling **************************************/
	/**********************************************************************************************/
		

	// Dispatches the custom event, handling flash player and HTML5 accordingly
	audiohandler.prototype.dispatchAudioSwitchedBB = function(){
		// Since the data has since changed, redefine the event data
		self.defineAudioSwitchedBB();

		// Dispatch the custom event now that the event data has changed.
		document.dispatchEvent(audioTrackSwitchEventCustom);
	}


	// Redefines the custom event object.
	audiohandler.prototype.defineAudioSwitchedBB = function(){
		
		// Update the audioSwitch object, which serves as the data payload for our custom event.
		audioSwitchObject = self.constructAudioSwitchObject();

		// Update the global audio track object as well.
		globalData.currentAudioTrack = audioSwitchObject.newAudioTrack;

		// If this object already exists, clear it first
		if (audioTrackSwitchEventCustom) {
			audioTrackSwitchEventCustom = null;
		}

		// Define the custom event here
		audioTrackSwitchEventCustom = new CustomEvent(
			"OnAudioTrackSwitchedBB", 
			{
				detail: audioSwitchObject,
				bubbles: true,
				cancelable: true
			}
		);
	}


	// Takes the original AudioSwitched object, populates the missing data and returns the modified version.
	audiohandler.prototype.constructAudioSwitchObject = function(){
		var dataObjectModified = null;
		var oldAudioTrackData = null;
		var newAudioTrackData = null;
		
		if (moduleData.data.active_tracks.previous) {
			oldAudioTrackData = {globalDataType:"com.theplatform.com.data::AudioTrack", index: moduleData.data.active_tracks.previous.index, language:moduleData.data.active_tracks.previous.data.language, title:moduleData.data.active_tracks.previous.data.markup};
		}

		if (moduleData.data.active_tracks.current) {
			newAudioTrackData = {globalDataType:"com.theplatform.com.data::AudioTrack", index: moduleData.data.active_tracks.current.index, language:moduleData.data.active_tracks.current.data.language, title:moduleData.data.active_tracks.current.data.markup};
		}

		dataObjectModified = {newAudioTrack:newAudioTrackData, oldAudioTrack:oldAudioTrackData};

		return dataObjectModified;
	}


	// Handles the custom audio track switched event firing.
	audiohandler.prototype.audioTrackSwitched = function(event){
		var timout = null;
		var interval = 160;

		//console.log("[BB]["+moduleData.module_designator+"] Custom Event["+event.type+"] Fired: ", event);

		// NOTE: For some reason, when switching HTML5 manually to a non-english track, the inline captions turn on.  The following turns it off.
		if ($pdk.videoEngineRuntime === "html5") {
			timeout = setInterval(function() {
				for (var i = 0; i < moduleData.video_object.textTracks.length; i++) {
					if (moduleData.video_object.textTracks[i].mode === "showing" || interval === 0) {
						moduleData.video_object.textTracks[i].mode = 'disabled';
						
						//console.log( ((interval > 0) ? "[BB] Active Text Track at Index["+i+"]" : "[BB] No Active Text Tracks Found") );

						clearInterval(timeout);
						interval = 160;
					}
				}

				interval--;
			}, 5);
		}
	}


	// Returns the module data object.
	audiohandler.prototype.getModelData = function(){
		return moduleData;
	}


	return audiohandler;
});

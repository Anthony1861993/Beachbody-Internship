define(['jquery'], function($){
	var self = null;
	var moduleData = {module_designator:"module.playlisthandler", playlist_data:null, status:{playlist_available:false, current_index:0}, break_interval_object:-1, break_interval:10000};
	

	// Constructor
	function playlisthandler() {
		self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");

		// Associates this module's iframe callback method to the global playlist callback
		playlistHandlerCallback = self.iFrameCallback;

		// Initialize all listeners and handling required to properly handle the playlist.
		self.initializePlaylistHandler();
	}


	// Subscribes to a few necessary listeners and looks for the playlist.
	playlisthandler.prototype.initializePlaylistHandler = function() {
		
		// Looks for media end events.
		$pdk.controller.addEventListener("OnMediaEnd", self.videoEndHandler);
		
		// A custom event defined in endCardHandler, looks for user interaction
		document.addEventListener("OnViewerClickEndCard", self.playerFeedbackHandler);

		// Looks for playlist data left in the global playlist variable.
		self.updatePlaylist();
	}


	// Performs the necessary steps to prepare and execute the action of loading the next video in the playlist.
	playlisthandler.prototype.loadNextVideo = function() {
		self.loadVideoWithPlaylistItem(moduleData.playlist_data[moduleData.status.current_index]);
		moduleData.status.current_index++;
	}


	// Loads a new release based on the passed guid and title.
	playlisthandler.prototype.loadVideoWithPlaylistItem = function(playlistItem) {
		
		var url = "https://feed.theplatform.com/f/"+bbPlayer.config.data.mpxAccount+"/B0Xsr4HI9Tzx?byGuid="+playlistItem.guid+"&form=json&fields=content.url";
	    
	    bbPlayer.config.data.programName = playlistItem.title;

	    $.get(url, function(data, status){
			var obj = JSON.parse(data);
			var linkUrl = obj.entries[0]["media$content"][0]["plfile$url"];
			
			$pdk.controller.setReleaseURL(linkUrl);
	    });
	}


	// Checks the global playlistData object and updates the module's playlist data accordingly when executed.
	playlisthandler.prototype.updatePlaylist = function() {
		
		// If there is playlist data available proceed.
		if (playlistData) {
			
			// If the playlist is populated with value proceed.
			if (playlistData.playlist.length > 0) {
				moduleData.playlist_data = playlistData.playlist;
				moduleData.status.playlist_available = true;
				moduleData.status.current_index = (playlistData.startIndex) ? playlistData.startIndex : 0;
				moduleData.break_interval = (playlistData.interval) ? playlistData.interval : moduleData.break_interval;

				console.log("[BB] Playlist Found: ", moduleData.playlist_data);
			}
		}
	}


	// Starts the break between videos, firing an event that displays the end card.
	playlisthandler.prototype.startBreak = function(){
		self.dispatchCustomEventStart();

		moduleData.break_interval_object = setTimeout(self.endBreak, moduleData.break_interval);
	}


	// Ends the break between videos, firing an event that hides the end card.
	playlisthandler.prototype.endBreak = function(){
		self.dispatchCustomEventEnd();

		// Clears the interval for later use.
		clearInterval(moduleData.break_interval_object);

		self.loadNextVideo();
	}


	/**********************************************************************************************/
	/********************************** Custom Event Handling *************************************/
	/**********************************************************************************************/


	// Dispatches the custom start break event.
	playlisthandler.prototype.dispatchCustomEventStart = function(){
		self.dispatchCustomEvent("event.start");
	}


	// Dispatches the custom end break event.
	playlisthandler.prototype.dispatchCustomEventEnd = function(){
		self.dispatchCustomEvent("event.end");
	}


	// Prepares a custom event using the passed event name and then dispatches it.
    playlisthandler.prototype.dispatchCustomEvent = function(eventName){
        var eventObject = self.defineCustomEvent(eventName);

        // Dispatch the custom event now that the event data has changed.
        if (moduleData.status.playlist_available && eventObject) {
        	document.dispatchEvent(eventObject);
    	}
    }


    // Creates a custom event object using the passed event name and returns a fully qualified event for use.
    playlisthandler.prototype.defineCustomEvent = function(eventName){
    	var newEvent = null;
    	var nextTitle = null;

    	// Creates an event object for the custom start event.
    	if (eventName === "event.start") {
    		
    		// Checks if there is playlist data
    		if (moduleData.playlist_data) {
	    		
	    		// If there is a next index, grab the title now.
	    		if (moduleData.playlist_data[(moduleData.status.current_index)]) {
	    			nextTitle = moduleData.playlist_data[(moduleData.status.current_index)].title;
	    		// If there is no next element, then we're at the end of the playlist. Cancel the impending break.
	    		} else {
	    			moduleData.status.playlist_available = false;
	    		}
	    	}

    		newEvent = new CustomEvent(
	            "OnPostVideoBreakStart", 
	            {
	                detail: {break_status:true, break_interval:moduleData.break_interval, break_title:nextTitle},
	                bubbles: true,
	                cancelable: true
	            }
	        );
	    // Creates an event object for the custom end event.
    	} else if (eventName === "event.end") {
    		
    		newEvent = new CustomEvent(
	            "OnPostVideoBreakEnd", 
	            {
	                detail: {break_status:false},
	                bubbles: true,
	                cancelable: true
	            }
	        );
    	}
    	
    	return newEvent;
    }


    /**********************************************************************************************/
	/**************************************** Listeners *******************************************/
	/**********************************************************************************************/


    // If the user interacts and presses the skip button within the end card, this method responds and ends the break early.
	playlisthandler.prototype.playerFeedbackHandler = function(event) {
		self.endBreak();
	}


	// The callback that associated with the global iframe callback. Used for updating the playlist mid-play.
	playlisthandler.prototype.iFrameCallback = function(playlistData) {
		self.updatePlaylist();
	}


	// Handles the end event for videos played.
	playlisthandler.prototype.videoEndHandler = function(event){
		if (moduleData.status.playlist_available) {
			self.startBreak();
		}
	}

	return playlisthandler;
});

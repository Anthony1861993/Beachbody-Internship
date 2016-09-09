define(['jquery','cookie','pubnub'], function($,cookie,pubnub){
	var self = null;
	var parentData = {callback:null, element:null};
	var moduleData = {module_designator:"module.resumehandler", menu_designator:"menu.resume", menu_object:null, resume_point:null, base_clip:null, current_time:0, tracking_allowed:false};
	var playingIncrementor = 0;
	var playingIncrementorLimit = 18; // Equals roughly 5 seconds per update
	var resumeTracking = 	{
								start:{value:INTERVAL_2_MIN_MS, min:15000, max:INTERVAL_2_MIN_MS, percent:0.06}, 
								end:{value:INTERVAL_3_MIN_MS, min:15000, max:INTERVAL_3_MIN_MS, percent:0.1}
							};
	var resumePointFallback = 5000; // The amount of seconds it will resume before the resume point.
	var delayedPause = false;

	// Constructor
	function resumehandler(callback, element) {
		self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");

		// Store the parent callback and element for later use.
		parentData.callback = callback;
		parentData.element = element;

		self.initializeResumeHandler();
	}


	/**********************************************************************************************/
	/********************************* Audio Track Handling ***************************************/
	/**********************************************************************************************/
	

	// Upon the appropriate player event, this method looks for audio tracks within the HTML5 video tag's data.
	resumehandler.prototype.initializeResumeHandler = function() {
		// Builds the resume message window for use.
		self.buildResumeWindow();
		
		//Used to initialize the whole process of resume point handling
		$pdk.controller.addEventListener("OnMediaStart", self.checkForResumePoint);
		
		// Used to listen for video specific events that dictate when to save the user's resume point.
		$pdk.controller.addEventListener("OnMediaPlaying", self.resumeTrackingPlaying);
		$pdk.controller.addEventListener("OnMediaPause", self.resumeTrackingPause);
	}


	// Creates the resume window and all sub-components within the window.
	resumehandler.prototype.buildResumeWindow = function() {
		
		// If there is no resume window, create it now.
		if ($("#resumeWindow").length === 0) {
			
			var resumeBackground = $("<div>", {id: "resumeWindow", class: "window_darken"});
			resumeBackground.appendTo(parentData.element);
			resumeBackground.hide();

			var resumeWindow = $("<div>", {id: "resumeWindowObject", class: "resume_window"});
			resumeWindow.appendTo(resumeBackground);

			var resumeWindowMessage = $("<div>", {id: "resumeWindowMessage", class: "resume_window_message"});
			resumeWindowMessage.html(self.retrieveResumeMessageString());
			resumeWindowMessage.appendTo(resumeWindow);

			var resumeButtonContainer = $("<div>", {id: "resumeButtonContainer", class: "resume_button_container"});
			resumeButtonContainer.appendTo(resumeWindow);

			var resumeButton1 = $("<div>", {id:"resumeButtonResume", class: "resume_button button_selected"});
			resumeButton1.html("RESUME WORKOUT");
			resumeButton1.on("click.resumeButton", self.displayResumeMessageCallback);
			resumeButton1.appendTo(resumeButtonContainer);

			var resumeButton2 = $("<div>", {id:"resumeButtonStart", class: "resume_button"});
			resumeButton2.html("START OVER");
			resumeButton2.on("click.resumeButton", self.displayResumeMessageCallback);
			resumeButton2.appendTo(resumeButtonContainer);

		// If the resume window already exists, only update the resume message.
		} else {
			$("#resumeWindowMessage").html(self.retrieveResumeMessageString());
		}
	}


	// Creates the resume window and all sub-components within the window.
	resumehandler.prototype.retrieveResumeMessageString = function() {
		//"You recently started <span class='resume_text_underscore'>"+bbPlayer.config.data.programName +"</span><br/>Would you like to resume where you left off?";
		console.log("[BB] bbPlayer.config = ",bbPlayer.config);
		return "<span class='resume_message_small_impact'>Current Workout:</span><br/><span class='resume_message_bold'>"+bbPlayer.config.data.programName +"</span>";
	}

	
	// Original functionality of this function is now done in 
	// checkForResumePointCallback(), which will get called shortly after this function.
	resumehandler.prototype.checkForResumePoint = function(event) {
		self.getTrackingCookie();

		// Remove the OnMediaStart listener as it's only needed once and now not needed anymore.
		$pdk.controller.removeEventListener("OnMediaStart", self.checkForResumePoint);

		moduleData.base_clip = event.data.baseClip;
	}


	// Acts as the callback for the getPubnub() function in pubnub.js.
	// Checks whether there's a resume point and acts accordingly.
	resumehandler.prototype.checkForResumePointCallback = function(savedTimeValue) {
		savedTimeValue = ((savedTimeValue) ? Number(savedTimeValue) : -1);

		// If PubNub is down && local cookie exists, use the local cookie 
		if ((savedTimeValue == -1) && cookie.getCookie(self.getPubnubChannel()+"_resume")) {
			console.log("[BB]: PubNub is down, using local cookie...");
			savedTimeValue = Number(cookie.getCookie(self.getPubnubChannel()+"_resume"));
		}

		console.log("[BB] BaseClip = ", moduleData.base_clip);
		console.log("[BB] Data = ", bbPlayer.config.data);
		console.log("[BB] Saved Time = ", savedTimeValue);

		// If there's a saved resume point, show the resume message now.
		if (savedTimeValue > -1) {
			moduleData.resume_point = savedTimeValue;

			$pdk.controller.mute(true); // Mute now so that any video that plays before delayed pause will be muted.
			delayedPause = true; // Set up a delayed pause now to trigger once the video starts playing.

			self.displayResumeMessage(true);
		} else {
			moduleData.tracking_allowed = true;

			self.dispatchResumeClearEvent();
		}
	}


	// Handles the OnMediaPause event of the player.
	resumehandler.prototype.resumeTrackingPause = function() {
		// If we're allowed to track the resume point, proceed.
		if (self.resumeTrackingAppropriate()) {
			self.updateTrackingCookie();
		}
	}


	// Handles the OnMediaPlaying event of the player.
	resumehandler.prototype.resumeTrackingPlaying = function() {
		
		// If a delayed pause is specified, do it now.
		if (delayedPause) {
			delayedPause = false;
			$pdk.controller.pause(true);
			$pdk.controller.mute(false);
			return;
		}

		// If we're allowed to track the resume point, proceed.
		if (playingIncrementor > playingIncrementorLimit) {
			playingIncrementor = 0;

			// If we're eligible to set a resume point, do so now.
			if (self.resumeTrackingAppropriate()) {
				self.updateTrackingCookie();
			
			// If we're not eligible to track proceed
			} else {
				// If we're allowed to track, proceed
				
				if (moduleData.tracking_allowed) {
					// If there's a valid cookie, clear it now.
					//if (self.getTrackingCookie()) {
						self.deleteTrackingCookie();
					//}
				}

			}
		} else {
			playingIncrementor++;
		}
	}


	// Displays or hides the resume message based on the passed parameter.
	resumehandler.prototype.displayResumeMessage = function(showMessage, intervalOverride) {
		var adjustedInterval = (intervalOverride) ? intervalOverride : 200;

		if (showMessage) {
			$("#resumeWindow").fadeIn(adjustedInterval);
		} else {
			$("#resumeWindow").fadeOut(adjustedInterval);
		}
	}


	// Acts as the callback for the resume UI buttons.
	resumehandler.prototype.displayResumeMessageCallback = function(event) {
		console.log("Resume Handler Callback:", event.target.id);

		// If the resume button is pressed, seek to the saved position.
		if (event.target.id === "resumeButtonResume") {
			// Seeks to the resume point minus 5 seconds
			$pdk.controller.seekToPosition((moduleData.resume_point - resumePointFallback));
		} else {
			// Reset the cookie now.
			self.deleteTrackingCookie();
		}

		// Hides the resume message.
		self.displayResumeMessage(false);
		self.dispatchResumeClearEvent();

		// Marks the point where tracking is allowed, regardless of whether it's appropriate.
		moduleData.tracking_allowed = true;

		// Unpause playback now as either way, we'll need the video to start playing now.
		$pdk.controller.pause(false);
	}


	// Consolidates several factors in order to determine whether it's appropriate to be tracking the user's progress.
	resumehandler.prototype.resumeTrackingAppropriate = function() {
		moduleData.current_time = $pdk.controller.getVideoProxy()._ve.getCurrentTime();

		var startIntervalRaw = moduleData.base_clip.trueLength * resumeTracking.start.percent;
		var endIntervalRaw = moduleData.base_clip.trueLength * resumeTracking.end.percent;

		resumeTracking.start.value = (startIntervalRaw > resumeTracking.start.max) ? resumeTracking.start.max : ((startIntervalRaw > resumeTracking.start.min) ? startIntervalRaw : resumeTracking.start.min);
		resumeTracking.end.value = (endIntervalRaw > resumeTracking.end.max) ? resumeTracking.end.max : ((endIntervalRaw > resumeTracking.end.min) ? endIntervalRaw : resumeTracking.end.min);

		console.log("[BB] Resume Tracking [Start: "+resumeTracking.start.value+"][End: "+(moduleData.base_clip.trueLength - resumeTracking.end.value)+"][Total: "+moduleData.base_clip.trueLength+"]");

		if (moduleData.tracking_allowed && moduleData.current_time > resumeTracking.start.value && moduleData.current_time < (moduleData.base_clip.trueLength - resumeTracking.end.value)) {
			return true;
		} else {
			return false;
		}
	}


	// Updates the resume tracking cookie
	resumehandler.prototype.updateTrackingCookie = function() {
		//console.log("[BB] Resume cookie updated.");
		pubnub.setPubnub(self.getPubnubChannel(), moduleData.current_time);
		cookie.setCookie(self.getPubnubChannel()+"_resume", moduleData.current_time, INTERVAL_1_HOUR_MS);
	}


	// Deletes the resume tracking cookie
	resumehandler.prototype.deleteTrackingCookie = function() {
		//console.log("[BB] Clearing cookie now."); 
		pubnub.setPubnub(self.getPubnubChannel(), -1);
		cookie.deleteCookie(self.getPubnubChannel()+"_resume");
	}


	// Retrieves the resume tracking cookie
	resumehandler.prototype.getTrackingCookie = function() {
		//console.log("[BB] Resume cookie retrieved.");
		pubnub.getPubnub(self.getPubnubChannel(), self.checkForResumePointCallback);
	}


	// Retrieves the Pubnub channel name which will identify the workout of a specific user 
	resumehandler.prototype.getPubnubChannel = function() {
		//console.log("[BB] mpxReferenceID = "+bbPlayer.config.data.mpxReferenceID);
		//console.log("[BB] profileID = "+bbPlayer.config.data.profileID);
		return (bbPlayer.config.data.mpxReferenceID + "|" + bbPlayer.config.data.profileID);
	}


	/**********************************************************************************************/
	/********************************** Custom Event Handling *************************************/
	/**********************************************************************************************/


	// Dispatches a custom event that marks when the user has interacted with the end card.
    resumehandler.prototype.dispatchResumeClearEvent = function(){
        var eventObject = self.defineResumeClearEvent();

        // Dispatch the custom event now that the event data has changed.
        document.dispatchEvent(eventObject);
    }


    // Redefines the custom event object.
    resumehandler.prototype.defineResumeClearEvent = function(){
    	var eventObject = null;

        // Define the custom event here
        eventObject = new CustomEvent(
            "OnResumeClear", 
            {
                detail: true,
                bubbles: true,
                cancelable: true
            }
        );

        return eventObject;
    }

	return resumehandler;
});
define(['jquery','cookie'], function($,cookie){
	var self = null;
	var parentData = {callback:null, element:null};
	var moduleData = {module_designator:"module.resumehandler", menu_designator:"menu.resume", menu_object:null, resume_point:null, base_clip:null, current_time:0, tracking_allowed:false};
	var playingIncrementor = 0;
	var playingIncrementorLimit = 18; // Equals roughly 5 seconds per update
	var resumeTracking = {start:INTERVAL_2_MIN_MS, end:INTERVAL_3_MIN_MS};
	var resumePointFallback = 5000; // The amount of seconds it will resume before the resume point.

	// Constructor
	function resumehandler(callback, element) {
		self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");

		// Store the parent callback and element for later use.
		parentData.callback = callback;
		parentData.element = element;

		self.initializeResumeHandler();

		// Inform the menu manager that this module is initializing.
		parentData.callback(UI_MODEL_STATES.state_init, moduleData);
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

			var resumeButton1 = $("<div>", {id:"resumeButtonResume", class: "resume_button"});
			resumeButton1.html("Resume Workout");
			resumeButton1.bind("click.resumeButton", self.displayResumeMessageCallback);
			resumeButton1.appendTo(resumeButtonContainer);

			var resumeButton2 = $("<div>", {id:"resumeButtonStart", class: "resume_button"});
			resumeButton2.html("Start Over");
			resumeButton2.bind("click.resumeButton", self.displayResumeMessageCallback);
			resumeButton2.appendTo(resumeButtonContainer);

		// If the resume window already exists, only update the resume message.
		} else {
			$("#resumeWindowMessage").html(self.retrieveResumeMessageString());
		}
	}


	// Creates the resume window and all sub-components within the window.
	resumehandler.prototype.retrieveResumeMessageString = function() {
		return "You recently started <span class='resume_text_underscore'>"+bbPlayer.config.data.programName +"</span><br/>Would you like to resume where you left off?";
	}


	// Checks whether there's a resume point and acts accordingly.
	resumehandler.prototype.checkForResumePoint = function(event) {
		var savedTimeValue = self.getTrackingCookie();
		savedTimeValue = ((savedTimeValue) ? Number(savedTimeValue) : -1);

		// Remove the OnMediaStart listener as it's only needed once and now not needed anymore.
		$pdk.controller.removeEventListener("OnMediaStart", self.checkForResumePoint);

		moduleData.base_clip = event.data.baseClip;

		console.log("[BB] BaseClip = ", moduleData.base_clip);
		console.log("[BB] Data = ", bbPlayer.config.data);
		console.log("[BB] Saved Time = ", savedTimeValue);

		// If there's a saved resume point, show the resume message now.
		if (savedTimeValue > -1) {
			moduleData.resume_point = savedTimeValue;

			$pdk.controller.pause(true);
			self.displayResumeMessage(true);
		} else {
			moduleData.tracking_allowed = true;
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
					if (self.getTrackingCookie()) {
						self.deleteTrackingCookie();
					}
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

		// Unpause playback now as either way, we'll need the video to start playing now.
		$pdk.controller.pause(false);

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

		// Marks the point where tracking is allowed, regardless of whether it's appropriate.
		moduleData.tracking_allowed = true;
	}


	// Consolidates several factors in order to determine whether it's appropriate to be tracking the user's progress.
	resumehandler.prototype.resumeTrackingAppropriate = function() {
		moduleData.current_time = $pdk.controller.getVideoProxy()._ve.getCurrentTime();

		//console.log("[BB] Resume Tracking [Start: "+resumeTracking.start+"][End: "+(moduleData.base_clip.trueLength - resumeTracking.end)+"]");

		if (moduleData.tracking_allowed && moduleData.current_time > resumeTracking.start && moduleData.current_time < (moduleData.base_clip.trueLength - resumeTracking.end)) {
			return true;
		} else {
			return false;
		}
	}


	// Updates the resume tracking cookie
	resumehandler.prototype.updateTrackingCookie = function() {
		console.log("[BB] Resume cookie updated.");
		cookie.setCookie(self.getCookiePrefix()+"_resume", moduleData.current_time, INTERVAL_1_HOUR_SEC);
	}


	// Deletes the resume tracking cookie
	resumehandler.prototype.deleteTrackingCookie = function() {
		console.log("[BB] Clearing cookie now.");
		cookie.deleteCookie(self.getCookiePrefix()+"_resume");
	}


	// Retrieves the resume tracking cookie
	resumehandler.prototype.getTrackingCookie = function() {
		console.log("[BB] Resume cookie retrieved.");
		return cookie.getCookie(self.getCookiePrefix()+"_resume");
	}


	// Retrieves the cookie prefix value which will identify the workout
	resumehandler.prototype.getCookiePrefix = function() {
		return bbPlayer.config.data.mpxReferenceID;
	}

	return resumehandler;
});
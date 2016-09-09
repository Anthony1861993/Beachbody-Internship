define(['jquery'], function($){
	var self = null;
	var parentData = {callback:null, element:null};
	var moduleData = {module_designator:"module.bboverlayhandler", overlay_object:null, time_data:null, feature_avaiable:false, feature_hidden:false};
	var uiFadeOutInterval = null;
	var userAgent = navigator.userAgent.toLowerCase();
	var playerPaused = false;
	var mousePosition = {x:0, y:0};
	var activationDistance = 60.0;


	// Constructor
	function bboverlayhandler(callback, element) {
		self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");

		parentData.callback = callback;
		parentData.element = element;

		$pdk.controller.addEventListener("OnMediaPlaying", self.onMediaPlayingHandler);
		$pdk.controller.addEventListener("OnMediaPause", self.onMediaPauseHandler);
		$pdk.controller.addEventListener("OnMediaUnpause", self.onMediaUnpauseHandler);

		// Determine if these controls are eligible to show.
		if (self.determineFeatureEligibility()) {
			self.initializeBBOverlay();
		}
	}


	// Returns the model data.
	bboverlayhandler.prototype.initializeBBOverlay = function(){

		var bbOverlayWindow = $("<div>", {id: "bbOverlay", class: "bb-overlay player_bottom"});
		bbOverlayWindow.appendTo(parentData.element);
		moduleData.overlay_object = bbOverlayWindow;

		var overlayRWButton = $("<div>", {id: "rwOVerlayButton", class: "bb-overlay-button bb-rw-button-large"});
		//overlayRWButton.on("mouseover.overlayRW", self.overlayMouseHandler);
		overlayRWButton.on("click.overlayRW", self.overlayRWButtonHandler);
		overlayRWButton.appendTo(bbOverlayWindow);
		
		var overlayPlayButton = $("<div>", {id: "playOverlayButton", class: "bb-overlay-button bb-play-button-large"});
		//overlayPlayButton.on("mouseover.overlayPlay", self.overlayMouseHandler);
		overlayPlayButton.on("click.overlayPlay", self.overlayPlayButtonHandler);
		overlayPlayButton.appendTo(bbOverlayWindow);

		var overlayFFButton = $("<div>", {id: "ffOverlayButton", class: "bb-overlay-button bb-ff-button-large"});
		//overlayFFButton.on("mouseover.overlayFF", self.overlayMouseHandler);
		overlayFFButton.on("click.overlayFF", self.overlayFFButtonHandler);
		overlayFFButton.appendTo(bbOverlayWindow);

		$(document.body).on("mousemove", self.mouseMoveHandler);

		self.hideOverlayFeature(true);
	}


	bboverlayhandler.prototype.determineFeatureEligibility = function(){
		var featureEligible = false;

		// If the current device isn't android, it's eligible to be seen.
		if (userAgent.indexOf("android") === -1) {
			featureEligible = true;
		}

		return featureEligible;
	}


	// Grabs the baseClip object for later use
	bboverlayhandler.prototype.onMediaPlayingHandler = function(event){
		moduleData.time_data = event.data;
	}


	// Handles the media pause events and updates the play button display state.
	bboverlayhandler.prototype.onMediaPauseHandler = function(event){
		playerPaused = true;

		self.showPlayButtonPaused(playerPaused);
	}


	// Handles the media unpause events and updates the play button display state.
	bboverlayhandler.prototype.onMediaUnpauseHandler = function(event){
		playerPaused = false;

		self.showPlayButtonPaused(playerPaused);
	}


	// Updates the display state of the play button based on the player's pause state.
	bboverlayhandler.prototype.showPlayButtonPaused = function(showPaused){
		if (showPaused) {
			$(".bb-play-button-large").addClass("paused");
		} else {
			$(".bb-play-button-large").removeClass("paused");
		}
	}


	// Handles the rewind button.
	bboverlayhandler.prototype.overlayRWButtonHandler = function(){
		self.jumpSeek(false);
	}


	// Handles the play button.
	bboverlayhandler.prototype.overlayPlayButtonHandler = function(){
		self.playPauseToggle();
	}


	// Handles the fast forward button.
	bboverlayhandler.prototype.overlayFFButtonHandler = function(){
		self.jumpSeek(true);
	}


	// Handles the rewind button.
	bboverlayhandler.prototype.mouseMoveHandler = function(event){
		var currentPosition = null;
		var vectorDistance = 0;

		if (!moduleData.feature_hidden) {
			currentPosition = self.returnMousePointWithData(event.clientX, event.clientY);
			vectorDistance = self.measureVectorDistance(mousePosition, currentPosition);

			// Determines whether 
			if (vectorDistance > activationDistance) {
				mousePosition = currentPosition;
				self.overlayMouseHandler();
			}
		}
	}


	// Handles the rewind button.
	bboverlayhandler.prototype.overlayMouseHandler = function(){
		self.showWithTimeout();
	}


	// Measures the distance of a vector between two points.
	bboverlayhandler.prototype.measureVectorDistance = function(point1, point2){
		return Math.sqrt( Math.pow( (point2.x - point1.x), 2) + Math.pow( (point2.y - point1.y), 2) );
	}


	// Returns a fully qualified point object from the passed data.
	bboverlayhandler.prototype.returnMousePointWithData = function(xVal, yVal){
		return {x:xVal, y:yVal};
	}


	// Toggles the play state of the PDK player.
	bboverlayhandler.prototype.playPauseToggle = function(){
		$pdk.controller.pause(!playerPaused);
	}


	// Toggles the play state of the PDK player.
	bboverlayhandler.prototype.jumpSeek = function(seekForward){
		var newAdjustedTime = (seekForward) ? (moduleData.time_data.currentTime + INTERVAL_1_MIN_MS) : (moduleData.time_data.currentTime - INTERVAL_1_MIN_MS);

		// If the adjusted time is less than 0, set it to 0.
		if (newAdjustedTime < 0) {
			newAdjustedTime = 0;
		// If the adjusted time is greater than the end of the clip, set it to just before the end
		} else if (newAdjustedTime > moduleData.time_data.duration) {
			newAdjustedTime = moduleData.time_data.duration - 2000; // Sets the seek point to just before the end.
		}

		$pdk.controller.seekToPosition(newAdjustedTime);
	}


	bboverlayhandler.prototype.showWithTimeout = function(timeoutIntervalOverride) {
		self.hideOverlay(false);

		self.checkAndClearFadeOverlay();

		uiFadeOutInterval = setInterval(function() {
			self.hideOverlay(true);
		}, 2000);
	}


	// Hides the feature overall
	bboverlayhandler.prototype.hideOverlayFeature = function(hideFeature) {
		moduleData.feature_hidden = hideFeature;
		
		if (hideFeature) {
			self.checkAndClearFadeOverlay();
			self.hideOverlay(hideFeature);
		}
	}


	// Hides the feature overall
	bboverlayhandler.prototype.checkAndClearFadeOverlay = function() {
		if (uiFadeOutInterval) {
			clearInterval(uiFadeOutInterval);
		}
	}


	// Hides the overlay upon command
	bboverlayhandler.prototype.hideOverlay = function(hideOverlay) {
		if (hideOverlay) {
			moduleData.overlay_object.fadeOut(200);
		} else {
			moduleData.overlay_object.fadeIn(200);
		}
	}

	return bboverlayhandler;
});

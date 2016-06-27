define(['jquery','errors','menumanager','resumehandler','endcardhandler','mutehandler'], function($,errors,menumanager,resumehandler,endcardhandler,mutehandler){
	var self = null;
	var uiManagerData = {
		module_designator:"module.uimanager",
		element: null,
		status:{is_full_screen:false},
		menus: {handler:null, status:{ready:false}},
		controls: {title_object:null, status:{modifier:false, cast:false, casting:false, title_visible:false}},
		resume: {handler:null},
		mutehandler: null,
		end_card: {handler:null}
	};


	// Constructor
	function uimanager() {
		self = this;

		console.log("[BB]["+uiManagerData.module_designator+"] Initializing...");

		uiManagerCallbackGlobal = self.uiManagerCallback;

		$pdk.controller.addEventListener("OnPlayerLoaded", self.initializeUIManger);
		document.addEventListener("OnPlayerReadyBB", self.initializePlayerTitleElement); // Taps into a custom event that better coincides with the player controls appearing.
	}


	/**********************************************************************************************/
	/******************************** General UI Functionality ************************************/
	/**********************************************************************************************/
		

	// Initializes the UI Manager
	uimanager.prototype.initializeUIManger = function() {
		
		// Creates the overlays DOM and appends it to #player
		uiManagerData.element = $("<div>", {class:"overlays", id:"overlaysContainer"});
		uiManagerData.element.appendTo('#player');

		uiManagerData.status.is_full_screen = self.getFullScreenMode();
		$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', self.fullScreenEventHandler);

		self.initializeErrors(); // Initialize the errors module.
		self.initializeResumeFunctionality(); // Initialize resume point functionality.
		self.initializeEndCard(); // Initialize end card.
		self.initializeMenus(); // Initialize the menu manager.
		self.initializeMuteHandler(); // Initialize the mute functionality. 
	}


	// Initializes the mute functionality 
	uimanager.prototype.initializeMuteHandler = function() {
		uiManagerData.mutehandler = new mutehandler();
	}

	// Initializes the Menu Manager
	uimanager.prototype.initializeErrors = function() {
		errors.init(uiManagerData.element);
	}


	// Initializes the Resume Handler
	uimanager.prototype.initializeResumeFunctionality = function() {
		uiManagerData.resume.handler = new resumehandler(self.uiManagerCallback, uiManagerData.element);
	}


	// Initializes the Resume Handler
	uimanager.prototype.initializeEndCard = function() {
		uiManagerData.end_card.handler = new endcardhandler(self.uiManagerCallback, uiManagerData.element);
	}


	// Initializes the player title element
	uimanager.prototype.initializePlayerTitleElement = function() {
		if ($("#playerControlsTitle").length === 0) {
			var controlsTitle = $("<div>", {class:"controls_title", id:"playerControlsTitle"});

			controlsTitle.html(bbPlayer.config.data.programName);
			controlsTitle.appendTo(uiManagerData.element);

			uiManagerData.controls.title_object = controlsTitle;
			uiManagerData.controls.status.title_visible = true;

			$pdk.controller.addEventListener("OnShowControls", self.playerControlsVisibilityHandler);
		} else {
			$("#playerControlsTitle").html(bbPlayer.config.data.programName);
		}
	}


	// Initializes the Menu Manager
	uimanager.prototype.initializeMenus = function() {
		uiManagerData.menus.handler = new menumanager(self.uiManagerCallback, uiManagerData.element);
	}


	// Initializes the Menu Manager
	uimanager.prototype.uiErrorsCallback = function(event) {
		console.log("UI MANAGER CALLBACK: Event Target = "+event.target.id);
	}

	// This method listens for changes in the player controls visibility.
	uimanager.prototype.playerControlsVisibilityHandler = function(event) {
		if (event.data.visible) {
			self.showPlayerTitle(true);
		} else {
			self.showPlayerTitle(false);

			// Hides all active menus if there are any.
			if (uiManagerData.menus.handler) {
				uiManagerData.menus.handler.hideAllActiveMenus();
			}
		}
	}


	// Returns the current fullscreen mode
	uimanager.prototype.getFullScreenMode = function() {
		return (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen);
	}


	// This function passes the current fullscreen data on to its children
	uimanager.prototype.handleFullScreen = function(isFullscreen) {
		$(".player_bottom").css("bottom", ((isFullscreen) ? UI_PLAYER_BOTTOM_VALUES.player_bottom_full : UI_PLAYER_BOTTOM_VALUES.player_bottom_standard));

		if (isFullscreen) {
			// Title object handling
			$("#playerControlsTitle").addClass("controls_title_full");
			$("#playerControlsTitle").removeClass("controls_title");
		} else {
			// Title object handling
			$("#playerControlsTitle").addClass("controls_title");
			$("#playerControlsTitle").removeClass("controls_title_full");
		}

		// Inform the menu manager of the current fullscreen status
		uiManagerData.menus.handler.handleFullScreen(uiManagerData.status.is_full_screen);
	}


	// Accepts all layout change requests and handles the switching of the player controls layout accordingly.
	uimanager.prototype.updatePlayerLayout = function(dataObject) {
		var modifierString = "";
		var castString = "";

		// Set the modifier status variable based on the status sent
		if (dataObject.control === "modifier") {
			uiManagerData.controls.status.modifier = dataObject.status;
		}

		// Set the cast and casting status variables based on layout and status sent
		if (dataObject.control === "standard" && dataObject.status) {
			uiManagerData.controls.status.cast = false;
			uiManagerData.controls.status.casting = false;

			self.showBBOverlay(true); // Shows BB Overlay for normal layout
		} else if (dataObject.control === "cast" && dataObject.status) {
			uiManagerData.controls.status.cast = true;
			uiManagerData.controls.status.casting = false;
			
			self.showBBOverlay(true); // Shows BB Overlay for cast layout
		} else if (dataObject.control === "casting" && dataObject.status) {
			uiManagerData.controls.status.cast = false;
			uiManagerData.controls.status.casting = true;
			
			self.showBBOverlay(false); // Hides BB Overlay for casting layout
		}

		// Configures the modifier string based on modifier status variable.
		if (uiManagerData.controls.status.modifier) {
			modifierString = "_modifier";
		}

		// Configures the cast string based on cast and casting status variables.
		if (uiManagerData.controls.status.cast) {
			castString = "_cast";
		} else if (uiManagerData.controls.status.casting) {
			castString = "_casting";
		}

		// Switches to the appropriate layout using the URL modifier strings
		$pdk.controller.setPlayerLayoutUrl(bbPlayer.config.data.videoDomain+"/conf/layout/metaLayout_glass_lite_beachbody"+modifierString+castString+".xml");
	}


	// This function handles the fullscreen change event.
	uimanager.prototype.showBBOverlay = function(showOverlay) {
		$(".bb-overlay").css("opacity", ((showOverlay) ? "1.0" : "0.0"));
	}


	//** Reza was here - 06/13/2013 - I am so happy that you are across from me Doug! 


	// Shows or hides the player title based on the passed 
	uimanager.prototype.showPlayerTitle = function(showTitle) {
		
		// If the title object exists, go ahead and handle accordingly.
		if (uiManagerData.controls.title_object) {
			// If the player title is to show, do it now.
			if (showTitle) {
				// If the title is hidden, then show it now.
				if (!uiManagerData.controls.status.title_visible) {
					uiManagerData.controls.status.title_visible = true;
					uiManagerData.controls.title_object.fadeIn(200);
				}
			} else {
				// If the title is visible, then hide it now.
				if (uiManagerData.controls.status.title_visible) {
					uiManagerData.controls.status.title_visible = false;
					uiManagerData.controls.title_object.fadeOut(200);
				}
			}
		}
	}


	/**********************************************************************************************/
	/*************************************** Callbacks ********************************************/
	/**********************************************************************************************/


	// This function handles the fullscreen change event.
	uimanager.prototype.fullScreenEventHandler = function(event) {
		uiManagerData.status.is_full_screen = self.getFullScreenMode();

		// Now that the state has changed, inform ui manager children to handle accordingly.
		self.handleFullScreen(uiManagerData.status.is_full_screen);
	}


	// The UI Manager general callback function.
	uimanager.prototype.uiManagerCallback = function(dataObject) {
		
		// Chooses which type of callback request to process.
		switch (dataObject.type) {
			// Layout Changes
			case UI_TYPES.ui_controls :
				self.updatePlayerLayout(dataObject);
				break;
		}
	}


	return uimanager;
});


/**********************************************************************************************/
/************************************ Global Constants ****************************************/
/**********************************************************************************************/


// The UI Manager global callback proxy.
var uiManagerCallbackGlobal = null;

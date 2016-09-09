define(['jquery','errors','menumanager','resumehandler','endcardhandler','bboverlayhandler'], function($,errors,menumanager,resumehandler,endcardhandler,bboverlayhandler){
	var self = null;
	var uiManagerData = {
		module_designator:"module.uimanager",
		element: null,
		status:{is_full_screen:false},
		menus: {handler:null, status:{ready:false}},
		controls: {title_object:null, status:{modifier:false, cast:false, casting:false, title_visible:false}},
		resume: {handler:null, resume_clear:false},
		end_card: {handler:null},
		bboverlay: {handler:null}
	};


	// Constructor
	function uimanager() {
		self = this;

		console.log("[BB]["+uiManagerData.module_designator+"] Initializing...");

		uiManagerCallbackGlobal = self.uiManagerCallback;


		/*************************************** Listeners ****************************************/

		$pdk.controller.addEventListener("OnPlayerLoaded", self.initializeUIManger);
		$pdk.controller.addEventListener("OnMediaStart", self.onMediaStart);
		$pdk.controller.addEventListener("OnMediaEnd", self.onMediaEnd);
		
		if ($pdk.isChrome) {
			document.addEventListener("OnPlayerReadyBB", self.initializePlayerTitleElement); // Taps into a custom event that better coincides with the player controls appearing.
		} else {
			$pdk.controller.addEventListener("OnPlayerLoaded", self.initializePlayerTitleElement);
		}

		document.addEventListener("OnResumeClear", self.onResumeClear); // Taps into a custom event that indicates that the resume handling is clear.
		document.addEventListener("OnMenuActive", self.onMenuActive);
		document.addEventListener("OnMenuInactive", self.onMenuInactive);
		document.addEventListener("OnPostVideoBreakStart", self.onBreakStart);
    	document.addEventListener("OnPostVideoBreakEnd", self.onBreakEnd);
	}


	/**********************************************************************************************/
	/*********************************** Initialize Modules ***************************************/
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
		self.initializeBBOverlay(); // Initialize BB overlay.
		self.initializeEndCard(); // Initialize end card.
		self.initializeMenus(); // Initialize the menu manager.
	}


	// Initializes the Errors Module
	uimanager.prototype.initializeErrors = function() {
		errors.init(uiManagerData.element);
	}


	// Initializes the Resume Handler
	uimanager.prototype.initializeResumeFunctionality = function() {
		uiManagerData.resume.handler = new resumehandler(self.uiManagerCallback, uiManagerData.element);
	}


	// Initializes the End Card Handler
	uimanager.prototype.initializeEndCard = function() {
		uiManagerData.end_card.handler = new endcardhandler(self.uiManagerCallback, uiManagerData.element);
	}


	// Initializes the BB Overlay
	uimanager.prototype.initializeBBOverlay = function() {
		uiManagerData.bboverlay.handler = new bboverlayhandler(self.uiManagerCallback, uiManagerData.element);
	}

	
	// Initializes the Player Title Element
	uimanager.prototype.initializePlayerTitleElement = function() {
		// If the player controls title object isn't already initialized, do it now.
		if ($("#playerControlsTitle").length === 0) {
			var controlsTitle = $("<div>", {class:"controls_title", id:"playerControlsTitle"});
			
			controlsTitle.html(bbPlayer.config.data.programName);
			controlsTitle.appendTo(uiManagerData.element);

			uiManagerData.controls.title_object = controlsTitle;
			uiManagerData.controls.status.title_visible = true;

			$pdk.controller.addEventListener("OnShowControls", self.playerControlsVisibilityHandler);
		// If the player controls title object already exists, then update it now.
		} else {
			$("#playerControlsTitle").html(bbPlayer.config.data.programName);
		}
	}


	// Initializes the Menu Manager
	uimanager.prototype.initializeMenus = function() {
		uiManagerData.menus.handler = new menumanager(self.uiManagerCallback, uiManagerData.element);
	}


	/**********************************************************************************************/
	/******************************** General UI Functionality ************************************/
	/**********************************************************************************************/
		

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

			/*
			if ($pdk.isFirefox) {
				console.log("[BB] Attempting to put player in fullscreen");
				var titleObject = document.getElementById("player");
				self.putElementIntoFullscreen(titleObject);
			}
			*/
			
			// BB Overlay handling
			$(".bb-overlay").addClass("fullscreen");
		} else {
			// Title object handling
			$("#playerControlsTitle").addClass("controls_title");
			$("#playerControlsTitle").removeClass("controls_title_full");
			
			// BB Overlay handling
			$(".bb-overlay").removeClass("fullscreen");
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
		
		// Only allows the display state of the bb overlay to be updated if eligible.
		if (self.overlayEligible()) {
			uiManagerData.bboverlay.handler.hideOverlayFeature(!showOverlay);
		}
	}


	// Returns whether the overlay is eligible to be shown.
	uimanager.prototype.overlayEligible = function() {
		return (uiManagerData.resume.resume_clear);
	}


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


	uimanager.prototype.putElementIntoFullscreen = function(elementObject) {
		if (elementObject.requestFullscreen) {
		    console.log("[BB] Request Fullscreen STD");
		    elementObject.requestFullscreen();
		} else if (elementObject.mozRequestFullScreen) {
		    console.log("[BB] Request Fullscreen MOZ");
		    elementObject.mozRequestFullScreen();
		} else if (elementObject.webkitRequestFullScreen) {
		    console.log("[BB] Request Fullscreen WEB");
		    elementObject.webkitRequestFullScreen();
		} else if (elementObject.msRequestFullscreen) {
		    console.log("[BB] Request Fullscreen MS");
		    elementObject.msRequestFullscreen();
		}
	}


	//** Reza was here - 06/13/2013 - I am so happy that you are across from me Doug! 


	/**********************************************************************************************/
	/*************************************** Listeners ********************************************/
	/**********************************************************************************************/


	// This reacts to the resume clear custom event.
	uimanager.prototype.onResumeClear = function(event) {
		uiManagerData.resume.resume_clear = true;
		self.showBBOverlay(true);
	}


	// This reacts to the menu active custom event.
	uimanager.prototype.onMenuActive = function(event) {
		self.showBBOverlay(false);
	}


	// This reacts to the menu inactive custom event.
	uimanager.prototype.onMenuInactive = function(event) {
		self.showBBOverlay(true);
	}


	// This reacts to the break start custom event.
	uimanager.prototype.onBreakStart = function(event) {
		self.showBBOverlay(false);
	}


	// This reacts to the break end custom event.
	uimanager.prototype.onBreakEnd = function(event) {
		self.showBBOverlay(true);
	}


	// This reacts to the media start PDK event.
	uimanager.prototype.onMediaStart = function(event) {
		if (uiManagerData.resume.resume_clear) {
			self.showBBOverlay(true);
		}
	}


	// This reacts to the media end PDK event.
	uimanager.prototype.onMediaEnd = function(event) {
		self.showBBOverlay(false);
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


	// Handles calls back from the error handler.
	uimanager.prototype.uiErrorsCallback = function(event) {
		console.log("UI MANAGER CALLBACK: Event Target = "+event.target.id);
	}

	return uimanager;
});


/**********************************************************************************************/
/************************************ Global Variables ****************************************/
/**********************************************************************************************/


// The UI Manager global callback proxy.
var uiManagerCallbackGlobal = null;

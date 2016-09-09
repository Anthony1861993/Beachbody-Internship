define(['jquery','audiohandler','cchandler','modifierhandler','styleshandler'], function($,audiohandler,cchandler,modifierhandler,styleshandler){
	var self = null;
	var managerData = {
		module_designator:"module.menumanager",
		parent_callback:null,
		parent_element:null,
		menu_language: {properties:null, object:null, handlers:new Array(), status:{audio:false, cc:false, ready:false, interaction:false}, timeout:null},
		menu_modifier: {properties:null, object:null, handler:null, status:{ready:false}},
		menu_styles: {properties:null, object:null, handler:null, status:{ready:false}},
		activeMenu:null
	};

	var menuIntervalFade = 200;
	var menuShowTimeoutInterval = 7000;
	var bodyClickBlock = false;
	

	// Constructor
	function menumanager(parentCallback, parentElement){
		self = this;

		console.log("[BB]["+managerData.module_designator+"] Initializing...");

		managerData.parent_callback = parentCallback;
		managerData.parent_element = parentElement;
		
		menuManagerCallback = self.controlsCallback; //Associate the manager callback to the global menu manager callback.

		$('body').click(self.bodyClickHandler);

		self.languageMenuInit(); // Initialize the language menu
		self.modifierMenuInit(); // Initialize the modifier menu
		self.stylesHandlerInit(); //Initialize the styles handler
	}


	/**********************************************************************************************/
	/******************************** Specific Menu Handling **************************************/
	/**********************************************************************************************/
		

	// Initializes the language menu
	menumanager.prototype.languageMenuInit = function() {
		managerData.menu_language.object = $("<div>", {id: "languageMenuObject", class: "menu_container player_bottom player_right"});
		managerData.menu_language.object.hide();
		managerData.menu_language.object.appendTo(managerData.parent_element);

		managerData.menu_language.handlers[0] = new audiohandler(self.menuCallback, managerData.menu_language.object);
		managerData.menu_language.handlers[1] = new cchandler(self.menuCallback, managerData.menu_language.object);
	}


	// Handles all language menu events
	menumanager.prototype.languageMenuEventHandler = function(statusData, dataObject) {
		switch (statusData) {
			case UI_MODEL_STATES.state_init :
				//** USE as needed
				break;
			case UI_MODEL_STATES.state_ready :
				// If the callback indicates it's the audio menu, proceed accordingly.
				if (dataObject.module_designator === "module.audiohandler") {
					managerData.menu_language.status.audio = true;
					console.log("[BB]["+managerData.module_designator+"] Audio menu section is ready.");
				// If the callback indicates it's the CC menu, proceed accordingly.
				} else if (dataObject.module_designator === "module.cchandler") {
					managerData.menu_language.status.cc = true;
					console.log("[BB]["+managerData.module_designator+"] CC menu section is ready.");
				}

				// If at least the audio sub-menu is available, then the language menu is ready.
				if (managerData.menu_language.status.audio) {
					managerData.menu_language.status.ready = true;
				}
				break;
			case UI_MODEL_STATES.state_update :
				// If the callback indicates it's the audio menu, proceed accordingly.
				if (dataObject.module_designator === "module.audiohandler") {
					console.log("[BB]["+managerData.module_designator+"] Audio menu section updated.");
				// If the callback indicates it's the CC menu, proceed accordingly.
				} else if (dataObject.module_designator === "module.cchandler") {
					console.log("[BB]["+managerData.module_designator+"] CC menu section updated.");
				}
				break;
		}

		// If the language menu is ready, show the language menu once upon video start to make the user aware of its presence.
		if (managerData.menu_language.status.ready) {
			//** ADD Handling as needed upon language menu ready.
			console.log("[BB]["+managerData.module_designator+"] Language menu is ready.");
		}
	}


	// Initializes the modifier menu
	menumanager.prototype.modifierMenuInit = function() {
		managerData.menu_modifier.handler = new modifierhandler(self.menuCallback, managerData.parent_element);
	}


	// Handles all modifier menu events
	menumanager.prototype.modifierMenuEventHandler = function(statusData, dataObject) {
		switch (statusData) {
			case UI_MODEL_STATES.state_init :
				//** USE as needed
				break;
			case UI_MODEL_STATES.state_ready :
				managerData.menu_modifier.status.ready = true;

				// Call the UI manager so that it can update the player controls layout for modifier
				managerData.parent_callback({type:UI_TYPES.ui_controls, control:"modifier", status:true});
				console.log("[BB]["+managerData.module_designator+"] Modifier menu is ready.");
				break;
			case UI_MODEL_STATES.state_update :
				//** USE as needed
				break;
		}
	}


	// Initializes the subtitles styles menu handler.
	menumanager.prototype.stylesHandlerInit = function() {
		managerData.menu_styles = new styleshandler(self.menuCallback, managerData.parent_element);
	}


	// Handles all modifier menu events
	menumanager.prototype.stylesMenuEventHandler = function(statusData, dataObject) {
		
		switch (statusData) {
			case UI_MODEL_STATES.state_init :
				//** USE as needed
				break;
			case UI_MODEL_STATES.state_ready :
				//** USE as needed
				break;
			case UI_MODEL_STATES.state_update :
				//** USE as needed
				break;
		}
	}


	// Acts as a way to mandetorily close all active menus
	menumanager.prototype.hideAllActiveMenus = function() {
		
		// If an active menu exists, hide it now.
		if (managerData.activeMenu) {
			self.hideMenuObject(managerData.activeMenu);
		}
	}


	/**********************************************************************************************/
	/*************************************** Callbacks ********************************************/
	/**********************************************************************************************/


	// This callback captures all relevent click events on the player control rack
	menumanager.prototype.controlsCallback = function(dataObject) {
		// Delegates control functionality based on the passed menu id.
		switch(dataObject.id) {
			// Language Menu Control Click
			case UI_MENU_TYPES.menu_language :
				if (!managerData.activeMenu) {
					bodyClickBlock = true;
				}

				self.menuToggleHandler(managerData.menu_language);
				break;
			// Modifier Menu Control Click
			case UI_MENU_TYPES.menu_modifier :
				managerData.menu_modifier.handler.menuCallback();
				break;
		}
	}


	// The callback method for all menus.
	menumanager.prototype.menuCallback = function(statusData, dataObject){

		// If the menu callback is from a language menu element handle accordingly.
		if (dataObject.menu_designator === "menu.language") {
			self.languageMenuEventHandler(statusData, dataObject);
		// If the menu callback is from a modifier menu element handle accordingly.
		} else if (dataObject.menu_designator === "menu.modifier") {
			self.modifierMenuEventHandler(statusData, dataObject);
		} else if (dataObject.menu_designator === "menu.styles") {
			self.stylesMenuEventHandler(statusData, dataObject);
		}
	}


	/**********************************************************************************************/
	/********************************** General Menu Handling *************************************/
	/**********************************************************************************************/


	// Listens for all click events on the body and closes the active menu if the user clicks outside the menu.
	menumanager.prototype.bodyClickHandler = function(event) {
		var target = null;
		var targetParent = null;
		var targetPrefix = null;
		
		// The following logic is only important if there is an active menu.  Otherwise, we don't care what was clicked.
		if (managerData.activeMenu) {
			target = $(event.target);
			targetParent = (target.parent().parent().attr('id') != undefined) ? target.parent().parent().attr('id') : "undefined";
			targetPrefix = targetParent.substr(0, 5);

			// If the click doesn't occur on the active menu or on a player control, then hide the active menu now.
			if (managerData.activeMenu.object.attr('id') != targetParent && !bodyClickBlock) {
				self.hideMenuObject(managerData.activeMenu);
			} else {
				// If a bodyClickBlock is active, then a player control was clicked. Clear it now for reuse.
				if (bodyClickBlock) {
					bodyClickBlock = false;
				} else {
					// Interaction should only occur when the user clicks a menu item because here, we only care about inter-menu interaction. 
					if (!managerData.activeMenu.status.interaction) {
						managerData.activeMenu.status.interaction = true;
					}
				}
			}
		}
	}

	
	// Handles the toggling of the menu visibility
	menumanager.prototype.menuToggleHandler = function(menuObject) {
		
		// If the menu object is hidden, then show it now, otherwise, hide it.
		if ($(menuObject.object).is(":hidden")) {
			self.showMenuObject(menuObject);
		} else {
			self.hideMenuObject(menuObject);
		}
	}

	
	// Show the passed menu object with optional fade and hide intervals.
	menumanager.prototype.showMenuObject = function(menuObject, overrideInterval, hideInterval) {
		// If a specific interval is passed, use that, otherwise, use the default.
		var adjustedInterval = (overrideInterval) ? overrideInterval : menuIntervalFade;
		var adjustedHideInterval = (hideInterval) ? hideInterval : menuShowTimeoutInterval;

		// If there's already an active menu open, close it now.
		if (managerData.activeMenu) {
			self.hideMenuObject(managerData.activeMenu);
		}

		// If the styles manager is open, close it now.
		managerData.menu_styles.closeStylesMenu();

		// Set a new active menu and fade it in.
		managerData.activeMenu = menuObject;
		menuObject.object.fadeIn(adjustedInterval);

		self.setShowTimeoutWithInterval(menuObject, adjustedHideInterval);

		self.dispatchMenuActiveEvent();
	}

	
	// Hide the passed menu object with optional fade interval.
	menumanager.prototype.hideMenuObject = function(menuObject, overrideInterval) {
		
		// If a specific interval is passed, use that, otherwise, use the default.
		var adjustedInterval = (overrideInterval) ? overrideInterval : menuIntervalFade;
		
		//$(".IconAudio").removeClass("menu_control_selected");

		menuObject.object.fadeOut(adjustedInterval); // Fade out the active menu
		
		self.clearShowTimeout(menuObject); // Now that the menu is closed, reset the timeout for later use.

		// Reset the active object and the interaction statis variable.
		menuObject.status.interaction = false;
		managerData.activeMenu = null;

		self.dispatchMenuInactiveEvent();
	}

	
	// This function defines the auto-close functionality for the menu.
	menumanager.prototype.setShowTimeoutWithInterval = function(menuObject, timeoutInterval) {
		
		self.clearShowTimeout(menuObject); // Reset the timeout for reuse.

		menuObject.status.interaction = false; // Reset the status var for reuse.

		// Define the timeout
		menuObject.timeout = setTimeout(function(){
			// If the user hasn't interacted with the active menu during the interval, hide the menu now.
			if (!menuObject.status.interaction) {
				self.hideMenuObject(menuObject, menuIntervalFade);
			// If the user has interacted, extend the timeout for another round.
			} else {
				self.setShowTimeoutWithInterval(menuObject, menuShowTimeoutInterval);
			}
		}, timeoutInterval);
	}

	
	// Clears out the menu show timeout.
	menumanager.prototype.clearShowTimeout = function(menuObject) {
		
		if (menuObject.timeout) {
			clearTimeout(menuObject.timeout);
			menuObject.timeout = null;
		}
	}


	// Clears out the menu show timeout.
	menumanager.prototype.handleFullScreen = function(isFullscreen) {
		if (isFullscreen) {
			$(".menu_container").addClass("fullscreen");
			$(".in_player_text_indicator").addClass("fullscreen");
			$(".styles_window").addClass("fullscreen");
		} else {
			$(".menu_container").removeClass("fullscreen");
			$(".in_player_text_indicator").removeClass("fullscreen");
			$(".styles_window").removeClass("fullscreen");
		}
	}


	/**********************************************************************************************/
	/********************************** Custom Event Handling *************************************/
	/**********************************************************************************************/


	// Dispatches a custom event that marks when the user has interacted with the end card.
    menumanager.prototype.dispatchMenuActiveEvent = function(){
        var eventObject = self.defineCustomEventWithName("OnMenuActive");

        // Dispatch the custom event now that the event data has changed.
        document.dispatchEvent(eventObject);
    }


    // Dispatches a custom event that marks when the user has interacted with the end card.
    menumanager.prototype.dispatchMenuInactiveEvent = function(){
        var eventObject = self.defineCustomEventWithName("OnMenuInactive");

        // Dispatch the custom event now that the event data has changed.
        document.dispatchEvent(eventObject);
    }


    // Redefines the custom event object.
    menumanager.prototype.defineCustomEventWithName = function(eventName){
    	var eventObject = null;

        // Define the custom event here
        eventObject = new CustomEvent(
            eventName, 
            {
                detail: true,
                bubbles: true,
                cancelable: true
            }
        );

        return eventObject;
    }
	
	return menumanager;
});


/**********************************************************************************************/
/************************************* Global Methods *****************************************/
/**********************************************************************************************/


// The Menu Manager global callback proxy.
var menuManagerCallback = null;

// Global function defined to catch language menu click events.
var languageMenuHandler = function() {
	menuManagerCallback({id:UI_MENU_TYPES.menu_language});
}

// Global function defined to catch modifier menu click events.
var modifierMenuHandler = function() {
	menuManagerCallback({id:UI_MENU_TYPES.menu_modifier});
}

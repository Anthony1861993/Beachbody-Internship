define(['jquery','cookie'], function($,cookie){
	var self = null;
	var moduleData = {module_designator:"module.mutehandler"};

	var dummy = true;
	// For some reason, the "mute" event fires twice when the mute state is changed.
	// This dummy variable is used to prevent second run of muteHandler().  
	
	// Constructor
	function mutehandler() {
		self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");

		var adjustedIndex = cookie.getCookie("mute");	// Retrieve the mute cookie here

		adjustedIndex = (adjustedIndex) ? Number(adjustedIndex) : 1; // Check if the cookie exists first.

		// 1 = unmute (default), 2 = mute 
		if (Number(adjustedIndex) == 2) {
			$pdk.controller.mute(true);
			cookie.setCookie("mute", 2, INTERVAL_1_DAY_MS);		// Set cookie here.
		}

		// Creates a listener to handle "Mute/Unmute" event 
		$pdk.controller.addEventListener("OnMute", self.muteHandler);
	}

	// Handlers "Mute/Unmute" event everytime the user clicks "Mute" button. 
	mutehandler.prototype.muteHandler = function(e) {
		if (dummy) {	
			if (e.data) // if mute
				cookie.setCookie("mute", 2, INTERVAL_1_DAY_MS);		// Update cookie here.	
			else // if not mute 
				cookie.setCookie("mute", 1, INTERVAL_1_DAY_MS);		// Update cookie here.
		}
		dummy = !dummy;  
	}

	return mutehandler;
});
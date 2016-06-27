define(['jquery','menu','cookie'], function($,menu,cookie){
	var self = null;
	var parentData = {callback:null, element:null};
	var moduleData = {module_designator:"module.cchandler", menu_designator:"menu.language", type:"ccTracks", data:{menu_config:null, cc_tracks:null, current_track:1}, menu_handler:null, menu_object:null};

	// Constructor
	function cchandler(callback, element) {
		self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");

		parentData.callback = callback;
		parentData.element = element;

		// Creates a listener for onMediaBuffering to handle multiple audio tracks
		$pdk.controller.addEventListener("OnTextTracksAvailable", self.ccTrackHandler);

		parentData.callback(UI_MODEL_STATES.state_init, moduleData); //Pass model data upon init.
	}


	// Returns the model data.
	cchandler.prototype.getModelData = function(){
		return moduleData.data;
	}


	// Upon the appropriate player event, this method looks for audio tracks within the PDK's controller.
	cchandler.prototype.ccTrackHandler = function(event) {

		$pdk.controller.removeEventListener("OnTextTracksAvailable", self.ccTrackHandler);


		moduleData.data.cc_tracks = event.data.entries.slice();
		console.log("[BB]["+moduleData.module_designator+"] event.textTracks: ", moduleData.data.cc_tracks);

		if (moduleData.data.cc_tracks.length > 0) {

			// Process all of the CCTracks
			self.processCCTracks(moduleData.data.cc_tracks);
		} else {
			//** ATTN - Do nothing here at the moment. In this case, the language menu will only show audio tracks.
		}
	}

	// Upon the appropriate player event, this method looks for audio tracks within the PDK's controller.
	cchandler.prototype.processCCTracks = function(trackList) {
		var adjustedTrackList = new Array();

		adjustedTrackList[0] = {markup:"Subtitles", type:UI_MENU_ITEM_TYPES.menu_item_title};
		adjustedTrackList[1] = {markup:"Off", type:UI_MENU_ITEM_TYPES.menu_item_selectable};

		for (var i = 0; i < trackList.length; i++) {
			adjustedTrackList.push({markup:trackList[i].title, type:UI_MENU_ITEM_TYPES.menu_item_selectable, language:trackList[i].language});
		}

		moduleData.data.cc_tracks = adjustedTrackList;

		self.ccControlsHandler(moduleData.data.cc_tracks);
	}

	// Prepares the menu data for the manager
	cchandler.prototype.ccControlsHandler = function(trackArray) {
		var adjustedIndex = cookie.getCookie("subtitles"); // Retrieve the subtitles cookie here

		adjustedIndex = (adjustedIndex) ? Number(adjustedIndex) : 1; // Check if the cookie exists first.

		moduleData.data.menu_config = {id:moduleData.type, data:trackArray, callback:self.menuCallback, element:parentData.element};

		moduleData.menu_handler = new menu(moduleData.data.menu_config);
		moduleData.menu_object = moduleData.menu_handler.getMenuObject();

		self.menuItemSelectHandler(adjustedIndex);

		parentData.callback(UI_MODEL_STATES.state_ready, moduleData);
	}

	// This callback captures all click events on menu items.
	cchandler.prototype.menuCallback= function(e) {
		var menuIndex = Number(e.target.id.slice(-1));
		
		self.menuItemSelectHandler(menuIndex);
	}

	// Selects a menu item with the passed index.
	cchandler.prototype.menuItemSelectHandler = function(textTrackIndex) {
		moduleData.data.current_track = textTrackIndex;

		if (textTrackIndex > 0) {
			if (textTrackIndex === 1) {
				$pdk.controller.setShowSubtitles(false);
				$pdk.controller.setSubtitleLanguage("none");

				moduleData.menu_handler.selectMenuItemWithIndex(textTrackIndex, moduleData.type);

				cookie.setCookie("subtitles", textTrackIndex, INTERVAL_2_DAY_SEC); // Set cookie here.
			} else {
				if (moduleData.data.cc_tracks[textTrackIndex].type === UI_MENU_ITEM_TYPES.menu_item_selectable) {
					$pdk.controller.setShowSubtitles(true);
					$pdk.controller.setSubtitleLanguage(moduleData.data.cc_tracks[textTrackIndex].language);
					
					moduleData.menu_handler.selectMenuItemWithIndex(textTrackIndex, moduleData.type);

					cookie.setCookie("subtitles", textTrackIndex, INTERVAL_2_DAY_SEC); // Set cookie here.
				}
			}
		}
	}

	return cchandler;
});

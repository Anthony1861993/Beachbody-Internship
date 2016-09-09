define(['jquery'], function($){
	var self = null;
	var menuData = {module_designator:"module.menu", id:null, class_append:null, properties:null, callback:null, element:null, object:null};


	// Constructor
	function menu(dataObject) {
		self = this;

		//console.log("[BB]["+menuData.module_designator+"] Initializing...");

		// Breaking out each variable vs a straight replace of menuData with dataObject, protects the integrity of the expected object.
		menuData.id = dataObject.id;
		menuData.class_append = dataObject.class_append;
		menuData.properties = dataObject.data;
		menuData.callback = dataObject.callback;
		menuData.element = dataObject.element;
		menuData.object = this.setupMenuWithData(menuData.properties);
	}


	// Creates all of the UI needed to display a fully functional audio menu.
	menu.prototype.setupMenuWithData = function(dataObject) {
		var menuControlsMarkup = "";
		var menuObject = null;

		// Retrieves the menu item markup by passing the menu item array
		menuControlsMarkup = self.returnMenuItemMarkup(dataObject);
		
		// Creates the menu object and adds a click event to the menu as a whole.
		menuObject = $("<div>", {id: menuData.id+"Menu", class: "menu_object"});
		menuObject.html(menuControlsMarkup);
		menuObject.click(menuData.callback);
		menuObject.appendTo(menuData.element);

		return menuObject;
	}


	// Updates all of the menu items within a given menu object with the new data passed.
	menu.prototype.updateMenuWithData = function(existingObject, dataObject) {
		var menuControlsMarkup = "";

		// Removes all existing menu items
		self.removeAllMarkupWithinObject(existingObject);

		// Retrieves the new menu item markup, passing in the new menu item array.
		menuControlsMarkup = self.returnMenuItemMarkup(dataObject);

		// Writes the updated markup to the menu object.
		existingObject.html(menuControlsMarkup);
	}


	// Creates all of the UI needed to display a fully functional audio menu.
	menu.prototype.returnMenuItemMarkup = function(dataObject) {
		var menuControlsMarkup = "";

		// Cycles through each menu item in the array and defines markup based on the current data object.
		for (var i=0; i < dataObject.length; i++) {
			//console.log("[BB]["+menuData.module_designator+"] - ["+menuData.id+"] Menu Item["+i+"]");
			menuControlsMarkup += self.returnControlButtonWithIndex(i, dataObject[i]);
		}

		return menuControlsMarkup;
	}


	// Returns the markup for each button based on all of the data for each individual audio track.
	menu.prototype.returnControlButtonWithIndex = function(menuItemIndex, menuItem) {
		var menuItemMarkup = null;
		
		// Defines the markup for a single menu item.
		menuItemMarkup = "<div id='"+menuData.id+"MenuItem"+menuItemIndex+"' class='"+((menuItem.type)?menuItem.type:"menu_item")+" "+menuData.id+"'>"+menuItem.markup+"</div>";

		return menuItemMarkup;
	}


	// Updates the audio menu UI to show a new selected status based on the passed index.
	menu.prototype.selectMenuItemWithIndex = function(menuItemIndex, menuID) {
		
		//Update the selected dom based on the audio track index
		$("."+menuID).removeClass('selected');
		$("#"+menuID+"MenuItem"+menuItemIndex).addClass('selected');
	}


	// Returns the menu object element
	menu.prototype.getMenuObject = function() {
		return menuData.object;
	}


	// Removes all merkup within the supplied menu object
	menu.prototype.removeAllMarkupWithinObject = function(menuObject) {
		menuObject.html("");
	}

	return menu;
});

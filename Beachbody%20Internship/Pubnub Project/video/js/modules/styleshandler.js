define(['jquery','qs'], function($,qs){
	var self = null;
	var parentData = {callback:null, element:null};
	var moduleData = {module_designator:"module.styleshandler", menu_designator:"menu.styles", menu_object:null};

	var cuepoint = null;
	var styleSettings = {
							globalDataType: "com.theplatform.pdk.data::SubtitleStyle",
							fontFamily: "Arial Black",
							fontSize: 1.0,
							fontColor: "#FFFFFF",
							fontEdge: "DropShadow",
			                fontEdgeColor: "#000000",
							backgroundColor: "#333333",
							opacity: 1.0,
							bold: false,
							italic: false,
							underline: false,
							textAlign: "center",
							textAlignVertical: "bottom",
							backgroundOpacity: 0
						};

	var swatchColors = 	[
							"#FF0000",
							"#FFCC00",
							"#FFFF00",
							"#FFFFFF",
							"#666666",
							"#000000",
							"#00FF00",
							"#00FFFF",
							"#0000FF"
						];

	var fontFamilies = 	[
							"Arial",
							"Arial Black",
							"Courier New",
							"Georgia",
							"Impact",
							"Lucida Sans Unicode",
							"Palatino",
							"Tahoma",
							"Times New Roman"
						];

	var fontSizes = 	[
							{caption:"Smallest", value:0.5},
							{caption:"Small", value:0.75},
							{caption:"Normal", value:1.0},
							{caption:"Large", value:1.25},
							{caption:"Largest", value:1.5}
						];


	// Constructor
	function styleshandler(callback, element) {
		self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");

		// Store the parent callback and element for later use.
		parentData.callback = callback;
		parentData.element = element;

		openStylesMenuGlobal = self.openStylesMenu;
		
		self.initializeStylesHandler();
	}


	/**********************************************************************************************/
	/************************************** Styles Handling ***************************************/
	/**********************************************************************************************/
	

	// Upon the appropriate player event, this method looks for audio tracks within the HTML5 video tag's data.
	styleshandler.prototype.initializeStylesHandler = function() {
		$pdk.controller.addEventListener("OnGetSubtitleStyle", self.retrieveSubtitleStyle);
		//$pdk.controller.addEventListener("OnSubtitleCuePoint", self.updateCuePoint); //** NOTE - Not currently used, forward thinking.
		$pdk.controller.getSubtitleStyle();
	}


	// Retrieves the current subtitles style object if it exists.
	styleshandler.prototype.retrieveSubtitleStyle = function(event) {
		
		// If the style data returned is not null then store it.
		if (event.data) {
			styleSettings = event.data;
		}

		self.initializeStylesMenu();
	}


	// Updates the cue point object **NOTE** Not currently used, may be used in the future.
	styleshandler.prototype.updateCuePoint = function(event) {
		cuepoint = event;
	}


	// Initializes the styles menu object.
	styleshandler.prototype.initializeStylesMenu = function() {

		// Only initialize if the styles window hasn't yet been established.
		if ($("#stylesWindow").length === 0) {
			
			// MAIN WINDOW CONTAINER
			var stylesWindow = $("<div>", {id: "stylesWindow", class: "styles_window player_bottom player_right"});
			stylesWindow.appendTo(parentData.element);
			stylesWindow.hide();
			moduleData.menu_object = stylesWindow;


			// MAIN WINDOW ELEMENTS
			var stylesMainTitle = $("<div>", {id: "stylesMainTitle", class: "styles_main_title"});
			stylesMainTitle.html("Subtitle Options");
			stylesMainTitle.appendTo(stylesWindow);
			
			var stylesCloseButton = $("<div>", {id: "stylesClose", class: "styles_close_button"});
			stylesCloseButton.on("click.stylesClose", self.closeClickHandler);
			stylesCloseButton.appendTo(stylesWindow);


			// TEXT PROPERTIES CONTAINER
			var stylesTextOptionsObject = $("<div>", {id: "stylesTextOptionsObject", class: "styles_container"});
			stylesTextOptionsObject.appendTo(stylesWindow);


			// FONT SIZE
			var fontSizeSelectTitle = $("<div>", {id: "fontSizesTitle", class: "styles_title"});
			fontSizeSelectTitle.html("Font Size:");
			fontSizeSelectTitle.appendTo(stylesTextOptionsObject);

			var fontSizeSelect = $("<select>", {id: "fontSizes", class: "styles_select", name: "fontSizes"});
			fontSizeSelect.html(self.getOptionsWithArray(fontSizes,true));
			fontSizeSelect.change(self.fontSizeChange);
			fontSizeSelect.appendTo(stylesTextOptionsObject);


			// BOLD CHECK
			var boldCheckTitle = $("<div>", {id: "boldCheckTitle", class: "styles_check_title"});
			boldCheckTitle.html("   Bold Text");
			boldCheckTitle.appendTo(stylesTextOptionsObject);

			var boldCheck = $("<input>", {id: "boldCheck", class: "styles_check", name: "boldCheck", type: "checkbox", value: "bold", checked:(styleSettings.bold)});
			boldCheck.change(self.fontBoldChange);
			boldCheck.prependTo(boldCheckTitle);


			// TEXT COLOR
			var stylesColorTextObject = $("<div>", {id: "stylesColorTextObject", class: "styles_container"});
			stylesColorTextObject.appendTo(stylesWindow);

			var stylesColorTextTitle = $("<div>", {id: "stylesColorTextTitle", class: "styles_title"});
			stylesColorTextTitle.html("Text Color:");
			stylesColorTextTitle.appendTo(stylesColorTextObject);		

			var stylesColorTextContainer = self.returnColorMenuWithName("ColorText");
			stylesColorTextContainer.appendTo(stylesColorTextObject);
		}
	}


	// Responds to change events on the font families select component.
	styleshandler.prototype.fontFamiliesChange = function(event) {
		//console.log("[BB] Font Families Changed "+$(this).val());

		styleSettings.fontFamily = $(this).val();
		self.updateStyles();
	}


	// Responds to change events on the font size select component.
	styleshandler.prototype.fontSizeChange = function(event) {		
		//console.log("[BB] Font Size Changed "+$(this).val());

		styleSettings.fontSize = Number($(this).val());
		self.updateStyles();
	}


	// Responds to change events on the font bold check.
	styleshandler.prototype.fontBoldChange = function(event) {
		//console.log("[BB] Font Bold Changed "+this.checked);

		styleSettings.bold = this.checked;
		self.updateStyles();
	}


	// Responds to change events on the font italic check.
	styleshandler.prototype.fontItalicChange = function(event) {
		//console.log("[BB] Font Bold Changed "+this.checked);

		styleSettings.italic = this.checked;
		self.updateStyles();
	}


	// Responds to change events on the font underline check.
	styleshandler.prototype.fontUnderlineChange = function(event) {
		//console.log("[BB] Font Bold Changed "+this.checked);

		styleSettings.underline = this.checked;
		self.updateStyles();
	}


	// Returns an options component using the passed array to guid the creation of the object.
	styleshandler.prototype.getOptionsWithArray = function(optionsArray, areObjects) {
		var optionsMarkup = "";

		for (var i=0; i<optionsArray.length; i++) {
			if (areObjects) {
				optionsMarkup += "<option value='"+optionsArray[i].value+"' "+((styleSettings.fontSize === optionsArray[i].value)?"selected":"")+">"+optionsArray[i].caption+"</option>";
			} else {
				optionsMarkup += "<option value='"+optionsArray[i].toLowerCase()+"' "+((styleSettings.fontFamily === optionsArray[i])?"selected":"")+">"+optionsArray[i]+"</option>";
			}

		}

		return optionsMarkup;
	}


	// Returns a fully configured color swatch menu.
	styleshandler.prototype.returnColorMenuWithName = function(nameValue) {
		var containerObject = $("<div>", {id: "styles"+nameValue+"Container", class: "styles_container_swatch"});
		
		for (var i=0; i<swatchColors.length; i++) {
			var colorSwatch = $("<div>", {id:nameValue+"Text"+i, class: "styles_color_swatch"+((styleSettings.fontColor === swatchColors[i]) ? " swatch_selected":""), style:"background-color:"+swatchColors[i]+";"});
			colorSwatch.on("click.styles"+nameValue+"Swatch", self.swatchClickHandler);
			colorSwatch.appendTo(containerObject);
		}

		return containerObject;
	}


	// This method responds to click events on the close button within the menu.
	styleshandler.prototype.closeClickHandler = function(event) {
		self.closeStylesMenu();
	}


	// This method is configured to specifically close the styles menu.
	styleshandler.prototype.closeStylesMenu = function() {
		self.showStylesMenu(false);
	}


	// This method is configured to specifically open the styles menu.
	styleshandler.prototype.openStylesMenu = function() {
		self.showStylesMenu(true);
	}


	// Controls the visibility of the styles menu.
	styleshandler.prototype.showStylesMenu = function(showMenu, overrideInterval) {
		var fadeInterval = (overrideInterval) ? overrideInterval : 200;

		if (moduleData.menu_object){
			if (showMenu) {
				//moduleData.menu_object.show();
				moduleData.menu_object.fadeIn(fadeInterval);
			} else {
				//moduleData.menu_object.hide();
				moduleData.menu_object.fadeOut(fadeInterval);
			}
		}
	}


	// Responds to click on the color swatch squares.
	styleshandler.prototype.swatchClickHandler = function(event) {
		var swatchIndex = Number(event.target.id.slice(-1));

		// If the new swatch color is not the same as the existing swatch color, then update it now.
		if (styleSettings.fontColor != swatchColors[swatchIndex]) {
			
			// Update the selected swatch.
			$(".styles_color_swatch").removeClass("swatch_selected");
			$(event.target).addClass("swatch_selected");

			// Update the font color within the style settings
			styleSettings.fontColor = swatchColors[swatchIndex];

			// Update the PDK's font styles with out local styles.
			self.updateStyles();
		}
	}


	// The collect all method used to configure an update to the styles object and PDK.
	styleshandler.prototype.updateStyles = function() {
		// Hide the styles menu now and it will return after the PDK is updated.
		self.showStylesMenu(false, 1);

		// A timeout is set to seperate user interaction from PDK functionality.
		setTimeout(function(){
			self.updatePDKStyles();
		}, 1);
	}


	// While setting the PDK's style properties, it causes the menu close to fail. Seperate the PDK style update into its own method.
	styleshandler.prototype.updatePDKStyles = function() {
		$pdk.controller.setSubtitleStyle(styleSettings);
		
		// Now that the PDK is updated, bring the menu back.
		self.showStylesMenu(true, 1);

		//** NOTE - Not currently used, forward thinking.
		// This is supposed to update the view by throwing the last cuepoint with updated styles...
		/*if (cuepoint) {
			cuepoint.data.style = styleSettings;
			$pdk.controller.dispatchEvent(cuepoint);
		}*/
	}

	return styleshandler;
});


/**********************************************************************************************/
/************************************ Global Variables ****************************************/
/**********************************************************************************************/


var openStylesMenuGlobal = null;

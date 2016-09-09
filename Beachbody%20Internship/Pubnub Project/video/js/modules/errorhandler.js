define(['jquery'], function($){
	var self = null;
	var parentData = {element:null};
	var moduleData = {module_designator:"module.errorhandler", error_array:new Array(), active_error:null};
	var errorHideTimeout = null;
	var errorFadeInterval = 100;

	var methods = {
		// Initializes the error window markup.
		init: function(parentElement) {
			var errorBackground;
			var errorWindow;
			var errorWindowHeader;
			var errorWindowMessage;
			var errorButtonContainer;
			var errorButtonOne;
			var errorButtonTwo;


			// Associate some key variables to their new values.
			self = this;

			// Store the parent element for later use.
			parentData.element = parentElement;

			// Expose this module's callback method to the global callback method.
			reportPlaybackError = self.reportErrorToDisplay;

			console.log("[BB]["+moduleData.module_designator+"] Initializing...");


			// Creates the error window and all sub-components within the window.
			errorBackground = $("<div>", {id: "errorWindow", class: "window_darken"});
			errorBackground.appendTo(parentData.element);

			errorWindow = $("<div>", {id: "errorWindowObject", class: "error_window"});
			errorWindow.appendTo(errorBackground);

			errorWindowHeader = $("<div>", {id: "errorWindowHeader", class: "error_window_header"});
			errorWindowHeader.html(""); // Will contain text
			errorWindowHeader.appendTo(errorWindow);

			errorWindowMessage = $("<div>", {id: "errorWindowMessage", class: "error_window_message"});
			errorWindowMessage.html(""); // Will contain text
			errorWindowMessage.appendTo(errorWindow);

			errorButtonContainer = $("<div>", {id: "errorButtonContainer", class: "error_button_container"});
			errorButtonContainer.appendTo(errorWindow);


			// Initially hide the error window
			self.showErrorWindow(false, 0);
		},

		// Reports an error to the array and if there aren't any active errors, it immediately displays it.
		reportErrorToDisplay: function(errorCode, errorMessage, errorCallback, buttonData) {
			// NOTE Button Data is expected in this format:
			// [ {button_name:"errorButton1", button_text:"OK"}, {button_name:"errorButton2", button_text:"Cancel"} ];

			// Adds the error to the error array.
			moduleData.error_array.push( {error_code:errorCode, error_message:errorMessage, error_callback:errorCallback, button_data:buttonData} );

			// If there are no active error messages, display it now.
			if (!moduleData.active_error) {
				self.displayError();
			}
		},

		// Displays the oldest error in the error array
		displayError: function() {
			var adjustedIndex = 0;

			// Splices the next error object off of the array, defining the active error object
			moduleData.active_error = moduleData.error_array.splice(0, 1)[0];
			
			// Populates the header and message elements with the resepctive data.
			self.setErrorHeader(moduleData.active_error.error_code);
			self.setErrorMessage(moduleData.active_error.error_message);

			// If the caller passed button data specifying
			if (moduleData.active_error.button_data) {
				
				// Iterates through the array in reverse so that the buttons specified in the array always appear in the order specified.
				for (var i=moduleData.active_error.button_data.length; i > 0; i--) {
					adjustedIndex = i - 1;
					moduleData.active_error.button_data[adjustedIndex].button_name = "errorButton"+i;
					self.createErrorButton(moduleData.active_error.button_data[adjustedIndex].button_name, moduleData.active_error.button_data[adjustedIndex].button_text);
				}
			} else {
				moduleData.active_error.button_data = new Array();
				moduleData.active_error.button_data.push({button_name:"errorButton1", button_text:"OK"});
				self.createErrorButton(moduleData.active_error.button_data[0].button_name, moduleData.active_error.button_data[0].button_text);
			}

			self.showErrorWindow(true, errorFadeInterval);
		},

		// This method doest the job of showing and hiding the actual error window.  When it hides the window, the reset method is called.
		showErrorWindow: function(showWindow, fadeInterval) {
			if (showWindow) {
				$("#errorWindow").fadeIn(fadeInterval);
			} else {
				$("#errorWindow").fadeOut(fadeInterval);
				
				//If there is an active error, reset the error window now.
				if (moduleData.active_error){
					self.setResetTimeout(fadeInterval);
				}
			}
		},

		// Creates a new error window button, adds it to the window and binds it to the error handler listener for use.
		createErrorButton: function(buttonName, buttonText) {
			var errorButton = $("<div>", {id: buttonName, class: "error_button"});
			errorButton.html(buttonText);
			errorButton.on("click.errorButton", self.errorCallback);
			errorButton.appendTo( "#errorButtonContainer" );
		},

		// Unbinds the button click event using the name passed as a parameter.
		destroyErrorButton: function(buttonName) {
			$(buttonName).off("click.errorButton", self.errorCallback)
		},

		// Unbinds all current error buttons and clears out the button divs.
		resetAllErrorButtons: function(buttonData) {
			if (buttonData) {
				for (var i=0; i < buttonData.length; i++) {
					self.destroyErrorButton(buttonData[i].button_name);
				}
			}
			
			// Clears all button divs out of the button container.
			$("#errorButtonContainer").html("");
		},

		// Sets the reset timeout to reset the error window.
		setResetTimeout: function(timeoutInterval) {
			setTimeout(function(){
				self.resetErrorWindow(moduleData.active_error);
			}, timeoutInterval);
		},

		// Resets the error window for another use.
		resetErrorWindow: function(errorData) {
			
			// If there is no error data being passed, then the error window hasn't been used yet.  Don't reset anything.
			if (errorData) {
				self.resetAllErrorButtons(errorData.button_data);

				self.setErrorHeader("");
				self.setErrorMessage("");

				moduleData.active_error = null;
			}

			// If there are more errors to display, display the next one.
			if (moduleData.error_array.length > 0) {
				self.displayError();
			}
		},

		// Updates the error header text.
		setErrorHeader: function(headerText) {
			$("#errorWindowHeader").html(headerText);
		},

		// Updates the error message text.
		setErrorMessage: function(messageText) {
			$("#errorWindowMessage").html(messageText);
		},

		// This is the error handler general call back used to forward events to any callbacks specified upon error report.
		errorCallback: function(event) {
			
			// If the caller of this error included a callback, forward the event now.
			if (moduleData.active_error.error_callback) {
				moduleData.active_error.error_callback(event);
			}

			// Regardless of whether the button produces action or not, close the error upon user interaction.
			self.showErrorWindow(false, errorFadeInterval);
		}
	}

	return methods;
});


/**********************************************************************************************/
/******************************** Global Methods/Constants ************************************/
/**********************************************************************************************/


// Global callback for the error module
var reportPlaybackError = null;

define(['jquery'], function($){
	var self = null;
	var parentData = {callback:null, element:null};
	var moduleData = {module_designator:"module.endcardhandler", type:"endCard", end_card_object:null, countdown_interval:8000, next_video:null};
	var countdownInterval = null;


	// Constructor
	function endcardhandler(callback, element) {
		self = this;

		console.log("[BB]["+moduleData.module_designator+"] Initializing...");

		parentData.callback = callback;
		parentData.element = element;

		// Subscribe to the playlist handler's custom start / end breack events.
		document.addEventListener("OnPostVideoBreakStart", self.postVideoBreakStatusHandler);
    	document.addEventListener("OnPostVideoBreakEnd", self.postVideoBreakStatusHandler);

		self.initializeEndCard();
	}


	// Initializes the end card elements.
	endcardhandler.prototype.initializeEndCard = function(event) {
		var endCard = $("<div>", {class:"end_card", id:"endCard"});
		endCard.hide(); // Initially hide the end card, it will be shown when needed.
		endCard.appendTo(parentData.element);

		// Store the end card object within the module's data object.
		moduleData.end_card_object = endCard;

		// Create all of the elements needed for the end card below.
		var endCardCounterInfoContainer = $("<div>", {class:"end_card_info_container", id:"endCardInfoContainer"});
		endCardCounterInfoContainer.appendTo(endCard);

		var endCardText = $("<div>", {class:"end_card_text", id:"endCardText"});
		endCardText.appendTo(endCardCounterInfoContainer);

		var endCardButton = $("<div>", {class:"end_card_button", id:"endCardButton"});
		endCardButton.html("Play Now");
		endCardButton.bind("click.endCardButton", self.skipToNextVideo);
		endCardButton.appendTo(endCardCounterInfoContainer);

		var endCardCounter = $("<div>", {class:"end_card_timer", id:"endCardTimer"});
		endCardCounter.appendTo(endCardCounterInfoContainer);

		// FOR TESTING / TWEAKING ONLY
		//setTimeout(function() {self.showEndCard(true);},1000);
	}


	// Updates the end card program name only with the newly passed program name.
	endcardhandler.prototype.updateEndCardProgram = function(programName){
		$("#endCardText").html("<span class='end_card_text_title'>Playing Next</span><br/>"+programName);
	}	


	// Shows or hides the end card based on the passed boolean and also accepts an override fade interval
	endcardhandler.prototype.showEndCard = function(showCard, overrideInterval){
		var adjustedInterval = (overrideInterval) ? overrideInterval : 300;

		if (showCard) {
			self.updateEndCardProgram(moduleData.next_video);
			self.updateCountdownWithValue(moduleData.countdown_interval/1000);

			$("#endCard").addClass("end_card_background_animate");
			$("#endCard").fadeIn(adjustedInterval);
		} else {
			$("#endCard").fadeOut(adjustedInterval);
			setTimeout(function(){ 
				$("#endCard").removeClass("end_card_background_animate");
				self.resetCountdown();
			}, adjustedInterval);
		}

		self.startCountdown();
	}


	// Starts the countdown timer.
	endcardhandler.prototype.startCountdown = function(){
		if(!countdownInterval) {
			countdownInterval = setInterval(function(){
				moduleData.countdown_interval -= 1000;
				self.updateCountdownWithValue(moduleData.countdown_interval/1000);
			}, 1000);
		}
	}


	// Updates the counter element with new value.
	endcardhandler.prototype.updateCountdownWithValue = function(newValue){
		$("#endCardTimer").html(newValue);
	}


	// Resets the countdown for new use.
	endcardhandler.prototype.resetCountdown = function(){
		clearInterval(countdownInterval);
		countdownInterval = null;
	}


	// Dispatches the user interaction event.
	endcardhandler.prototype.skipToNextVideo = function(){
		self.dispatchUserInteractionEvent();
	}


	/**********************************************************************************************/
	/********************************** Custom Event Handling *************************************/
	/**********************************************************************************************/


	// Dispatches a custom event that marks when the user has interacted with the end card.
    endcardhandler.prototype.dispatchUserInteractionEvent = function(){
        var eventObject = self.definePlayerReadyEvent();

        // Dispatch the custom event now that the event data has changed.
        document.dispatchEvent(eventObject);
    }


    // Redefines the custom event object.
    endcardhandler.prototype.definePlayerReadyEvent = function(){
    	var eventObject = null;

        // Define the custom event here
        eventObject = new CustomEvent(
            "OnViewerClickEndCard", 
            {
                detail: true,
                bubbles: true,
                cancelable: true
            }
        );

        return eventObject;
    }


    /**********************************************************************************************/
	/**************************************** Listeners *******************************************/
	/**********************************************************************************************/


	// Listens for custom start / end events dispatched from the playlist handler module.
    endcardhandler.prototype.postVideoBreakStatusHandler = function(event){
		console.log("[BB] Post Video Break Status = ",event.detail);

		if (event.detail.break_status) {
			moduleData.next_video = event.detail.break_title;
			moduleData.countdown_interval = event.detail.break_interval;
		}

		self.showEndCard(event.detail.break_status);
	}

	return endcardhandler;
});

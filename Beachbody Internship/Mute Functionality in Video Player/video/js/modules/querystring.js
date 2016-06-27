define(['jquery'], function($){
	var self = null;
	var methods = {
		//Makes an attempt to return a query string that can be appended to the releaseURL.  If no values
		//are found, it will return a blank string.
		getCxenseQueryString: function(){
			var startTime = this.getQueryVariableByKey("start");
			var endTime = this.getQueryVariableByKey("end");
			var playbackMode = this.getQueryVariableByKey("mode");
			var cxenseQueryString = "";

			//If the playback mode if either null or 0, then playback mode should be handled as a clip
			if (!playbackMode || playbackMode === "0") {
				//If there's a vlue for startTime and it's a positive number, then proceed with defining a start time.
				if (startTime && startTime > "0") {
					bbPlayer.config.data.bbStartTime = Number(startTime); //Append a start time to the bbConfig object for later use.
				}
			//If the playback mode is defined as 1, then playback mode should be handled as a start point in a full workout.
			} else if (playbackMode === "1") {
				//If there's a vlue for startTime and it's a positive number, append it now
				if (startTime && startTime > "0") {
				    cxenseQueryString += "&start=" + startTime + "ms";
				}

				//If there's a value for endTime
				if (endTime) {
						//If there's an endTime but no startTime, append 1ms for video start
				    if (cxenseQueryString === "") {
				    	startTime = "1";
				    	cxenseQueryString += "&start=" + startTime + "ms";
				    }
				    
				    //If endTime is greater than startTime, append it now
				    if (endTime > startTime) {
				    	cxenseQueryString += "&end=" + endTime + "ms";
				    }
				}
			}
			
			return cxenseQueryString;
		},
		//Attempts to return the value of the provided key from the query string.  This method returns false if not found.
		getQueryVariableByKey: function (keyName) {
			var queryString = window.location.search.substring(1); //Prepares query string for split
		    var queryPairs = queryString.split("&"); //Creates an array of all key/value pairs
		       
		    //Iterates through each key/value pair
		    for (var i = 0; i < queryPairs.length; i++) {
		         var currentPair = queryPairs[i].split("="); //Creates an array with key and value
		               
		         //Checks if the current pair key matches the main key name AND has value
		         if (currentPair[0] == keyName && currentPair[1]) {
		              return currentPair[1];
		         }
		    }
		       
		    return false; //If no match is found, return false
		},
	}

	return methods;
})
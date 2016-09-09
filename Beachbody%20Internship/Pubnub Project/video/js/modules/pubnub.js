define(['jquery', 'pubnubLib'], function($, pubnubLib){
	var self = null;
	var methods = {
		
		// Sends a message to a Pubnub channel. [expects: setPubnub('channel_name', message)];
		setPubnub: function(pubnubChannel, message) {

			var pubnub = new pubnubLib({
                publishKey: 'pub-c-806c421e-8b39-48a1-b3c7-e92a4ece249d',
                subscribeKey: 'sub-c-0b0a8f74-49f6-11e6-85a4-0619f8945a4f'
            })

			// creates a JSON message 
			var theMessage = [
			{vidGuid: pubnubChannel.split("|")[0], userGuid: pubnubChannel.split("|")[1]},
			{date: new Date()},
			{timecode: message}
			]; 
			// publishes the JSON message to the pubnub channel. 
			pubnub.publish(
				{
					channel: pubnubChannel,
					message: theMessage
				},
				function (status, response) {
					if (status.error)
						console.log(status);
				}
			)

		},


		// Gets the latest message from the history of a channel, [expects: this.getPubnub('channel_name');];
		getPubnub: function(pubnubChannel, callbackMethod) {

			var pubnub = new pubnubLib({
                subscribeKey: 'sub-c-0b0a8f74-49f6-11e6-85a4-0619f8945a4f'
            })
			
            pubnub.history(
            	{
                	channel : pubnubChannel,
                	count: 1,
                	reverse: false
            	},
            	function (status, response) {
            		if (status.error) {
            			console.log(status);
            			callbackMethod(-1);
            		}
            		else {
            			//console.log('[BB]:', response);
            			var returnData = (response.messages[0]? response.messages[0].entry[2].timecode : null);
            			callbackMethod(returnData);
            		}
            	}
            )

		},


		deletePubnub: function(pubnubChannel) {
  			// At the moment, "Clear history" functionality is not availabe in Pubnub
  			// (at least not until November 2016), but chances are we might not even
  			// need it. But I still leave it here in case we need it in the future.
		}
	}

	return methods;
});
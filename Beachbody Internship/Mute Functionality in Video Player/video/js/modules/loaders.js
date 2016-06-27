define(['jquery', 'json!../conf/json/default-app.json'], function($,appconfig){

	var methods = {
		getMPXPlayer: function(callback){
			$.getJSON("//player.theplatform.com/p/"+bbPlayer.config.data.mpxAccount+"/"+bbPlayer.config.data.mpxPlayerID+"/config?form=json", function(data){
				//pdk depend on styles before loading
				callback({type:'player', data:data});
			}).fail(function(e){
				callback({type:'player', data:null});
				console.log("[BB - FAIL] json load");
			});	
		},
		getAppJson: function(callback){
			$.getJSON( ""+bbPlayer.config.data.videoDomain+"/conf/json/default-app.json", function(data){
				//pdk depend on styles before loading
				callback({type:'json', data:data});
			}).fail(function(e){
				callback({type:'json',data:null});
				console.log("[BB - FAIL] json load");
			});
		},
		getMPXRelease: function(callback){
			$.getJSON("//feed.theplatform.com/f/"+bbPlayer.config.data.mpxAccount+"/B0Xsr4HI9Tzx?byGuid="+bbPlayer.config.data.mpxReferenceID+"&fields=media:content&form=json", function(data){
				//pdk depend on styles before loading
				callback({type:'release', data:data.entries[0].media$content[0].plfile$url});
			}).fail(function(e){
				callback({type:'release', data:null});
				console.log("[BB - FAIL] release load");
			});
		}
	}
	return methods;
})

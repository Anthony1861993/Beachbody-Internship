requirejs.config({
//	baseUrl: '//player-dev1.api.beachbodyondemand.com/js',
	baseUrl: '/js',
	paths: {
		pinterface: 		'modules/playerinterface',
		teaobj: 			'modules/configs/tealium',
		tealium: 			'//tags.tiqcdn.com/utag/beachbody/bod-dom/qa/utag',
		castPlayer: 		'plugins/CastPlayer',
		castWrapper: 		'plugins/CastWrapper',
		constants:  		'modules/constants',
		jquery: 			'libs/jquery-1.11.3.min',
		jcookie: 			'libs/jquery.cookie',
		chromecast: 		'//www.gstatic.com/cv/js/sender/v1/cast_sender',
		pdk: 				'//staticclub.teambeachbody.com/players/pdk/5.6.16/tpPdk',
		errors: 			'modules/errorhandler',
		cookie: 			'modules/cookie',
		qs: 				'modules/querystring',
		underscore: 		'libs/underscore-min',
		uimanager: 			'modules/uimanager',
		menumanager: 		'modules/menumanager',
		audiohandler: 		'modules/audiohandler',
		cchandler: 			'modules/cchandler',
		modifierhandler: 	'modules/modifierhandler',
		/*styleshandler: 	'modules/styleshandler',
		resumehandler: 		'modules/resumehandler',
		debug: 				'modules/debug',*/
		menu: 				'modules/menu',
		player: 			'modules/player',
		loaders: 			'modules/loaders',
		cast: 				'modules/cast',
		disclaimer: 		'modules/disclaimer'
	},
	shim:{
		/*'debug': {
			init: function() {
				debug.init();
			}
		},*/
		'tealium':['teaobj'],
		'jcookie': {
			deps:['jquery']
		},
		'pdk' : {
			deps: ['debug','jcookie'],
			exports: "$pdk"
		},
		'castWrapper': ['castPlayer','pdk'],
		'chromecast': ['castWrapper'],
		'player':['chromecast']
	}
});

require(["player","pinterface","loaders","constants",'uimanager'], function(player,pinterface,loaders,constants,uimanager){
	//set global player object
	window.bbPlayer	= pinterface;
	
	var boilerPlateVariables = function(response){
		//create objects
		bbPlayer["config"] = {};
		bbPlayer["config"]["data"] = {};
		environmentVariables = response.data["env-maps"][document.domain];
		//Conviva ID
		bbPlayer.config.data.convivaID 			= environmentVariables.bbConviva;
		//Feed (Playlist) id
		bbPlayer.config.data.mpxAccount 		= environmentVariables.bbAccountMPX;
		//MPX Player ID
		bbPlayer.config.data.mpxPlayerID 		= environmentVariables.bbP;
		//Tealium tag
		bbPlayer.config.data.tealiumEnv 		= environmentVariables.bbTeaEnv;
		//Player Version 
		bbPlayer.config.data.playerVersion 		= "v9.00";
		//video player resource domain
		bbPlayer.config.data.videoDomain 		= environmentVariables.bbD;
		//TODO: Comment out when deploying
		bbPlayer.config.data.videoDomain 		= "";		
		
		//this global function is called after video's boilerplate functions are ready.
		//the site should declare this function.
		window.bbPlayerOnload();	
	
		player.init(window.bbPlayer.playerConfig);
	
		//In order to load Tealium after the player starts loading but before playback starts, load tealium on a delay.
		$pdk.controller.addEventListener("OnPlayerLoaded", playerPostLoadHandler);		
	}

	var uiMangerObject = new uimanager();
	
	loaders.getEnvironmentVariables(boilerPlateVariables);
});

var playerPostLoadHandler = function(event) {
    $.getScript( "https://"+bbPlayer.config.data.tealiumEnv+".js").done(function( script, textStatus ) {
		console.log("[BB][bbMain] Tealium Load Success.");
	}).fail(function( jqxhr, settings, exception ) {
		console.log("[BB][bbMain] Tealium Load Failed.");
	});

	$pdk.controller.removeEventListener("OnPlayerLoaded", "playerPostLoadHandler");
};

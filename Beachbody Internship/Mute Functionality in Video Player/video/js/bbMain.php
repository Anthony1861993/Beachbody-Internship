<?php
$baseUrl = $_SERVER['HTTP_HOST'] or $_SERVER['SERVER_NAME'];
$baseUrl = "//".$baseUrl;
echo "var bbPlayer = {config:{data:{videoDomain: '".$baseUrl."'}}}\n"
?>
requirejs.config({
	baseUrl: '<?php echo $baseUrl;?>/js',
	paths: {
		pinterface: 		'modules/playerinterface',
		teaobj: 			'modules/configs/tealium',
		tealium: 			'//tags.tiqcdn.com/utag/beachbody/bod-dom/qa/utag',
		castPlayer: 		'plugins/CastPlayer',
		castWrapper: 		'plugins/CastWrapper',
		jquery: 			'libs/jquery-1.11.3.min',
		jcookie: 			'libs/jquery.cookie',
		chromecast: 		'//www.gstatic.com/cv/js/sender/v1/cast_sender',
		pdk: 				'//staticclub.teambeachbody.com/players/pdk/5.6.16/tpPdk',
		errors: 			'modules/errorhandler',
		cookie: 			'modules/cookie',
		qs: 				'modules/querystring',
		underscore: 		'libs/underscore-min',
		constants:  		'modules/constants',
		uimanager: 			'modules/uimanager',
		menumanager: 		'modules/menumanager',
		audiohandler: 		'modules/audiohandler',
		cchandler: 			'modules/cchandler',
		mutehandler:		'modules/mutehandler',
		modifierhandler:	'modules/modifierhandler',
		resumehandler: 		'modules/resumehandler',
		endcardhandler: 	'modules/endcardhandler',
		playlisthandler:	'modules/playlisthandler',
		/*styleshandler:	'modules/styleshandler',
		debug: 				'modules/debug',*/
		menu: 				'modules/menu',
		player: 			'modules/player',
		loaders: 			'modules/loaders',
		cast: 				'modules/cast',
		disclaimer: 		'modules/disclaimer',
		json: 				'requirejs-plugins/json',
		text: 				'requirejs-plugins/text'
	},
	shim:{
		'tealium':['teaobj'],
		'jcookie': ['jquery'],
		'pdk' : {
			deps: ['jcookie'],
			exports: "$pdk"
		},
		'castWrapper': ['castPlayer','pdk'],
		'chromecast': ['castWrapper'],
		'player':['chromecast']
	}
});

require(["player","pinterface","loaders","constants","uimanager","playlisthandler","json!//staticclub.teambeachbody.com/players/config.json"], function(player,pinterface,loaders,constants,uimanager,playlisthandler,data){
	
	//set global player object
	
		window.bbPlayer	= pinterface;
		//create objects
		bbPlayer["config"] 						= {};
		bbPlayer["config"]["data"] 				= {};

		environmentVariables 					= data["env-maps"]['<?php echo str_replace("//","",$baseUrl);?>'];
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
		bbPlayer.config.data.videoDomain 		= '<?php echo $baseUrl;?>';
		
		//this global function is called after video's boilerplate functions are ready.
		//the site should declare this function.
		window.bbPlayerOnload();	
	
		player.init(window.bbPlayer.playerConfig);


		bbPlayer.modules = new Object();

		bbPlayer.modules.playlisthandler = new playlisthandler();
		bbPlayer.modules.uimanager = new uimanager();
	
		//In order to load Tealium after the player starts loading but before playback starts, load tealium on a delay.
		$pdk.controller.addEventListener("OnPlayerLoaded", playerPostLoadHandler);		
});

var playerPostLoadHandler = function(event) {
    $.getScript( "https://"+bbPlayer.config.data.tealiumEnv+".js").done(function( script, textStatus ) {
		console.log("[BB][bbMain] Tealium Load Success.");
	}).fail(function( jqxhr, settings, exception ) {
		console.log("[BB][bbMain] Tealium Load Failed.");
	});

	$pdk.controller.removeEventListener("OnPlayerLoaded", "playerPostLoadHandler");
};

<?php ?>
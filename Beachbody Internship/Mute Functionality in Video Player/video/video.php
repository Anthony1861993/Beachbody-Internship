<?php 
$baseUrl 	= $_SERVER['HTTP_HOST'] or $_SERVER['SERVER_NAME'];
$baseUrl 	= "//".$baseUrl;
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<title>test page</title>
<head>
	<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1,maximum-scale=1,user-scalable=no" />
	<meta name="tp:PreferredRuntimes" content="universal,flash" />
	<meta name="tp:PreferredFormats" content="M3U" />
	<meta name="tp:initialize" content="false" />
<script text="text/javascript" data-main="<?php echo $baseUrl;?>/js/bbMain.php?v=.js" src='<?php echo $baseUrl;?>/js/require.js'></script>
<script>var myDomain = "staticclub.teambeachbody.com";</script>
<style>
.module-disclaimer .content .btn-decline{
    width: 100px;
    text-align: center;
    line-height: 33px;
    display: inline-block;
    color: #535353;
    background: #ffffff;
    text-transform: uppercase;
    font-family: "proxima-nova", "arial";
    font-weight: 700;
    font-style: normal;
    border-radius: 3px
}
<?php



?>
</style>
</head>
<body bgcolor="#999999">
	<div id="player"></div>
	<script>	
		
		var globalData = new Object();
		var playlistHandlerCallback = null;
		var playlistData = 	null;

		// iFrame Post Message Handler for playlist handling
		var iframePostMessageHandler = function(event) {
			//console.log("[BB] iFrame received message from parent. Data = ",event.data);
			
			if(event.data.type === 'playlist') { 
				console.log("[BB] Playlist found!");
				
				if (event.data.playlist) {
					if (event.data.playlist.length > 0) {
						playlistData = event.data;
					}
				}

				if (playlistHandlerCallback) {
					playlistHandlerCallback(playlistData);
				}
			} 
		} 

		window.addEventListener('message', iframePostMessageHandler, false);
	
		window.bbPlayerOnload = function(){
			var bbConfig 			= {};
			//beach body program name
			bbConfig.programName	= "<?php echo $_GET["display"] ?>";
			//beach body profile ID
			bbConfig.profileID 		= "03B6E04F-6009-4B1E-8223-08D83BA96C9C";
			//viewer email hash e.g. bbuid
			bbConfig.emailHash 		= "557ced1f700b673691927a20f147cddf548e27435917ea133fa82c1f5f8d5fd0";
			//mpx media reference id
			bbConfig.mpxReferenceID = "<?php echo $_GET["guid"]?>";
			
			bbPlayer.createPlayer(bbConfig, "player");
		}
	</script>
</br>
</br>
</body>
</html>

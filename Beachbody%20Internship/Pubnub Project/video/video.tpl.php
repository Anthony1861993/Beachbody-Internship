<?php
//get app specific configuration
$vidProtocol = stripos($_SERVER['SERVER_PROTOCOL'],'https') === true ? 'https' : 'http';
$vidDomain =  $_SERVER['SERVER_NAME'];

//Load config.json and grab player library base on domain key. 
$pAppURL  	= $vidProtocol."://staticclub.teambeachbody.com/players/config.json";
$pAppJson	= file_get_contents($pAppURL);
$pAppObj	= "";

//Echo a script tag that contains some console.log messages for testing.
/*
echo "<script>";
echo "console.log( '[TPL] vidProtocol = " . $vidProtocol . "' );";
echo "console.log( '[TPL] vidDomain = " . $vidDomain . "' );";
echo "console.log( '[TPL] pAppURL = " . $pAppURL . "' );";
echo "</script>";
*/

if($pAppJson){
	$pAppObj	= json_decode($pAppJson);
}else{
	echo "[TPL] ERROR loading app configuration from server";
}

$envobj		= $pAppObj->{'env-maps'}->{$vidDomain};
$pConfig	= $envobj->{'mainscript'};

/* UNCOMMENT FOR TESTING THIS PAGE DIRECTLY
$program_name 	= "Body Beast:Build: Chest/Tris";
$profile_id		= "03B6E04F-6009-4B1E-8223-08D83BA96C9C";
$email			= "557ced1f700b673691927a20f147cddf548e27435917ea133fa82c1f5f8d5fd0";
$video			= "BST19311B01";
*/

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:tp="http://player.theplatform.com/"  xml:lang="en" lang="en">
<title>Beachbody</title>
<head>
	<script>
	<?php
		echo "var bbConfig = {};";

		//In case we add more variables, spit them all out into a js object 
	    foreach ($envobj as $key => $value) {
			echo "bbConfig.".$key." = '".$value."';";
	    }
	?>

	bbConfig.programName		 	= "<?php echo $program_name;?>";
	bbConfig.profileID 			= "<?php echo $profile_id;?>";
	bbConfig.emailHash 			= "<?php echo $email;?>";
	bbConfig.mpxReferenceID 			= "<?php echo $video;?>";

	<?php
		if($vidDomain === "localhost"){
			$fullpath	= "";
			$requirePath = 'js/require.js';
		}else{
			$fullPath	= "//".$envobj->{'bbD'}."/".$envobj->{'bbTagPath'}."/".$envobj->{'bbVersion'};
			$requirePath = $fullPath.'/js/require.js';
		}
		echo 'bbConfig.videoDomain = "'.$fullPath.'";';
	?>
	</script>
	<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1,maximum-scale=1,user-scalable=no" />
	<meta name="tp:PreferredRuntimes" content="universal,flash" />
	<meta name="tp:initialize" content="false" />
	<meta name="tp:PreferredFormats" content="M3U" />
	<meta name="tp:EnableExternalController" content="true" />
	<script text="text/javascript" data-main="<?php echo $pConfig;?>" src='<?php echo $requirePath;?>'></script>
	<script>
		require.config({
			baseUrl: '<?php echo $fullPath?>/js'
		})
	</script>

</head>
<body>
	<div id="player"></div>
</body>
</html>
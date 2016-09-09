define(['pdk','jquery'], function($pdk, $){
	var methods = {
		params: {
			callback: null,
			markup : '<div class="module-disclaimer-container">'+
							'<div class="module-disclaimer" data-version="bf3c5238d7ee186cfb600ef6c8e67a4e" style="display: block;">'+
							    '<div class="content">'+
							        '<p class="title">WARNING!</p>'+
							        '<div class="text-box mCustomScrollbar _mCS_1"><div id="mCSB_1" class="mCustomScrollBox mCS-light mCSB_vertical mCSB_inside" tabindex="0"><div id="mCSB_1_container" class="mCSB_container" style="position: relative; top: -775px; left: 0px;" dir="ltr">'+
							            	'<p class="sub-title" align="CENTER"><strong>Consult your physician, assess your fitness levels, and follow all safety instructions before beginning this or any exercise program and nutrition plan.</strong></p>'+
											'<p class="text">The Beachbody<sup>®</sup> program you are about to begin is a physically demanding and high-intensity exercise program. It is extremely important that you listen to your body, use common sense, take breaks, and hydrate as needed to avoid injury and help prevent serious medical conditions, such as rhabdomyolysis, a rare but potentially lethal threat impacting people who have not let their muscles adapt to difficult workouts. Only you can know if you are in sufficient physical condition to safely perform this exercise program and follow the nutrition plan.</p>'+
											'<p class="text">&nbsp;If at any time you feel you are exercising beyond your current fitness abilities, or you feel any discomfort, pain, dizziness, or nausea, you should discontinue exercise immediately and reconsider your use of the program or the particular exercise routine. </p>'+
											'<p class="text">&nbsp;Certain Beachbody programs utilize resistance bands, pull up bars, stability balls, sliding discs, weights and other equipment which, if not used correctly, could lead to serious injury.  For your safety, you must use any equipment shown in the workouts only as demonstrated, inspect any equipment prior to each use and refrain from using any equipment that appears damaged, worn or defective.  For any equipment that requires hanging or attaching, always use a secure, proper, and stable anchor.  For exercise moves that require wrapping exercise bands around your body, make sure the bands are firmly secure to prevent slipping and injury to yourself or anyone else. Always exercise caution during use to make sure you do not lose your grip or control, such as making sure your hands are not wet or sweaty. </p>'+
											'<p class="text">&nbsp;When performing jumping or other exercises using a workout bench, make sure your bench is stable, strong enough to hold your weight and does not move. If you do not think you can safely perform exercises with your bench, or you do not have a proper bench, you should use the modifier exercises to stay safe without the bench. Do not substitute any other equipment for a proper workout bench. Improper form or use of equipment can cause serious and permanent injury. Always make sure your exercise area is clear of any obstacles, including pets, children, other people, or equipment not currently in use.</p>'+
											'<p class="text">&nbsp;If you have any <strong>unique or special medical conditions, such as if you’re pregnant, or if you have a history of knee, ankle, shoulder or spinal (back or neck) problems</strong>, you must consult with a competent and reliable physician to understand all risks, contraindications and complications of using this program, and receive authorization from them before beginning. Failure to do so could result in significant injury to you and others (including, if applicable, your unborn child). By using this program, you assume all dangers, hazards and risks of injury in the use of this program.</p>'+
											'<p class="text">Beachbody offers many fitness alternatives if you are prone to or have a history of injuries, or are not ready for a physically demanding workout and nutrition plan.  Accordingly, to the extent permitted by law, Beachbody, LLC, will not be liable to any person or entity for any damage or loss caused or alleged to be caused directly or indirectly by any workouts, nutrition plan, advice or any other Beachbody content.</p>            <p class="text container-checkbox">'+
							                '<input type="checkbox" id="checkAgreement" class="check-box">'+
							                '<label for="checkAgreement">'+
											'By checking the box and clicking “Accept”, I acknowledge I have read, understand, and agree with this warning.'+
							                '</label>'+
							            '</p>'+
							        '</div><div id="mCSB_1_scrollbar_vertical" class="mCSB_scrollTools mCSB_1_scrollbar mCS-light mCSB_scrollTools_vertical" style="display: block;"><div class="mCSB_draggerContainer"><div id="mCSB_1_dragger_vertical" class="mCSB_dragger" style="position: absolute; min-height: 30px; display: block; height: 116px; max-height: 344px; top: 238px;" oncontextmenu="return false;"><div class="mCSB_dragger_bar" style="line-height: 30px;"></div></div><div class="mCSB_draggerRail"></div></div></div></div></div>'+
							        '<div class="controls">'+
							            '<a href="javascript:void(0);" class="btn-decline">Decline</a>'+
							            '<a href="javascript:void(0);" class="btn-accept disabled">accept</a>'+
							        '</div>'+
							        '<a href="javascript:void(0);" class="btn-close"></a>'+
							    '</div>'+
							'</div>'+
						'</div>'
		},
		init: function(){
		},
		presenter:   {
			show: function(vars) {
				//vars.card
				var elem = vars.card;
				//checkbox
				$(elem).find("#checkAgreement").click(function(){
					if($("#checkAgreement").is(":checked")){
						$(".btn-accept").removeClass("disabled");
					}else{
						$(".btn-accept").addClass("disabled");
					}
				});
								
				//accept, so play
				$(elem).find(".btn-accept").click(function(){
					//prevent disclaimer removal when disabled 
					if($(".btn-accept").hasClass("disabled")){
						return;
					}
					$pdk.controller.hidePlayerCard("overlays", "disclaimerContainer");
				});
				
				//close, so exit
				$(elem).find(".btn-close").click(function(){
					this.close();
				});
				//decline, so exit
				$(elem).find(".btn-decline").click(function(){
					this.close();
				})
				
			},
			hide: function() {
				//$pdk.controller.hidePlayerCard("overlays", "disclaimerContainer");
			
			}
		},
		display: function(){
			$pdk.controller.showPlayerCard("overlays", "disclaimerContainer", "urn:theplatform:pdk:area:player");
		},
		checkAcceptance: function(callback){
			$pdk.controller.addPlayerCard(
		      "overlays",
		      "disclaimerContainer",
		      this.params.markup,
		      "urn:theplatform:pdk:area:player",
		      null,
		      this.presenter,
		      10,
		      null
		    );
			this.apiGetDisclaimerCookie();
		},
		accept: function(){
			
		},
		close: function(){
			
		},
		apiGetDisclaimerCookie: function(){
			this.display();
		},
		apiPostDisclaimerToApi: function(){
			
		},
		
	}
	return methods;
})
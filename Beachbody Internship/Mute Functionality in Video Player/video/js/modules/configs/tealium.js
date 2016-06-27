define([],function(){
	window.customPageTitle = 'Workouts';
    window.digitalData = {
		      page_name : "video",
		      site : {
		        name : "club",
		        section : "bbod"
		      },
		      page : {
		        category : {
		          pageType : "category-page",
		          primaryCategory : "video",
		          subCategory1 : bbPlayer.config.data.programName
		        }
		      },
		      user : {
		        profile : {
		          profileInfo : {
		            profileID : bbPlayer.config.data.profileID,
		            email: bbPlayer.config.data.emailHash
		          },
		        }
		      }
		    };
})


define(['jquery', 'loaders','qs'], function($,loaders,qs){
	var self = null;
	var methods = {
		// Sets a cookie with name, value and expiration date. [expects: setCookie('ui_font_size', fontSize, 30000)];
		setCookie: function(cookieName, cookieValue, expirationInterval) {
			var expirationDate = new Date();
			expirationDate.setTime(expirationDate.getTime() + expirationInterval);
			
			var fullCookieValue = escape(cookieValue) + ((expirationInterval == null) ? "" : "; expires=" + expirationDate.toUTCString());
			document.cookie = cookieName + "=" + fullCookieValue;
		},
		// Gets a cookie by name, [expects: this.getCookie('ui_font_size');];
		getCookie: function(cookieName) {
			var returnData = null;
			var i,x,y,ARRcookies = document.cookie.split(";");
			
			for (i = 0; i < ARRcookies.length; i++)
			{
				x = ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
				y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
				x = x.replace(/^\s+|\s+$/g,"");
			  
				if (x == cookieName)
					return unescape(y);
			}
			
			return returnData;
		},
		deleteCookie: function(cookieName) {
  			document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		}
	}

	return methods;
});
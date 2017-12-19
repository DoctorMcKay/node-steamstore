var Request = require('request');
var SteamID = require('steamid');

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36";

module.exports = SteamStore;

function SteamStore(options) {
	options = options || {};
	
	this._jar = Request.jar();
	
	var defaults = {
		"jar": this._jar, 
		"timeout": options.timeout || 50000, 
		"gzip": true,
		"headers": {
			"User-Agent": options.userAgent || USER_AGENT
		}
	};
	
	this.request = options.request || Request.defaults({"forever": true});  // "forever" indicates that we want a keep-alive agent
	this.request = this.request.defaults(defaults);

	// UTC, English
	this.setCookie("timezoneOffset=0,0");
	this.setCookie("Steam_Language=english");
}

SteamStore.prototype.setCookie = function(cookie) {
	var cookieName = cookie.match(/(.+)=/)[1];
	if(cookieName == 'steamLogin') {
		this.steamID = new SteamID(cookie.match(/=(\d+)/)[1]);
	}

	var isSecure = !!cookieName.match(/(^steamMachineAuth|^steamLoginSecure$)/);
	this._jar.setCookie(Request.cookie(cookie), (isSecure ? "https://" : "http://") + "store.steampowered.com");
};

SteamStore.prototype.setCookies = function(cookies) {
	cookies.forEach(this.setCookie.bind(this));
};

SteamStore.prototype.getSessionID = function() {
	var cookies = this._jar.getCookieString("http://store.steampowered.com").split(';');
	for(var i = 0; i < cookies.length; i++) {
		var match = cookies[i].trim().match(/([^=]+)=(.+)/);
		if(match[1] == 'sessionid') {
			return decodeURIComponent(match[2]);
		}
	}

	var sessionID = generateSessionID();
	this.setCookie("sessionid=" + sessionID);
	return sessionID;
};

function generateSessionID() {
	return Math.floor(Math.random() * 1000000000);
}

SteamStore.prototype._checkHttpError = function(err, response, callback) {
	if(err) {
		callback(err);
		return true;
	}

	if(response.statusCode >= 300 && response.statusCode <= 399 && response.headers.location.indexOf('/login') != -1) {
		callback(new Error("Not Logged In"));
		return true;
	}

	if(response.statusCode >= 400) {
		var error = new Error("HTTP error " + response.statusCode);
		error.code = response.statusCode;
		callback(error);
		return true;
	}

	return false;
};

require('./components/account.js');
require('./components/gifts.js');

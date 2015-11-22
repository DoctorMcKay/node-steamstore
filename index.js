var Request = require('request');

module.exports = SteamStore;

function SteamStore() {
	this._jar = Request.jar();
	this.request = Request.defaults({"jar": this._jar, "timeout": 50000});

	// UTC
	this.setCookie("timezoneOffset=0,0");
}

SteamStore.prototype.setCookie = function(cookie) {
	this._jar.setCookie(Request.cookie(cookie), "http://store.steampowered.com");
	this._jar.setCookie(Request.cookie(cookie), "https://store.steampowered.com");
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

var SteamStore = require('../index.js');
var Cheerio = require('cheerio');

SteamStore.prototype.addPhoneNumber = function(number, bypassConfirmation, callback) {
	if(typeof bypassConfirmation === 'function') {
		callback = bypassConfirmation;
		bypassConfirmation = false;
	}

	var self = this;
	this.request.get({
		"uri": "https://store.steampowered.com/phone/add_ajaxop",
		"qs": {
			"op": "get_phone_number",
			"input": number,
			"sessionID": this.getSessionID(),
			"confirmed": bypassConfirmation ? 1 : 0
		},
		"json": true
	}, function(err, response, body) {
		if(self._checkHttpError(err, response, callback)) {
			return;
		}

		if(body.success) {
			if(body.state != "get_sms_code") {
				var error = new Error("Unknown state " + body.state);
				error.confirmation = false;

				callback(error);
				return;
			}

			callback(null);
			return;
		}

		if(body.errorText) {
			var error = new Error(body.errorText);
			error.confirmation = false;
			callback(error);
			return;
		}

		if(body.requiresConfirmation) {
			var error = new Error(body.confirmationText);
			error.confirmation = true;
			callback(error);
			return;
		}

		var error = new Error("Malformed response");
		error.confirmation = false;
		callback(error);
	});
};

SteamStore.prototype.resendVerificationSMS = function(callback) {
	var self = this;
	this.request.get({
		"uri": "https://store.steampowered.com/phone/add_ajaxop",
		"qs": {
			"op": "resend_sms",
			"input": "",
			"sessionID": this.getSessionID(),
			"confirmed": 0
		},
		"json": true
	}, function(err, response, body) {
		if(self._checkHttpError(err, response, callback)) {
			return;
		}

		if(body.success) {
			if(body.state != "get_sms_code") {
				callback(new Error("Unknown state " + body.state));
				return;
			}

			callback(null);
			return;
		}

		if(body.errorText) {
			callback(new Error(body.errorText));
			return;
		}

		callback(new Error("Malformed response"));
	});
};

SteamStore.prototype.verifyPhoneNumber = function(code, callback) {
	var self = this;
	this.request.get({
		"uri": "https://store.steampowered.com/phone/add_ajaxop",
		"qs": {
			"op": "get_sms_code",
			"input": code,
			"sessionID": this.getSessionID(),
			"confirmed": 0
		},
		"json": true
	}, function(err, response, body) {
		if(self._checkHttpError(err, response, callback)) {
			return;
		}

		if(body.success) {
			if(body.state != "done") {
				callback(new Error("Unknown state " + body.state));
				return;
			}

			callback(null);
			return;
		}

		if(body.errorText) {
			callback(new Error(body.errorText));
			return;
		}

		callback(new Error("Malformed response"));
	});
};

SteamStore.prototype.removePhoneNumber = function(callback) {
	var self = this;
	this.request.post({
		"uri": "https://store.steampowered.com/phone/remove_confirm_sms",
		"form": {
			"sessionID": this.getSessionID(),
			"bWasEdit": ""
		}
	}, function(err, response, body) {
		if(self._checkHttpError(err, response, callback)) {
			return;
		}

		callback(null);
	});
};

SteamStore.prototype.confirmRemovePhoneNumber = function(code, callback) {
	var self = this;
	this.request.post({
		"uri": "https://store.steampowered.com/phone/remove_confirm_smscode_entry",
		"form": {
			"sessionID": this.getSessionID(),
			"bWasEdit": "",
			"smscode": code
		}
	}, function(err, response, body) {
		if(self._checkHttpError(err, response, callback)) {
			return;
		}

		var match = body.match(/id="errortext"[^>]+>([^<]+)<\/div>/);
		if(match) {
			callback(new Error(match[1].trim()));
		} else {
			callback(null);
		}
	});
};

SteamStore.prototype.getAccountData = function(callback) {
	var self = this;
	this.request.get({
		"uri": "https://store.steampowered.com/dynamicstore/userdata/",
		"qs": {
			"id": this.steamID.accountid
		},
		"json": true
	}, function(err, response, body) {
		if(self._checkHttpError(err, response, callback)) {
			return;
		}

		if(!body.rgWishlist || !body.rgOwnedPackages || !body.rgOwnedApps || !body.rgRecommendedTags || !body.rgIgnoredApps) {
			callback(new Error("Malformed response"));
			return;
		}

		var tags = {};
		body.rgRecommendedTags.forEach(function(tag) {
			tags[tag.tagid] = tag.name;
		});

		callback(null, body.rgOwnedApps, body.rgOwnedPackages, body.rgWishlist, body.rgIgnoredApps, tags);
	});
};

SteamStore.prototype.hasPhone = function(callback) {
	var self = this;
	this.request.get("https://store.steampowered.com/account/", function(err, response, body) {
		if(self._checkHttpError(err, response, callback)) {
			return;
		}

		var $ = Cheerio.load(body);
		var $phone = $('.phone_header_description .account_data_field');
		var match;

		if($phone && (match = $phone.text().match(/Ends in (\d+)/))) {
			// Has phone number
			callback(null, true, match[1]);
			return;
		}

		// See if we have an add-number link
		if($('a[href*="/phone/add"]').length) {
			callback(null, false);
			return;
		}

		callback(new Error("Malformed response"));
	});
};

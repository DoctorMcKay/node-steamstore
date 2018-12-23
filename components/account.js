var SteamStore = require('../index.js');
var Cheerio = require('cheerio');

var EPurchaseResult = require('../resources/EPurchaseResult.js');
SteamStore.prototype.EPurchaseResult = EPurchaseResult;

var EResult = require('../resources/EResult.js');
SteamStore.prototype.EResult = EResult;

SteamStore.prototype.addPhoneNumber = function(number, bypassConfirmation, callback) {
	if (typeof bypassConfirmation === 'function') {
		callback = bypassConfirmation;
		bypassConfirmation = false;
	}

	var self = this;
	this.request.post({
		"uri": "https://store.steampowered.com/phone/add_ajaxop",
		"form": {
			"op": "get_phone_number",
			"input": number,
			"sessionID": this.getSessionID(),
			"confirmed": bypassConfirmation ? 1 : 0,
			"checkfortos": 1,
			"bisediting": 0,
			"token": 0
		},
		"json": true
	}, function(err, response, body) {
		if (self._checkHttpError(err, response, callback)) {
			return;
		}

		var error;

		if (body.success) {
			if (body.state != "get_sms_code") {
				error = new Error("Unknown state " + body.state);
				error.confirmation = false;

				callback(error);
				return;
			}

			callback(null);
			return;
		}

		if (body.errorText) {
			error = new Error(body.errorText);
			error.confirmation = false;
			callback(error);
			return;
		}

		if (body.requiresConfirmation) {
			error = new Error(body.confirmationText);
			error.confirmation = true;
			callback(error);
			return;
		}

		error = new Error("Malformed response");
		error.confirmation = false;
		callback(error);
	});
};

SteamStore.prototype.resendVerificationSMS = function(callback) {
	var self = this;
	this.request.post({
		"uri": "https://store.steampowered.com/phone/add_ajaxop",
		"form": {
			"op": "resend_sms",
			"input": "",
			"sessionID": this.getSessionID(),
			"confirmed": 0,
			"checkfortos": 1,
			"bisediting": 0,
			"token": 0
		},
		"json": true
	}, function(err, response, body) {
		if (self._checkHttpError(err, response, callback)) {
			return;
		}

		if (body.success) {
			if (body.state != "get_sms_code") {
				callback(new Error("Unknown state " + body.state));
				return;
			}

			callback(null);
			return;
		}

		if (body.errorText) {
			callback(new Error(body.errorText));
			return;
		}

		callback(new Error("Malformed response"));
	});
};

SteamStore.prototype.verifyPhoneNumber = function(code, callback) {
	var self = this;
	this.request.post({
		"uri": "https://store.steampowered.com/phone/add_ajaxop",
		"form": {
			"op": "get_sms_code",
			"input": code,
			"sessionID": this.getSessionID(),
			"confirmed": 1,
			"checkfortos": 1,
			"bisediting": 0,
			"token": 0
		},
		"json": true
	}, function(err, response, body) {
		if (self._checkHttpError(err, response, callback)) {
			return;
		}

		if (body.success) {
			if (body.state != "done") {
				callback(new Error("Unknown state " + body.state));
				return;
			}

			callback(null);
			return;
		}

		if (body.errorText) {
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
		if (self._checkHttpError(err, response, callback)) {
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
		if (self._checkHttpError(err, response, callback)) {
			return;
		}

		var match = body.match(/id="errortext"[^>]+>([^<]+)<\/div>/);
		if (match) {
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
		if (self._checkHttpError(err, response, callback)) {
			return;
		}

		if (!body.rgWishlist || !body.rgOwnedPackages || !body.rgOwnedApps || !body.rgRecommendedTags || !body.rgIgnoredApps) {
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
		if (self._checkHttpError(err, response, callback)) {
			return;
		}

		var $ = Cheerio.load(body);
		var $phone = $('.phone_header_description .account_data_field');
		var match;

		if ($phone && (match = $phone.text().trim().match(/([0-9]{2})($|\s)/))) {
			// Has phone number
			callback(null, true, match[1]);
			return;
		}

		// See if we have an add-number link
		if ($('a[href*="/phone/add"]').length) {
			callback(null, false);
			return;
		}

		callback(new Error("Malformed response"));
	});
};

SteamStore.prototype.setDisplayLanguages = function(prim_language, sec_languages, callback) {
	if (typeof sec_languages === "function") {
		callback = sec_languages;
		sec_languages = undefined;
	}

	var self = this;
	this.request.post({
		"uri": "https://store.steampowered.com/account/savelanguagepreferences",
		"form": {
			"sessionid": this.getSessionID(),
			"primary_language": prim_language,
			"secondary_languages": sec_languages || []
		}
	}, function(err, response, body) {
		if (self._checkHttpError(err, response, callback)) {
			return;
		}

		if (body.success != EResult.OK) {
			callback && callback(new Error(EResult[body.success] || "Error " + body.success));
		} else {
			callback && callback(null);
		}
	});
};

SteamStore.prototype.createWallet = function(code, billingAddress, callback) {
	var self = this;
	this.request.post({
		"uri": "https://store.steampowered.com/account/createwalletandcheckfunds/",
		"form": {
			"wallet_code": code,
			"CreateFromAddress": "1",
			"Address": billingAddress.address,
			"City": billingAddress.city,
			"Country": billingAddress.country,
			"State": billingAddress.state,
			"PostCode": billingAddress.postalCode,
			"sessionid": this.getSessionID()
		},
		"json": true
	}, function(err, res, body) {
		if (self._checkHttpError(err, res, callback)) {
			return;
		}

		if (!body.success && !body.detail && !body.wallet) {
			callback(new Error("Malformed response"));
			return;
		}

		callback(null, body.success, body.detail, body.success == EResult.OK && body.detail == EPurchaseResult.NoDetail, body.wallet && body.wallet.amount, body.wallet && body.wallet.currencycode);
	});
};

SteamStore.prototype.checkWalletCode = function(code, callback) {
	var self = this;
	this.request.post({
		"uri": "https://store.steampowered.com/account/validatewalletcode/",
		"form": {
			"wallet_code": code,
			"sessionid": this.getSessionID()
		},
		"json": true
	}, function(err, response, body) {
		if (self._checkHttpError(err, response, callback)) {
			return;
		}

		if (!body.success && !body.detail && !body.wallet) {
			callback(new Error("Malformed response"));
			return;
		}

		callback(null, body.success, body.detail, body.success == EResult.OK && body.detail == EPurchaseResult.NoDetail, body.wallet && body.wallet.amount, body.wallet && body.wallet.currencycode);
	});
};

SteamStore.prototype.redeemWalletCode = function(code, callback) {
	var self = this;
    this.checkWalletCode(code, function(err, eresult, purchaseresultdetail, redeemable, amount, currencycode) {
    	if (err) {
    		callback && callback(err);
    		return;
	    }

	    if (!redeemable) {
    		var error = new Error("Wallet code is not valid");
    		error.eresult = eresult;
    		error.purchaseresultdetail = purchaseresultdetail;
    		callback && callback(error);
    		return;
	    }

    	self.request.post({
		    "uri": "https://store.steampowered.com/account/confirmredeemwalletcode/",
		    "form": {
			    "wallet_code": code,
					"sessionid": self.getSessionID()
		    },
		    "json": true
	    }, function(err, response, body) {
		    if (!callback) {
			    return;
		    }

    		if (self._checkHttpError(err, response, callback)) {
    			return;
		    }

		    if (!body.success && !body.detail) {
		    	callback(new Error("Malformed response"));
		    	return;
		    }

		    callback(null, body.success, body.detail, body.formattednewwalletbalance, amount);
	    });
    });
};

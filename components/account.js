const Cheerio = require('cheerio');
const StdLib = require('@doctormckay/stdlib');

const SteamStore = require('../index.js');

const EPurchaseResult = require('../resources/EPurchaseResult.js');
SteamStore.prototype.EPurchaseResult = EPurchaseResult;

const EResult = require('../resources/EResult.js');
SteamStore.prototype.EResult = EResult;

/**
 * Add a phone number to your account.
 * @param {string} number
 * @param {boolean} [bypassConfirmation=false]
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.addPhoneNumber = function(number, bypassConfirmation, callback) {
	return StdLib.Promises.callbackPromise(null, callback, (accept, reject) => {
		if (typeof bypassConfirmation === 'function') {
			callback = bypassConfirmation;
			bypassConfirmation = false;
		}

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
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			let error;

			if (body.success) {
				if (body.state != "get_sms_code") {
					error = new Error("Unknown state " + body.state);
					error.confirmation = false;

					return reject(error);
				}

				return accept();
			}

			if (body.errorText) {
				error = new Error(body.errorText);
				error.confirmation = false;
				return reject(error);
			}

			if (body.requiresConfirmation) {
				error = new Error(body.confirmationText);
				error.confirmation = true;
				return reject(error);
			}

			error = new Error("Malformed response");
			error.confirmation = false;
			return reject(error);
		});
	});
};

/**
 * Request that Steam resends your phone verification SMS message.
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.resendVerificationSMS = function(callback) {
	return StdLib.Promises.callbackPromise(null, callback, (accept, reject) => {
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
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			if (body.success) {
				if (body.state != "get_sms_code") {
					return reject(new Error("Unknown state " + body.state));
				}

				return accept();
			}

			if (body.errorText) {
				return reject(new Error(body.errorText));
			}

			return reject(new Error("Malformed response"));
		});
	});
};

/**
 * Verify your phone number using the SMS verification code you were sent.
 * @param {string} code
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.verifyPhoneNumber = function(code, callback) {
	return StdLib.Promises.callbackPromise(null, callback, (accept, reject) => {
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
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			if (body.success) {
				if (body.state != "done") {
					return reject(new Error("Unknown state " + body.state));
				}

				return accept();
			}

			if (body.errorText) {
				return reject(new Error(body.errorText));
			}

			return reject(new Error("Malformed response"));
		});
	});
};

/**
 * Request to remove the phone number from your account.
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.removePhoneNumber = function(callback) {
	return StdLib.Promises.callbackPromise(null, callback, (accept, reject) => {
		this.request.post({
			"uri": "https://store.steampowered.com/phone/remove_confirm_sms",
			"form": {
				"sessionID": this.getSessionID(),
				"bWasEdit": ""
			}
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			accept();
		});
	});
};

/**
 * Confirm the removal of your phone number using the code sent via SMS.
 * @param {string} code
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.confirmRemovePhoneNumber = function(code, callback) {
	return StdLib.Promises.callbackPromise(null, callback, (accept, reject) => {
		this.request.post({
			"uri": "https://store.steampowered.com/phone/remove_confirm_smscode_entry",
			"form": {
				"sessionID": this.getSessionID(),
				"bWasEdit": "",
				"smscode": code
			}
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			let match = body.match(/id="errortext"[^>]+>([^<]+)<\/div>/);
			if (match) {
				return reject(new Error(match[1].trim()));
			}

			return accept();
		});
	});
};

/**
 * Get your account's data such as owned apps, owned packages, wishlisted apps, and ignored apps.
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.getAccountData = function(callback) {
	return StdLib.Promises.callbackPromise(['ownedApps', 'ownedPackages', 'wishlistedApps', 'ignoredApps', 'suggestedTags'], callback, (accept, reject) => {
		this.request.get({
			"uri": "https://store.steampowered.com/dynamicstore/userdata/",
			"qs": {
				"id": this.steamID.accountid
			},
			"json": true
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			if (!body.rgWishlist || !body.rgOwnedPackages || !body.rgOwnedApps || !body.rgRecommendedTags || !body.rgIgnoredApps) {
				return reject(new Error("Malformed response"));
			}

			let tags = {};
			body.rgRecommendedTags.forEach(function(tag) {
				tags[tag.tagid] = tag.name;
			});

			return accept({
				"ownedApps": body.rgOwnedApps,
				"ownedPackages": body.rgOwnedPackages,
				"wishlistedApps": body.rgWishlist,
				"ignoredApps": body.rgIgnoredApps,
				"suggestedTags": tags
			});
		});
	});
};

/**
 * Check whether your account has a linked verified phone number.
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.hasPhone = function(callback) {
	return StdLib.Promises.callbackPromise(['hasVerifiedPhone', 'lastDigits'], callback, (accept, reject) => {
		this.request.get("https://store.steampowered.com/account/", (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			let $ = Cheerio.load(body);
			let $phone = $('.phone_header_description .account_data_field');
			let match;

			if ($phone && (match = $phone.text().trim().match(/([0-9]{2})($|\s)/))) {
				// Has phone number
				return accept({
					"hasVerifiedPhone": true,
					"lastDigits": match[1]
				});
			}

			// See if we have an add-number link
			if ($('a[href*="/phone/add"]').length) {
				return accept({
					"hasVerifiedPhone": false
				});
			}

			return reject(new Error("Malformed response"));
		});
	});
};

/**
 * Set the display language(s) for your Steam account.
 * @param {string} primaryLanguage
 * @param {string[]} [secondaryLanguages]
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.setDisplayLanguages = function(primaryLanguage, secondaryLanguages, callback) {
	return StdLib.Promises.callbackPromise(null, callback, true, (accept, reject) => {
		if (typeof secondaryLanguages === 'function') {
			callback = secondaryLanguages;
			secondaryLanguages = undefined;
		}

		this.request.post({
			"uri": "https://store.steampowered.com/account/savelanguagepreferences",
			"form": {
				"sessionid": this.getSessionID(),
				"primary_language": primaryLanguage,
				"secondary_languages": secondaryLanguages || []
			}
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			if (body.success != EResult.OK) {
				return reject(new Error(EResult[body.success] || "Error " + body.success));
			} else {
				return accept();
			}
		});
	});
};

/**
 * Create a Steam Wallet for your account, using a Steam Wallet code. This *will not* redeem the code.
 * @param {string} code - The Steam Wallet gift code you want to use to create your wallet
 * @param {{address, city, country, state, postalCode}} billingAddress
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.createWallet = function(code, billingAddress, callback) {
	return StdLib.Promises.callbackPromise([
		'eresult',
		'detail',
		'redeemable',
		'amount',
		'currencyCode'
	], callback, (accept, reject) => {
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
		}, (err, res, body) => {
			if (this._checkHttpError(err, res, reject)) {
				return;
			}

			if (!body.success && !body.detail && !body.wallet) {
				return reject(new Error("Malformed response"));
			}

			accept({
				"eresult": body.success,
				"detail": body.detail,
				"redeemable": body.success == EResult.OK && body.detail == EPurchaseResult.NoDetail,
				"amount": body.wallet && body.wallet.amount,
				"currencyCode": body.wallet && body.wallet.currencycode
			});
		});
	});
};

/**
 * Check to make sure a Steam wallet code is valid.
 * @param {string} code
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.checkWalletCode = function(code, callback) {
	return StdLib.Promises.callbackPromise([
		'eresult',
		'detail',
		'redeemable',
		'amount',
		'currencyCode'
	], callback, (accept, reject) => {
		this.request.post({
			"uri": "https://store.steampowered.com/account/validatewalletcode/",
			"form": {
				"wallet_code": code,
				"sessionid": this.getSessionID()
			},
			"json": true
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			if (!body.success && !body.detail && !body.wallet) {
				return reject(new Error("Malformed response"));
			}

			accept({
				"eresult": body.success,
				"detail": body.detail,
				"redeemable": body.success == EResult.OK && body.detail == EPurchaseResult.NoDetail,
				"amount": body.wallet && body.wallet.amount,
				"currencyCode": body.wallet && body.wallet.currencycode
			});
		});
	});
};

/**
 * Redeem a Steam Wallet code.
 * @param {string} code
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.redeemWalletCode = function(code, callback) {
	return StdLib.Promises.callbackPromise([
		'eresult',
		'detail',
		'formattedNewWalletBalance',
		'amount'
	], callback, true, async (accept, reject) => {
		let check;
		try {
			check = await this.checkWalletCode(code);
		} catch (ex) {
			return reject(ex);
		}

		if (!check.redeemable) {
			let error = new Error("Wallet code is not valid");
			error.eresult = check.eresult;
			error.purchaseresultdetail = check.purchaseresultdetail;
			return reject(error);
		}

		this.request.post({
			"uri": "https://store.steampowered.com/account/confirmredeemwalletcode/",
			"form": {
				"wallet_code": code,
				"sessionid": this.getSessionID()
			},
			"json": true
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			if (!body.success && !body.detail) {
				return reject(new Error("Malformed response"));
			}

			return accept({
				"eresult": body.success,
				"detail": body.detail,
				"formattedNewWalletBalance": body.formattednewwalletbalance,
				"amount": body.amount
			});
		});
	});
};

/**
 * Get the current formatted balance of your Steam wallet.
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.getWalletBalance = function(callback) {
	return StdLib.Promises.callbackPromise(null, callback, (accept, reject) => {
		this.request.get({
			"uri": "https://store.steampowered.com/steamaccount/addfunds"
		}, (err, res, body) => {
			if (this._checkHttpError(err, res, reject)) {
				return;
			}

			let $ = Cheerio.load(body);
			let formattedBalance = $('.accountBalance .accountData.price').text();

			if (!formattedBalance) {
				return reject(new Error('Unable to get wallet balance; perhaps your account doesn\'t have a wallet yet.'));
			}

			return accept({formattedBalance});
		});
	});
};

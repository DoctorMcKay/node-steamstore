var SteamStore = require('../index.js');
var SteamID = require('steamid');

SteamStore.prototype.sendGift = function(giftID, recipient, recipientName, message, closing, signature, callback) {
	var self = this;

	var accountid = 0;
	var email = "";

	if (typeof recipient === 'string' && recipient.match(/@/)) {
		// It's an email address
		email = recipient;
	} else if (!recipient.accountid) {
		// Recipient is not a SteamID object. Might be a string, might be a BigNumber object, etc.
		accountid = new SteamID(recipient.toString()).accountid;
	} else {
		// Recipient is a SteamID object.
		accountid = recipient.accountid;
	}

	this.request.post({
		"uri": "https://store.steampowered.com/checkout/sendgiftsubmit/",
		"headers": {
			"Referer": "https://store.steampowered.com/checkout/sendgift/" + giftID
		},
		"form": {
			"GifteeAccountID": accountid,
			"GifteeEmail": email,
			"GifteeName": recipientName,
			"GiftMessage": message,
			"GiftSentiment": closing,
			"GiftSignature": signature,
			"GiftGID": giftID,
			"SessionID": this.getSessionID()
		},
		"json": true
	}, function(err, response, body) {
		if (!callback) {
			return;
		}

		if (self._checkHttpError(err, response, callback)) {
			return;
		}

		if (body.success == 1) {
			callback(null);
		} else {
			callback(new Error("EResult " + body.success));
		}
	});
};

const StdLib = require('@doctormckay/stdlib');
const SteamID = require('steamid');

const SteamStore = require('../index.js');

/**
 * Send a Steam inventory gift to another user.
 * @param {string} giftID
 * @param {SteamID|string} recipient - Recipient's SteamID
 * @param {string} recipientName
 * @param {string} message
 * @param {string} closing
 * @param {string} signature
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.sendGift = function(giftID, recipient, recipientName, message, closing, signature, callback) {
	return StdLib.Promises.callbackPromise(null, callback, true, (accept, reject) => {
		let accountid = 0;

		if (!recipient.accountid) {
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
				"GifteeEmail": "",
				"GifteeName": recipientName,
				"GiftMessage": message,
				"GiftSentiment": closing,
				"GiftSignature": signature,
				"GiftGID": giftID,
				"SessionID": this.getSessionID()
			},
			"json": true
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			if (body.success == 1) {
				return accept();
			} else {
				return reject(new Error("EResult " + body.success));
			}
		});
	});
};

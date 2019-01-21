const StdLib = require('@doctormckay/stdlib');

const SteamStore = require('../index.js');

/**
 * Add an eligible free-on-demand license to your Steam account.
 * @param {int} subID - The ID of the free-on-demand sub you want to claim
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.addFreeLicense = function(subID, callback) {
	return StdLib.Promises.callbackPromise(null, callback, true, (accept, reject) => {
		this.request.post({
			"uri": "https://store.steampowered.com/checkout/addfreelicense",
			"form": {
				"action": "add_to_cart",
				"sessionid": this.getSessionID(),
				"subid": subID
			}
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			let match = body.match(/<span class="error">([^<]+)<\/span>/);
			if (match) {
				return reject(new Error(match[1]));
			}

			if (!body.includes('<h2>Success!</h2>')) {
				return reject(new Error('Malformed response'));
			}

			return accept();
		});
	});
};

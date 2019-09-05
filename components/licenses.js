const StdLib = require('@doctormckay/stdlib');

const Helpers = require('./helpers.js');

const SteamStore = require('../index.js');

/**
 * Add an eligible free-on-demand license to your Steam account.
 * @param {int} subID - The ID of the free-on-demand sub you want to claim
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.addFreeLicense = function(subID, callback) {
	return StdLib.Promises.callbackPromise(null, callback, true, (resolve, reject) => {
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

			return resolve();
		});
	});
};

/**
 * Remove an eligible complimentary license from your account.
 * @param {int} subID - The ID of the complimentary license you want to remove
 * @param {function} [callback]
 * @returns {Promise}
 */
SteamStore.prototype.removeLicense = function(subID, callback) {
	return StdLib.Promises.callbackPromise(null, callback, true, (resolve, reject) => {
		this.request.post({
			uri: 'https://store.steampowered.com/account/removelicense',
			form: {
				sessionid: this.getSessionID(),
				packageid: subID
			},
			json: true
		}, (err, response, body) => {
			if (this._checkHttpError(err, response, reject)) {
				return;
			}

			if (!body || !body.success) {
				return reject(new Error('Malformed response'));
			}

			if (body.success == 1) {
				return resolve();
			} else {
				return reject(Helpers.eresultError(body.success));
			}
		});
	});
};

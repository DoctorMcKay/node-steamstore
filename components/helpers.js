const EResult = require('../resources/EResult.js');

/**
 * Get an Error object for a particular EResult
 * @param {int|EResult|object} eresult - Either an EResult value, or an object that contains an eresult property. If undefined or is an object without an eresult property, will assume "Fail".
 * @returns {null|Error}
 */
exports.eresultError = function(eresult) {
	if (typeof eresult == 'undefined') {
		eresult = EResult.Fail;
	} else if (typeof eresult == 'object') {
		eresult = eresult.eresult || EResult.Fail;
	}

	if (eresult == EResult.OK) {
		// no error
		return null;
	}

	let err = new Error(EResult[eresult] || ("Error " + eresult));
	err.eresult = eresult;
	return err;
};

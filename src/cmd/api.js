

/**
 * Converts an error thrown by the API to a simpler object containing
 * a `message` property.
 * @param {object} err   The error raised by the API.
 * @returns {object} With message and error properties.
 */
function convertApiError(err) {
	if (err.error && err.error.response && err.error.response.text) {
		const obj = JSON.parse(err.error.response.text);
		if (obj.errors && obj.errors.length) {
			err = { message: obj.errors[0].message, error:err.error };
		}
	}
	return err;
}

export {
	convertApiError
};


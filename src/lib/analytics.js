
const Analytics = require('analytics-node');
const promisify = require('es6-promisify');
const _ = require('lodash');

const pipeline = require('when/pipeline');

class CommandContext {

	identifyUser(particleApiClient) {
		if (particleApiClient.ready()) {
			return particleApiClient.trackingIdentity();
		} else {
			return Promise.reject();
		}
	}

	/**
	 * Determine if the given user descriptor has the requisite identification for a tracking request.
	 * @param {object} user The user object to check.
	 * @returns {boolean}   true if the identity contains the requisite fields (id, email)
	 */
	isIdentity(user) {
		return Boolean(user && user.id && user.email);
	}

	/**
	 * Retrieves the tracking details for the current logged in user.
	 * @param {function(newValue)} trackingIdentity a fetch-update function for the cached tracking identity for the
	 *  current profile.
	 * @param {object} apiClient    The API Client that provides the tracking identity via "
	 * @param {function(opts)} clientFactory synchronously create a client
	 * @return {Promise<object>} promise to retrieve the tracking identity
	 */
	trackingUser(trackingIdentity, apiClient) {
		const ident = trackingIdentity();
		if (this.isIdentity(ident)) {
			return Promise.resolve(ident);
		} else {
			return this.identifyUser(apiClient)
				.then(user => {
					if (this.isIdentity(user)) {
						trackingIdentity(user);
						return user;
					} else {
						return null;
					}
				});
		}
	}

	buildContext({ tool, api, trackingIdentity, apiClient }) {
		// todo - allow the API key to be overridden in the environment so that CLI use during development/testing
		// is tracked against a distinct source
		return pipeline([
			() => this.trackingUser(trackingIdentity, apiClient),
			(user) => {
				return {
					user,
					tool,
					api
				};
			}
		]);
	}
}

const test = {
	CommandContext
};

/**
 *
 * @param {object} tool      The tool definition { name, version }
 * @param {object} api       The tracking api details { key }
 * @param {function(newValue)} trackingIdentity function to retrieve or update the cached user identity
 * @param {object} apiClient   The Particle api client that provides a `trackingIdentity` method.
 * @returns {Promise<object>} promise to build the command context object containing the tool, api and user attributes.
 */
function buildContext({ tool, api, trackingIdentity, apiClient }) {
	return new CommandContext().buildContext({ tool, api, trackingIdentity, apiClient });
}

/**
 * Provides command oriented tracking for analytics. This establishes a convention for how
 * the calling tool specifies the user, any user traits, the tool name, event date time.
 */

const analyticsCache = {};

function analyticsFor(key) {
	let analytics = analyticsCache[key];
	if (!analytics) {
		analytics = new Analytics(key, { flushAfter: 10 });
		analyticsCache[key] = analytics;
	}
	return analytics;
}

function buildProperties(context, properties) {
	const tool = _.mapKeys((context.tool || {}), (value, key) => 'tool'+key);
	return Object.assign(properties, tool);
}

function checkApiKey(context) {
	if (!context || !context.api || !context.api.key) {
		throw new Error('context.api.key not provided');    // todo - distinguish programming/caller errors from runtime errors?
	}
	return context.api.key;
}

function checkUserId(context) {
	const userId = context && context.user && context.user.id;
	const track = context && context.user && context.user.track;
	if (!userId && track!==false) {
		throw new Error('context.user.id not provided');    // todo - distinguish programming/caller errors from runtime errors?
	}
	return userId;
}

function makeAnalytics(context) {
	const key = checkApiKey(context);
	return analyticsFor(key);
}

/**
 *
 * @param {Command} command     The command being executed. May be null for tracking events outside of a command
 * execution context.
 * @param {Object} context      The command invocation context. The analytics property should contain
 * {tool, user, api}.  The api property should include `key` as a minimum, to specify the Segment write key.
 *  THe tool object must contain at least a `name` property to identify the tool being used. User traits must include
 *  at least `id` and `name` properties, which are opaque and natural keys used to identify the current user.
 *  If userTraits is falsey the event is logged anonymously.
 * @param {CommandSite} site     The command site. This is presently unused but may be later used for context-specific
 *      functionality.
 * @param {String}  event       The event name to track.
 * @param {Object}  properties      Additional data to log with the event.
 * @return {Promise} promise to track
 */
function track({ command, context, site, event, properties }) {
	const userId = checkUserId(context);
	if (!userId) {
		return Promise.resolve();
	}
	const analytics = makeAnalytics(context);
	const allProperties = buildProperties(context, properties);

	const track = promisify(analytics.track, { thisArg: analytics });
	return track({
		userId,
		event,
		allProperties
	});
}

function identify({ command, context, site, traits }) {
	const analytics = makeAnalytics(context);
	const userId = checkUserId(context);
	const identify = promisify(analytics.identify, { thisArg: analytics });
	return identify({
		userId,
		traits
	});
}

/**
 * Ensure that any events have been sent. Returns a promise.
 * @return {Promise} to eventually flush
 */
function flush() {
	return Promise.resolve();
}

export {
	identify,
	track,
	flush,
	buildProperties,
	buildContext,
	test
};

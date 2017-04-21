
const Analytics = require('analytics-node');
const promisify = require('es6-promisify');
const _ = require('lodash');

/**
 * Provides command oriented tracking for analytics. This establishes a convention for how
 * the calling tool specifies the user, any user traits, the tool name, event date time.
 */

const analyticsCache = {};

function analyticsFor(key) {
	let analytics = analyticsCache[key];
	if (!analytics) {
		analytics = new Analytics(key, { flushAt: 1 });
		analyticsCache[key] = analytics;
	}
	return analytics;
}

function buildProperties(context, properties) {
	const tool = _.mapKeys((context.tool || {}), (value, key) => 'tool_'+key);
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
	if (!userId) {
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
	buildProperties
};

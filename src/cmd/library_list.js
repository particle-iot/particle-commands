import { Command, CommandSite } from './command';

/**
 * Specification and base implementation for the site instance expected by
 * the LibraryInstallCommand.
 */
export class LibraryListCommandSite extends CommandSite {

	constructor() {
		super();
	}

	/**
	 * Retrieves an object which describes the library sections to list
	 * The returned object has a property for each section defining attributes for that section.
	 * The sections are:
	 * official: official libraries
	 * verified: verified third party libraries
	 * featured: featured libraries - libraries to draw user's attention to
	 * popular: libraries that don't fall into the categories above, sorted by most popular first
	 * mine: user's current libraries
	 * recent: recently updated libraries
	 * community: not-my libraries sorted by official, verified, popularity and then name
	 *
	 * The value of each section is an object:
	 * ```
	 * {
	 *    page: Number  // page to retrieve
	 *    limit: Number // the size of each page
	 *    sort: String  // override the default sort order for this section. Values are
	 *      [-]name, installs, date
	 *    architectures: String  // comma-separated list of architectures, or * for all
	 *    filter: String   // text filter to apply to the list of names
	 * }
	 * ```
	 */
	sections() {
		throw new Error('not implemented');
	}

	/**
	 * Retrieves the default settings:
	 * {
	 *    sort: String; default sort order
	 *    page: Number; default page to retrieve
	 *    limit: Number; default page size
	 *    filter: String; default name filter
	 *    architectures: String; comma-separated list of architectures to filter on
	 * }
	 */
	settings() {
		throw Error('not implemented');
	}

	/**
	 * The object in which to store the results.
	 */
	target() {
		throw Error('not implemented');
	}

	apiClient() {
		throw new Error('not implemented');
	}

	/**
	 * Notification of a promise to fetch a given library list. The result of the promise is the list of libraries.
	 * NB: Currently unused.
	 * @param {Promise} promise   The promise to fetch the list of libraries
	 * @param {String} name      The configuration name
	 * @param {Object} settings  The final settings for fetching the list
	 * @return {Promise|undefined} either a new promise (wrapping the original promise) or
	 * undefined to use the original unmodified.
	 */
	notifyFetchList(promise, name, settings) {
		return undefined;
	}

	/**
	 * Notification that all the lists are being fetched. The result of the promise is an object, with each
	 * list keyed by the name of the list.
	 * @param {Promise} promise   The promise to fetch all library lists
	 * @param {Object} settings  The settings used to fetch each list
	 */
	notifyFetchLists(promise, settings) {

	}

	error(err) {
		throw err;
	}


}

/**
 * Implements the library list command.
 * It populates various library lists with library instances based on the
 * query provided by the site.
 */
export class LibraryListCommand extends Command {

	constructor() {
		super();
		this.categories = {
			official: this._makeCategory('official'),
			verified: this._makeCategory('verified', 'official'),
			featured: this._makeCategory('featured'),
			popular: this._makeCategory('public', 'verified,official'),
			mine: this._makeCategory('mine', undefined, 'name'),
			recent: this._makeCategory('all', undefined, '-date'),
			community: this._makeCategory('all', 'mine', 'official,verified,popularity,name')
		};
	}

	_makeCategory(scope, excludeScope, sort) {
		return { scope, excludeScope, sort };
	}

	/**
	 * @param {object} state The current conversation state.
	 * @param {LibraryListCommandSite} site external services.
	 * @returns {Promise} To run the library list command.
	 */
	run(state, site) {
		let client, settings, sections, config, target;

		let result = Promise.resolve()
			.then(() => site.apiClient())
			.then((_client) => {
				client = _client;
				return site.settings();
			})
			.then((_settings) => {
				settings = _settings;
				return site.sections();
			})
			.then((_sections) => {
				sections = _sections;
				return site.target();
			})
			.then((_target) => {
				target = _target;
				config = this.normalizeConfig(settings, sections);
				return this.fetchLists(site, client, config, target);
			})
			.catch(err => site.error(err));
		return result;
	}

	fetchLists(site, client, config, target) {
		const fetch = this._buildFetchLists(site, client, config, target);
		return this._buildNotifyFetchPromise(site, fetch, config, target);
	}

	_buildFetchLists(site, client, config, target) {
		const fetch = [];
		for (let name in config) {
			const settings = config[name];
			const list = this.fetchList(site, client, name, settings, target);
			fetch.push(list);
		}
		return fetch;
	}

	_buildFetchPromise(site, fetch, target) {
		return Promise.resolve()
			.then(() => Promise.all(fetch))
			.then((result) => {
				return target || result;
			});
	}

	_buildNotifyFetchPromise(site, fetch, config, target) {
		let all = this._buildFetchPromise(site, fetch, target);
		all = site.notifyFetchLists(all, config) || all;
		return all;
	}

	_addResultToTarget(list, name, target) {
		return list.then((libraries) => {
			if (target) {
				target[name] = libraries;
				return target;
			}
			return libraries;
		});
	}

	fetchList(site, client, name, settings, target) {
		let list = client.libraries(settings);
		list = this._addResultToTarget(list, name, target);
		list = site.notifyFetchList(list, name, settings) || list;
		return list;
	}

	_removeUndefined(value) {
		for (let name in value) {
			if (value[name]===undefined) {
				delete value[name];
			}
		}
		return value;
	}

	normalizeConfig(base, settings) {
		const config = {};
		for (let name in settings) {
			config[name] = this._removeUndefined(Object.assign({}, this.categories[name], base, settings[name]));
		}
		return config;
	}
}

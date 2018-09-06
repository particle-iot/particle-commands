import { Command, CommandSite } from './command';
import { convertApiError } from './api';

/**
 */
export class LibraryPublishCommandSite extends CommandSite {

	constructor() {
		super();
	}

	apiClient() {
		throw new Error('apiClient not available');
	}

	/**
	 * Retrieves the co-ordinates of the library to publish.
	 */
	libraryIdent() {
		throw Error('not implemented');
	}

	error(err) {
		throw err;
	}

	/**
	 * Notification that library publishing is starting
	 * @param {Promise} promise   The promise that will publish the library.
	 * @param {string} ident      The library identifier
	 */
	publishingLibrary(promise, ident) {

	}

	/**
	 * Notification that the library publishing has completed.
	 * @param {Library} library the library that was published.
	 */
	publishLibraryComplete(library) {

	}
}

/**
 * Implements the library contribute command.
 */
export class LibraryPublishCommand extends Command {

	/**
	 * @param {object} state The current conversation state.
	 * @param {LibraryPublishCommandSite} site external services.
	 * @returns {Promise} To run the library publish command.
	 */
	run(state, site) {
		let name;
		return Promise.resolve(site.libraryIdent())
			.then(ident => name = ident)
			.then(() => site.apiClient())
			.then((apiClient) => {
				const promise = apiClient.publishLibrary(name)
					.catch(err => {
						throw this.apiError(err);
					});

				const publishPromise = site.publishingLibrary(promise, name) || promise;
				return publishPromise
					.then(library => {
						site.publishLibraryComplete(library);
						return library;
					})
					.catch(err => {
						site.error(err);
					});
			});
	}

	apiError(err) {
		return convertApiError(err);
	}

}


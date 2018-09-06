import { Command, CommandSite } from './command';
import { FileSystemLibraryRepository, FileSystemNamingStrategy } from 'particle-library-manager';

/**
 */
export class LibraryContributeCommandSite extends CommandSite {

	constructor() {
		super();
	}

	apiClient() {
		throw new Error('apiClient not available');
	}

	dryRun() {
		return false;
	}

	libraryDirectory() {
		throw Error('not implemented');
	}

	// validationError(err) - optional method

	error(err) {
		throw err;
	}

	/**
	 * Notification that the library directory is being checked. The library is validated and then loaded.
	 * @param {Promise} promise     The promise to validate the library
	 * @param {string} directory    The directory that contains the library to validate
	 */
	validatingLibrary(promise, directory) {

	}

	/**
	 * Notification that library contribution is starting
	 * @param {Promise} promise   The promise that will contribute the library.
	 * @param {Library} library   The loaded library
	 */
	contributingLibrary(promise, library) {

	}

	/**
	 * Notification that the library has been successfully contributed.
	 * @param {Library} library the library that was contributed.
	 */
	contributeComplete(library) {

	}

}

/**
 * Implements the library contribute command.
 */
export class LibraryContributeCommand extends Command {

	/**
	 * @param {object} state The current conversation state.
	 * @param {LibraryContributeCommandSite} site external services.
	 * @returns {Promise} To run the library contribute command.
	 */
	run(state, site) {
		const events = (event, ...args) => {
			const fn = site[event].bind(site) || (() => {});
			fn(...args);
		};

		const name = '';
		let dryRun = false;
		let contributeDir;
		return Promise.resolve(site.libraryDirectory())
		.then(dir => {
			contributeDir = dir;
			return site.dryRun();
		})
		.then(d => dryRun = d)
		.then(() => site.apiClient())
		.then(client => {
			const repo = new FileSystemLibraryRepository(contributeDir, FileSystemNamingStrategy.DIRECT);
			return repo.contribute(name, client, dryRun, events);
		})
		.catch(err => {
			if (err.validate && site.validationError) {
				site.validationError(err);
			} else {
				site.error(err);
			}
		});
	}

}


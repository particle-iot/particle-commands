import { convertApiError } from './api';
import { CommandSite } from './command';
import { findProject } from './library';



export class LibraryAddCommandSite extends CommandSite {

	apiClient() {
		throw new Error('not implemented');
	}

	projectDir() {
		throw new Error('not implemented');
	}

	libraryIdent() {
		throw new Error('not implemented');
	}

	fetchingLibrary(promise, _name) {
		return promise;
	}

	addedLibrary(_name, _version) {
	}
}


/** Library add **/
export class LibraryAddCommand {

	/**
	 * @param {Object} state Unused
	 * @param {LibraryAddCommandSite} site Provides the parameters for the command.
	 * @returns {Promise} Library add process
	 */
	run(state, site) {
		this.site = site;

		const lib = site.libraryIdent();
		if (lib.version === undefined) {
			lib.version = 'latest';
		}
		const directory = this.site.projectDir();
		return this._loadLibrary(directory, lib);
	}

	async _loadLibrary(directory, lib) {
		await this.ensureProjectExists(directory);
		await this.loadProject();
		const library = await this.fetchLibrary(lib.name, lib.version);
		await this.addLibraryToProject(library);
		return this.saveProject();
	}

	ensureProjectExists(directory) {
		return findProject(directory, true)
			.then((project) => {
				this.properties = project;
				return project;
			});
	}


	createProject() {
		// save a blank project.properties
		return this.properties.save();
	}

	loadProject() {
		return this.properties.load();
	}

	fetchLibrary(name, version) {
		return Promise.resolve(this.site.apiClient())
			.then((apiClient) => {
				return Promise.resolve(this.site.fetchingLibrary(apiClient.library(name, { version }), name, version));
			})
			.catch(err => {
				throw this.apiError(err);
			});
	}

	apiError(err) {
		return convertApiError(err);
	}

	async addLibraryToProject(library) {
		await this.site.addedLibrary(library.name, library.version);
		return this.properties.addDependency(library.name, library.version);
	}

	saveProject() {
		return this.properties.save();
	}
}

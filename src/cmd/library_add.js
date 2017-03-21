
import pipeline from 'when/pipeline';
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

	fetchingLibrary(promise, name) {
		return promise;
	}

	addedLibrary(name, version) {
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
		return pipeline([
			() => this.ensureProjectExists(directory),
			() => this.loadProject(),
			() => this.fetchLibrary(lib.name, lib.version),
			(library) => this.addLibraryToProject(library),
			() => this.saveProject()
		]);
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

	addLibraryToProject(library) {
		return pipeline([
			() => this.site.addedLibrary(library.name, library.version),
			() => this.properties.addDependency(library.name, library.version)
		]);
	}

	saveProject() {
		return this.properties.save();
	}
}

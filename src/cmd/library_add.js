
import ProjectProperties from './project_properties';
import LibraryProperties from './library_properties';
import pipeline from 'when/pipeline';
import {convertApiError} from './api';
import {CommandSite} from './command';



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
		const directory = this.site.projectDir();
		this.libraryProperties = new LibraryProperties(directory);
		this.projectProperties = new ProjectProperties(directory);

		const lib = site.libraryIdent();
		if (lib.version === undefined) {
			lib.version = 'latest';
		}
		return pipeline([
			() => this.ensureProjectExists(directory),
			() => this.loadProject(),
			() => this.fetchLibrary(lib.name, lib.version),
			(library) => this.addLibraryToProject(library),
			() => this.saveProject()
		]);
	}

	ensureProjectExists(directory) {
		return this.projectExist().then(exists => {
			if (!exists) {
				throw new Error(`Project or library not found in directory ${directory}`);
			}
		});
	}

	projectExist() {
		return this.projectProperties.exists()
			.then(exists => {
				this.properties = this.projectProperties;
				if (!exists) {
					this.properties = this.libraryProperties;
					exists = this.libraryProperties.exists();
				}
				return exists;
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

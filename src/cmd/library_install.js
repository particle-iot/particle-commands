import { Command, CommandSite } from './command';
import { CloudLibraryRepository, FileSystemLibraryRepository, FileSystemNamingStrategy } from 'particle-library-manager';
import { extended, legacy } from './project_properties';
import path from 'path';
import LibraryProperties from './library_properties';
import { findProject } from './library';
import { Libraries } from './projects';

/**
 * Specification and base implementation for the site instance expected by
 * the LibraryInstallCommand.
 */
export class LibraryInstallCommandSite extends CommandSite {

	constructor() {
		super();
	}

	apiClient() {
		throw new Error('not implemented');
	}

	// mdm - I'm not sure about having all these methods for accessing simple properties.
	// It might be simpler to have a cmd args object with properties. It depends upon if the
	// property values need to come from the user, e.g. an interactive prompt for all the values.

	isVendored() {
		return false;
	}

	isAdaptersRequired() {
		return false;
	}

	libraryName() {
		throw Error('not implemented');
	}

	/**
	 * The target directory containing the project to install the library into.
	 */
	targetDirectory() {
		throw Error('not implemented');
	}

	error(err) {
		throw err;
	}

	notifyIncorrectLayout(actualLayout, expectedLayout, libName, targetDir) {
		return Promise.resolve();
	}

	notifyCheckingLibrary(libName) {
		return Promise.resolve();
	}

	notifyFetchingLibrary(lib, targetDir) {
		return Promise.resolve();
	}

	notifyInstalledLibrary(lib, targetDir) {
		return Promise.resolve();
	}

}

export function buildAdapters(libDir, libName) {
	const fsrepo = new FileSystemLibraryRepository(libDir, FileSystemNamingStrategy.DIRECT);
	return fsrepo.addAdapters(() => {}, libName, path.join(libDir, 'src'));
}

/**
 * Key differences between vendored and non-vendored install:
 *
 * - vendored libraries
 *   - are installed using only the library name (since they are assumed to be unique within a given project)
 *   - require a project (since they are installed under src/libs
 * - non-vendored libraries
 *   - are installed using  name@version as the directory name
 *   - don't require a project.
 */

/**
 * A strategy factory that determines where to place libraries when vendored in a project.
 * @param {ProjectProperties} project The project to vendor a library into
 * @returns {function} A function that provides the target library directory
 */
function vendoredInstallStrategy(project) {
	return (name, version) => {
		return project.libraryDirectory(true, name);
	};
}

/**
 * A strategy factory that determines where to place libraries when installed to
 * a shared directory.
 * @param {string} baseDir the shared directory where the library should be installed ot
 * @returns {function(*, *=)} A function that provides the target library directory
 */
function nameVersionInstallStrategy(baseDir) {
	return (name, version) => {
		if (!version) {
			throw Error('hey I need a version!');
		}
		// todo - should probably instead instantiate the appropriate library repository
		// so we get reuse and consistency
		return path.join(baseDir, name+'@'+version);
	};
}

/**
 * Implements the library initialization command.
 */
export class LibraryInstallCommand extends Command {

	/**
	 * @param {LibraryInstallCommandSite} site for the `findHomePath`
	 * @returns {Object|string|*|Promise} The location to store libraries centrally on this machine
	 * @private
	 */
	_centralLibrariesDirectory(site) {
		return new Libraries().communityLibrariesFolder();
	}

	/**
	 * @param {object} state The current conversation state.
	 * @param {LibraryInstallCommandSite} site external services.
	 * @returns {Promise} To run the library install command.
	 */
	run(state, site) {
		// the directory containing the target project
		const targetDir = site.targetDirectory();

		const [libName,libVersion] = (site.libraryName()||'').split('@');
		const client = site.apiClient();
		const cloudRepo = new CloudLibraryRepository({ client });
		const context = {};
		const vendored = site.isVendored();
		let properties;
		if (!vendored && !libName) {
			throw Error('Please provide a library name to install');
		}
		const projectMustExist = vendored;  // vendored libraries require a project to install into

		return findProject(targetDir, projectMustExist)
			.then(_properties => {
				properties = _properties;
				return vendored ? vendoredInstallStrategy(properties) : this._centralLibrariesDirectory(site).then(dir => nameVersionInstallStrategy(dir));
			})
			.then(installStrategy => {
				if (libName) {
					return this.installSingleLib(site, cloudRepo, vendored, libName, libVersion, installStrategy, properties, context);
				} else {
					return this.installProjectLibs(site, cloudRepo, vendored, installStrategy, properties, context);
				}
			})
			.catch(err => site.error(err));
	}

	installProjectLibs(site, cloudRepo, vendored, installStrategy, project, context) {
		// read the project
		// todo - validate the project format first so we don't get repeated errors when
		// attempting to vendor libraries from a simple project
		return project.load()
			.then(() => {
				const deps = project.groups.dependencies || {};
				const install = [];
				for (let d in deps) {
					const libName = d;
					const libVersion = deps[d];
					install.push(this.installSingleLib(site, cloudRepo, vendored, libName, libVersion, installStrategy, project, context));
				}
				return Promise.all(install);
			});
	}

	/**
	 * Installs a library
	 * @param {LibraryInstallCommandSite} site  The command site
	 * @param {CloudLibraryRepository} cloudRepo The cloud repo the library is fetched from
	 * @param {boolean} vendored true if the library is being vendored
	 * @param {String} libName  The library name to install
	 * @param {String} libVersion   the library version to install (undefined for latest)
	 * @param {function} libraryTargetStrategy Called with library name and version, used to retrieve the target directory.
	 * @param {ProjectProperties} project The project properties for the project being installed to.
	 *  Only defined when vendored is true.
	 * @param {object} context  The current operation context.
	 * @returns {Promise|Promise.<TResult>} A promise to install the library and dependents.
	 * @private
	 */
	_installLib(site, cloudRepo, vendored, libName, libVersion, libraryTargetStrategy, project, context) {
		context[libName] = libVersion || 'latest';

		return site.notifyCheckingLibrary(libName)
			.then(() => {
				return cloudRepo.fetch(libName, libVersion);
			})
			.then((lib) => {
				const libDir = libraryTargetStrategy(lib.metadata.name, lib.metadata.version);
				return site.notifyFetchingLibrary(lib.metadata, libDir)
					.then(() => lib.copyTo(libDir))
					.then(() => {
						if (site.isAdaptersRequired()) {
							return buildAdapters(libDir, lib.metadata.name);
						}
					})
					.then(() => site.notifyInstalledLibrary(lib.metadata, libDir))
					.then(() => this._installDependents(site, cloudRepo, vendored, libraryTargetStrategy, project, context, libDir));
			});
	}

	/**
	 * Installs the dependencies of a library.
	 * @param {LibraryInstallCommandSite} site  The command site - used to provide notifications of installation progress
	 * @param {CloudLibraryRepository} cloudRepo    The cloud repo used to retrieve libraries
	 * @param {boolean} vendored    true if the library is being installed into the project
	 * @param {function} libraryTargetStrategy  Retrieves the library directory to install to given the library name and version.
	 * @param {ProjectProperties} project The project being installed to.
	 * @param {object} context      The current operation context - used to avoid infinite recursion in the event of cyclic dependencies.
	 * @param {String} libDir       The directory containing the library whose dependences should be installed.
	 * @returns {*|Promise|Promise.<TResult>} returns a promise to install all library dependents
	 * @private
	 */
	_installDependents(site, cloudRepo, vendored, libraryTargetStrategy, project, context, libDir) {
		const libraryProperties = new LibraryProperties(libDir);
		return libraryProperties.load()
			.then(() => {
				const resolve = [];
				const dependencies = libraryProperties.dependencies();
				for (let dependencyName in dependencies) {
					const dependencyVersion = dependencies[dependencyName];
					if (!context[dependencyName]) {
						context[dependencyName] = dependencyVersion;
						resolve.push(this._installLib(site, cloudRepo, vendored, dependencyName, dependencyVersion, libraryTargetStrategy, project, context));
					}
				}
				return Promise.all(resolve);
			});
	}

	/**
	 * Install a single library.
	 * @param {LibraryIntallCommandSite} site          The command site to receive install updates
	 * @param {CloudLibraryRepository} cloudRepo     The cloud repository that is used to retrieve the library.
	 * @param {bool} vendored      true if the library should be vendored.
	 * @param {string} libName       the name of the library to install
	 * @param {string} libVersion    the version of the library to install, or undefined for the latest version.
	 *          (currently unused.)
	 * @param {function(name,version)} installTarget    The function that retrieves the target directory for the library
	 * @param {ProjectProperties}   project       the project to update
	 * @param {object} context  Maintains the context for installing libraries.
     * @returns {Promise} to install the library.
	 */
	installSingleLib(site, cloudRepo, vendored, libName, libVersion, installTarget, project, context) {
		const fetchLayout = project && vendored ? project.projectLayout() : Promise.resolve(legacy);

		return fetchLayout
			.then((layout) => {
				if (vendored && layout!==extended) {
					return site.notifyIncorrectLayout(layout, extended, libName, installTarget(libName, libVersion));
				} else {
					return this._installLib(site, cloudRepo, vendored, libName, libVersion, installTarget, project, context);
				}
			});
	}
}


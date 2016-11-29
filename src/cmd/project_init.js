import {Command, CommandSite} from './command';
const promisify = require('es6-promisify');
import path from 'path';

/**
 * Specification and base implementation for the site instance expected by
 * the ProjectInitCommand.
 */
export class ProjectInitCommandSite extends CommandSite {

	/**
	 * The directory where the project should be initialized.
	 */
	directory() {
		throw Error('not implemented');
	}

	/**
	 * The filesystem to use when creating files and directories.
	 * @returns {*} The filesystem module to use.
	 *
	 * todo - document the functions required
	 * - stat()
	 * - readdir()
	 * - writeFile
	 */
	filesystem() {
		return require('fs');
	}

	/**
	 * Notification that the directory exists, should creation proceed?
	 * @param {String} dir The directory that exists.
	 * The response can be a direct value or a promise. If the promise is falsey then the process is stopped.
	 */
	notifyDirectoryExists(dir) {

	}

	/**
	 * Notification of the entire project creation operation.
	 * @param path      The directory that will contain the project
	 * @param promise   The promise to create the project in the given directory
	 */
	notifyCreatingProject(path, promise) {

	}

	/**
	 * Notification that the command is creating a file or directory.
	 * @param path          The path being created
	 * @param promise       The promise to create the path. The implementation may
	 * extend this promise and return the new extension. This may be undefined also.
	 * @return undefined to use the original promise, or a wrapped version of the promise.
	 */
	notifyCreatingPath(path, promise) {

	}

	notifyProjectNotCreated(directory) {

	}

	notifyProjectCreated(directory) {

	}

}

/**
 * Implements the project initialization command.
 */
export class ProjectInitCommand extends Command {

	/**
	 *
	 * @param {object} state The current conversation state.
	 * @param {ProjectInitCommandSite} site external services.
	 * @returns {Promise} To run the project initialization command.
	 */
	run(state, site) {
		let directory, filesystem;

		return Promise.resolve()
			.then(() => Promise.resolve(site.directory()))
			.then((_directory) => {
				directory = _directory;
				return Promise.resolve(site.filesystem())
			})
			.then((_filesystem) => {
				filesystem = _filesystem;
				return this.canCreateInDirectory(site, filesystem, directory);
			})
			.then(create => {
				if (create) {
					let project = this.createProject(site, filesystem, directory);
					project = site.notifyCreatingProject(directory, project) || project;
					return project.then(() => site.notifyProjectCreated(directory));
				} else {
					return site.notifyProjectNotCreated(directory);
				}
			});
	}

	createDirectoryIfNeeded(fs, directory) {
		const mkdir = promisify(fs.mkdir);
		return mkdir(directory)
			.then(() => true)
			.catch(error => {
				if (error.code !== 'EEXIST') {
					throw error;
				}
				return false;
			});
	}

	createNotifyDirectory(site, fs, directory) {
		return this.createDirectoryIfNeeded(fs, directory)
			.then((created) => {
				if (created) {
					return site.notifyCreatingPath(directory);
				}
			});
	}

	// todo - these file related functions could be factored out since they are not specifically to do with project
	// intiialization, and are reusable across commands that use the file system.
	createFile(fs, path, content) {
		const writeFile = promisify(fs.writeFile);
		return writeFile(path, content);
	}

	createNotifyFile(site, fs, path, content) {
		let create = this.createFile(fs, path, content);
		create = site.notifyCreatingPath(path, create) || create;
		return create;
	}

	createNotifyFileIfNeeded(site, fs, path, content) {
		const stat = promisify(fs.stat);
		return stat(path).catch(error => {
			if (error.code!=='ENOENT') {
				throw error;
			}
			return this.createNotifyFile(site, fs, path, content);
		});
	}

	createProject(site, fs, directory) {
		return this.createNotifyDirectory(site, fs, directory)
			.then(() => this.createNotifyDirectory(site, fs, path.join(directory, 'src')))
			.then(() => this.createNotifyFileIfNeeded(site, fs, path.join(directory, 'project.properties', '')));
	}

	/**
	 * Determines if we can create the project in the specified directory.
	 * @param {Object} fs            The filesystem to use to check for the presense of a directory.
	 * @param {String} directory
	 * @returns {Promise}           resolves to a truthy value to continue creating the project.
	 */
	canCreateInDirectory(site, fs, directory) {
		const stat = promisify(fs.stat);
		return stat(directory).then((stat) => {
			if (!stat.isDirectory()) {
				return false;   // exists but is not a directory
			} else {
				return this._checkDirectoryIsEmpty(site, fs, directory);
			}
		}).catch(err => {
			if (err.code!=='ENOENT') {
				throw err;
			}
			return true;    // can create the project here (or at least attempt to.)
		});
	}

	_checkDirectoryIsEmpty(site, fs, directory) {
		const readdir = promisify(fs.readdir);
		// check if the directory is empty
		return readdir(directory).then(files => {
			if (files.length) {     // there are files
				return site.notifyDirectoryExists(directory);
			} else {
				return true;    // no files, just create the library there
			}
		});
	}
}


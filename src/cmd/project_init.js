import {Command, CommandSite} from './command';
const promisify = require('es6-promisify');

/**
 * Specification and base implementation for the site instance expected by
 * the ProjectInitCommand.
 */
export class ProjectInitCommandSite extends CommandSite {

	directory() {
		throw Error('not implemented');
	}

	/**
	 * The filesystem to use when creating files and directories.
	 * @returns {*} The filesystem module to use.
	 *
	 * todo - document the functions required
	 */
	filesystem() {
		return require('fs');
	}

	/**
	 * Notification that the directory exists, should creation proceed?
	 * @param {String} dir The directory that exists
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
	 * extend this promise and return the new extension.
	 * @return undefined to use the original promise, or a wrapped version of the promise.
	 */
	notifyCreatingPath(path, promise) {

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
				return this.canCreateInDirectory(filesystem, directory);
			})
			.then(create => {
				if (create) {

				}
			});
	}

	/**
	 * Determines if we can create the project in the specified directory.
	 * @param fs            The filesystem to use to check for the presense of a directory.
	 * @param directory
	 * @returns {*}
	 */
	canCreateInDirectory(fs, directory) {
		const stat = promisify(fs.stat);
		return stat.then((stat) => {

		});
	}
}


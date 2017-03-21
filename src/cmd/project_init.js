import { Command, CommandSite } from './command';
import ProjectProperties from './project_properties';
import mkdirp from 'mkdirp';
const promisify = require('es6-promisify');
import path from 'path';
import { validateField } from 'particle-library-manager';
const underscore =  require('underscore');

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
	 * The name of the project to create. Should pass isValidName() in the command.
	 */
	name() {
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
	 * @param {String} path      The directory that will contain the project
	 * @param {Promise} promise   The promise to create the project in the given directory
	 */
	notifyCreatingProject(path, promise) {

	}

	/**
	 * Notification that the command is creating a file or directory.
	 * @param {String} path          The path being created
	 * @param {Promise} promise       The promise to create the path. The implementation may
	 * extend this promise and return the new extension. This may be undefined also.
	 * @return {undefined|Promise} undefined to use the original promise, or a wrapped version of the promise.
	 */
	notifyCreatingPath(path, promise) {
		return promise;
	}

	notifyProjectNotCreated(directory) {

	}

	notifyProjectCreated(directory) {

	}

	error(error) {
		throw error;
	}
}

/**
 * Implements the project initialization command.
 */
export class ProjectInitCommand extends Command {

	static templateFile(name) {
		return path.join(__dirname, 'templates', 'project', name);
	}

	expandTemplate(fs, templateName, data) {
		const readFile = promisify(fs.readFile);
		return readFile(ProjectInitCommand.templateFile(templateName), 'utf-8')
			.then(content => {
				return this.processTemplate(content, data);
			});
	}

	processTemplate(content, data) {
		return underscore.template(content)(data);
	}

	/**
	 *
	 * @param {string} name The name to validate
	 * @returns {object} - key valid indicates if validation passed
	 *                     key errors is an object with pairs of invalid field names and error messages
	 */
	validateName(name) {
		return validateField('name', name);
	}

	/**
	 *
	 * @param {object} state The current conversation state.
	 * @param {ProjectInitCommandSite} site external services.
	 * @returns {Promise} To run the project initialization command.
	 */
	run(state, site) {
		let directory, filesystem, name;

		return Promise.resolve()
			.then(() => Promise.resolve(site.name()))
			.then((_name) => {
				name = _name;
				const validate = this.validateName(name);
				if (!validate.valid) {
					throw new Error('name: '+validate.errors.name);
				}
				return Promise.resolve(site.directory());
			})
			.then((_directory) => {
				directory = _directory;
				if (directory) {
					return Promise.resolve(site.filesystem())
					.then((_filesystem) => {
						filesystem = _filesystem;
						return this.canCreateInDirectory(site, filesystem, directory);
					})
					.then(create => {
						if (create) {
							let project = this.createProject(site, filesystem, directory, name);
							project = site.notifyCreatingProject(directory, project) || project;
							return project.then(() => site.notifyProjectCreated(directory));
						} else {
							return site.notifyProjectNotCreated(directory);
						}
					})
					.catch(error => {
						site.error(error);
					});
				}
			});
	}

	createDirectoryIfNeeded(fs, directory) {
		const mkdir = promisify(mkdirp);
		return mkdir(directory, { fs })
			.then(() => true)
			.catch(error => {
				if (!error.code || error.code !== 'EEXIST') {
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

	createNotifyTemplateIfNeeded(site, fs, targetFile, templateName, data) {
		// assumes the parent directory of the template exists
		const content = this.expandTemplate(fs, templateName, data);
		return this.createNotifyFileIfNeeded(site, fs, targetFile, content);
	}

	// todo - these file related functions could be factored out since they are not specifically to do with project
	// intiialization, and are reusable across commands that use the file system.
	createFile(fs, path, content) {
		const writeFile = promisify(fs.writeFile);
		return Promise.resolve(content)
			.then((content) => writeFile(path, content));
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

	createProject(site, fs, directory, name) {
		const properties = { name };
		const projectFile = path.join(directory, 'project.properties');
		const project = new ProjectProperties(directory, { fs:ProjectProperties.buildFs(fs) });
		return this.createNotifyDirectory(site, fs, directory)
			.then(() => this.createNotifyDirectory(site, fs, path.join(directory, 'src')))
			.then(() => this.createNotifyFileIfNeeded(site, fs, projectFile, ''))
			.then(() => this.createNotifyTemplateIfNeeded(site, fs, path.join(directory, 'README.md'), 'README.md', properties))
			.then(() => this.createNotifyTemplateIfNeeded(site, fs, path.join(directory, 'src', name+'.ino'), 'project.ino', properties))
			.then(() => project.load())
			.then(() => {
				if (project.setField('name', name)) {
					return project.save();
				}
			});
	}

	/**
	 * Determines if we can create the project in the specified directory.
	 * @param {ProjectInitCommandSite} site The interaction site for this command
	 * @param {Object} fs           The filesystem to use to check for the presence of a directory.
	 * @param {String} directory    The directory to check
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
			// directory does not exist
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



import path from 'path';
import os from 'os';
import promisify from 'es6-promisify';

const particle = 'particle';
const libraries = 'libraries';
const projects = 'projects';
const community = 'community';
const mine = 'mine';

export class Projects {
	constructor(fs=require('fs')) {
		this.fsMkdir = promisify(fs.mkdir);
		this.fsStat = promisify(fs.stat);
	}

	mkdir(name) {
		return this.fsMkdir(name)
		.then(() => {
			return true;
		})
		.catch(error => {
			if (error.code==='EEXIST') {
				return false;
			}
			throw error;
		});
	}

	mkdirp(name) {
		return this.fsStat(name)
		.then(stat => {
			if (!stat.isDirectory()) {
				const error = new Error('file already exists');
				error.code = 'EEXIST';
				throw error;
			}
			return false;
		})
		.catch(error => {
			if (error.code==='ENOENT') {
				const parent = path.dirname(name);
				let promise;
				if (parent && parent!=='/' && parent!=='.') {
					promise = this.mkdirp(parent);
				}
				// even simply creating the promise causes them to be executed out of order
				// we can only get the correct order by creating the promise when we are sure
				// the parent folder has been created.
				return promise ? promise.then(() => this.mkdir(name)) : this.mkdir(name);
			}
			throw error;
		});
	}


	userHomeFolder() {
		return os.homedir();
	}

	// todo - documnents folder?

	particleFolder() {
		return path.join(this.userHomeFolder(), particle);
	}

	_librariesCommonFolder() {
		return path.join(this.particleFolder(), libraries);
	}

	communityLibrariesFolder() {
		return path.join(this._librariesCommonFolder(), community);
	}

	myLibrariesFolder() {
		return path.join(this._librariesCommonFolder(), mine);
	}

	_projectsCommonFolder() {
		return path.join(this.particleFolder(), projects);
	}

	communityProjectsFolder() {
		return path.join(this._projectsCommonFolder(), community);
	}

	myProjectsFolder() {
		return path.join(this._projectsCommonFolder(), mine);
	}

	ensureDirectoryExists(directory) {
		return this.mkdirp(directory);
	}
}

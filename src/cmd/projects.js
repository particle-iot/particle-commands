
import path from 'path';
import os from 'os';
import promisify from 'es6-promisify';

const particle = 'particle';
const libraries = 'libraries';
const projects = 'projects';
const community = 'community';

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

	findHomePath(defaultPath = __dirname, fs = require('fs')) {
		const envVars = [
			'home',
			'HOME',
			'HOMEPATH',
			'USERPROFILE'
		];

		for (let i=0;i<envVars.length;i++) {
			const dir = process.env[envVars[i]];
			if (dir && fs.existsSync(dir)) {
				return dir;
			}
		}
		return defaultPath;
	};

	userHomeFolder() {
		return os.homedir();
	}

	windowsDocumentsFolder() {
		const winreg = require('winreg');
		const regKey = winreg({
			hive: winreg.HKCU,                                        // open registry hive HKEY_CURRENT_USER
			key:  '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders' // key containing user folder paths
		});
		let documents;

		// list "Documents" folder path
		regKey.values((err, items) => {
			if (err) {
				console.log('ERROR: '+err);
			} else {
				for (let i=0; i<items.length; i++) {
					if (items[i].name === 'Personal') {
						documents = items[i].value;
					}
				}
			}
		});
		return documents;
	}

	documentsFolder() {
		if (process.platform==='win32') {
			return this.windowsDocumentsFolder() || this.userHomeFolder();
		} else {
			return this.userHomeFolder();
		}
	}

	particleFolder() {
		return path.join(this.documentsFolder(), particle);
	}

	_communityFolder() {
		return path.join(this.particleFolder(), community);
	}

	myLibrariesFolder() {
		return path.join(this.particleFolder(), libraries);
	}

	communityLibrariesFolder() {
		return path.join(this._communityFolder(), libraries);
	}

	myProjectsFolder() {
		return path.join(this.particleFolder(), projects);
	}

	communityProjectsFolder() {
		return path.join(this._communityFolder(), projects);
	}

	ensureDirectoryExists(directory) {
		return this.mkdirp(directory);
	}
}

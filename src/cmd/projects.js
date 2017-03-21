
import path from 'path';
import os from 'os';
import promisify from 'es6-promisify';

const particle = 'Particle';
const libraries = 'libraries';
const projects = 'projects';
const community = 'community';

class SystemFolders {
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
	}

	userHomeFolder() {
		return os.homedir();
	}

	windowsDocumentsFolder() {
		return new Promise((fulfill, reject) => {
			const winreg = require('winreg');
			const regKey = winreg({
				hive: winreg.HKCU,                                        // open registry hive HKEY_CURRENT_USER
				key:  '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders' // key containing user folder paths
			});
			let documents;

			// list "Documents" folder path
			regKey.values((err, items) => {
				if (err) {
//					console.log('ERROR: '+err);
				} else {
					for (let i=0; i<items.length && !documents; i++) {
						if (items[i].name.toLowerCase() === 'personal') {
							documents = items[i].value;
							return fulfill(documents);
						}
					}
				}
			});
		});
	}

	documentsFolder() {
		if (process.platform==='win32') {
			return this.windowsDocumentsFolder()
				.then(documents => {
					return documents || this.userHomeFolder();
				});
		} else {
			return this.userHomeFolder();
		}
	}

	ensureDirectoryExists(directory) {
		return this.mkdirp(directory);
	}
}

export class ParticleFolder extends SystemFolders {
	particleFolder() {
		return this.join(this.documentsFolder(), particle);
	}

	_communityFolder() {
		return this.join(this.particleFolder(), community);
	}

	join(path1, path2) {
		return Promise.resolve(path1)
			.then(path1 => {
				return path.join(path1, path2);
			});
	}
}

export class Libraries extends ParticleFolder {
	myLibrariesFolder() {
		return this.join(this.particleFolder(), libraries);
	}

	communityLibrariesFolder() {
		return this.join(this._communityFolder(), libraries);
	}
}

export class Projects extends ParticleFolder {
	myProjectsFolder() {
		return this.join(this.particleFolder(), projects);
	}

	communityProjectsFolder() {
		return this.join(this._communityFolder(), projects);
	}
}

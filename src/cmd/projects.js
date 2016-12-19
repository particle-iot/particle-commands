
import fs from 'fs';
import path from 'path';
import os from 'os';
import promisify from 'es6-promisify';

const particle = 'particle';
const libraries = 'libraries';
const projects = 'projects';
const community = 'community';
const mine = 'mine';

const fsMkdir = promisify(fs.mkdir);
const fsExists = promisify(fs.exists);

function mkdir(name) {
	return fsMkdir(name)
		.then(() => true)
		.catch(error => {
			if (error.code==='EEXIST')
				return false;
			throw error;
		});
}

function mkdirp(name) {
	return fsExists(name).then(exists => {
		if (!exists) {
			const parent = path.dirname(name);
			const makeit = mkdir(name);
			let promise = makeit;
			if (parent && parent!=='/') {
				promise = mkdirp(parent).then(() => makeit);
			}
			return promise;
		}
	});
}


export class Projects {

	userHomeFolder() {
		return os.homedir();
	}

	// todo - documnents folder?

	particleFolder() {
		return path.join(this.userHomeFolder(), particle);
	}

	librariesFolder() {
		return path.join(this.particleFolder(), libraries);
	}

	communityLibrariesFolder() {
		return path.join(this.librariesFolder(), community);
	}

	myLibrariesFolder() {
		return path.join(this.librariesFolder(), mine);
	}

	projectsFolder() {
		return path.join(this.particleFolder(), projects);
	}

	communityProjectsFolder() {
		return path.join(this.projectsFolder(), community);
	}

	myProjectsFolder() {
		return path.join(this.projectsFolder(), mine);
	}

	ensureDirectoryExists(directory) {
		return mkdirp(directory);
	}

}
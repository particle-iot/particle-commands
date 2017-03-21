import promisify from 'es6-promisify';
import nodeFs from 'fs';
import path from 'path';
const legacy = 'legacy';
const simple = 'simple';
const extended = 'extended';

function buildPromisefs(fs=nodeFs) {
	const promisefs = {};
	[
		'readFile',
		'writeFile',
		'stat'
	].forEach(fn => promisefs[fn] = promisify(fs[fn]));
	return promisefs;
}

export default class ProjectProperties {

	static buildFs(fs=nodeFs) {
		return buildPromisefs(fs);
	}

	constructor(dir, { filename = 'project.properties', fs = buildPromisefs() } = {}) {
		this.dir = dir;
		this.fs = fs;
		this.filename = filename;
		this.groups = {};
		this.fields = {};
	}

	name() {
		return path.join(this.dir, this.filename);
	}

	load() {
		return this.fs.readFile(this.name(), 'utf8')
			.then(data => this.parse(data));
	}

	parse(data) {
		this.fields = data.split('\n')
			.reduce((obj, line) => {
				let [field, value] = line.split('=');
				if (field && value !== undefined) {
					field = field.trim();
					value = value.trim();
					obj[field] = value;
					const groups = field.split('.');
					this.addGroups(this.groups, groups, value);
				}
				return obj;
			}, {});
	}

	addGroups(target, groups, value) {
		const key = groups[0].trim();
		if (key) {
			if (groups.length===1) {
				target[key] = value;
			} else {
				const next = target[key] = (target[key] || {});
				groups.shift();
				this.addGroups(next, groups, value);
			}
		}
	}

	save() {
		const data = this.serialize();
		return this.fs.writeFile(this.name(), data, 'utf8');
	}

	serialize() {
		return Object.keys(this.fields).map(field => {
			return `${field}=${this.fields[field]}`;
		}).join('\n')+'\n';
	}

	exists() {
		const stat = this.fs.stat(this.name());
		return stat.then(stats => {
			return stats.isFile();
		})
		.catch(err => {
			if (err.code!=='ENOENT') {
				throw err;
			}
			return false;
		});
	}

	sourceDirExists() {
		const stat = this.fs.stat(path.join(this.dir, 'src'));
		return stat.then(stats => stats.isDirectory(), () => false);
	}

	projectLayout() {
		return this.exists()
			.then((exists) => {
				if (exists) {
					return this.sourceDirExists()
						.then((exists) => exists ? extended : simple);
				} else {
					return legacy;
				}
			});
	}

	addDependency(name, version) {
		this.fields[this.dependencyField(name)] = version;
	}

	dependencyField(name) {
		return `dependencies.${name}`;
	}

	/**
	 * Determines the location of the library that is installed into this project.
	 * @param {booleabn} vendored   should be true
	 * @param {string} libName the library name
	 * @returns {string} the path where the library can be vendored to
	 */
	libraryDirectory(vendored, libName) {
		return path.join(this.dir, 'lib', libName);
	}

	dependencies() {
		return this.groups.dependencies || {};
	}

	setField(name, value) {
		const prev = this.getField(name);
		this.fields[name] = value;
		return prev!==value;
	}

	getField(name) {
		return this.fields[name];
	}
}


export {
	legacy, simple, extended
};

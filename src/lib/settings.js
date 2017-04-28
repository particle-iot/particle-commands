const path = require('path');
const _ = require('underscore');
const utilities = require('./utilities');
const fs = require('fs');

class Settings {

	constructor({ separateSettings=true, settings=[] }={}) {
		this.settings = separateSettings ? {} : this;   // current configuration settings
		this.profile = null;        // current profile name
		this.profile_json = {};     // parsed contents of profile.json
		this.overrides = {};  // current overrides from the profile config file
		settings.unshift(this.settings);    // add target as first argument
		_.extend.apply(_, settings);
	}

	get(name) {
		return (name===undefined) ? this.settings : this.settings[name];
	}

	set(key, value) {
		return this.override(null, key, value);
	}

	/**
	 * Retrieve a value from the environment
	 * @param {string} varName  The name of the environment variable to retrieve
	 * @param {string} defaultValue The value to return when the environment variable is not defined
	 * @return {string} the value of the environment, or defaultValue if not defined
	 */
	envValue(varName, defaultValue) {
		const value = process.env[varName];
		return (typeof value === 'undefined') ? defaultValue : value;
	}

	/**
	 * Fetches the value of an environment varaible interpreted as a boolean
	 * @param {string} varName       The environment variable name
	 * @param {string} defaultValue     The default boolean value to return when the environment
	 *  variable is not defined ir is not recognized as a boolean
	 * @returns {boolean} The value of the environment variable when defined. defaultValue when not defined, or not
	 *  one of true, TRUE, 1, false, FALSE, 0
	 */
	envValueBoolean(varName, defaultValue) {
		const value = this.envValue(varName);
		if (value === 'true' || value === 'TRUE' || value === '1') {
			return true;
		} else if (value === 'false' || value === 'FALSE' || value === '0') {
			return false;
		} else {
			return defaultValue;
		}
	}

	/**
	 * Determine the user home path from the environment
	 * @returns {string}    The home path of the current user, or
	 *  the directory containing this file if it could not be determined.
	 */
	findHomePath(fs=require('fs')) {
		const envVars = [
			'home',
			'HOME',
			'HOMEPATH',
			'USERPROFILE'
		];

		for (let i=0;i<envVars.length;i++) {
			const dir = this.envValue(envVars[i]);
			if (dir && fs.existsSync(dir)) {
				return dir;
			}
		}
		return __dirname;
	}

	/**
	 * Ensures that the particle folder in the home directory exists.
	 * @returns {string}    The location of the particle folder.
	 */
	ensureFolder() {
		const particleDir = path.join(this.findHomePath(), '.particle');
		if (!fs.existsSync(particleDir)) {
			fs.mkdirSync(particleDir);
		}
		return particleDir;
	}

	/**
	 * Determine the location of a given profile configuratino file
	 * @param {string} profile      The name of the profile
	 * @returns {string} the path of the overrides file
	 */
	findOverridesFile(profile) {
		profile = this.defaultProfile(profile);
		const particleDir = this.ensureFolder();
		return path.join(particleDir, profile + '.config.json');
	}

	defaultProfile(profile) {
		return profile || this.profile || 'particle';
	}

	loadOverrides(profile) {
		profile = this.defaultProfile(profile);

		const filename = this.findOverridesFile(profile);
		try {
			if (fs.existsSync(filename)) {
				this.overrides = JSON.parse(fs.readFileSync(filename));
				// need to do an in-situ extend since external clients may have already obtained the settings object
				// this.settings = extend(this.settings, this.overrides);
				_.extend(this.settings, this.overrides);
			}
		} catch (ex) {
			console.error('There was an error reading ' + filename + ': ', ex);
		}
		return this;
	}

	/**
	 * ?? Reads the default profile
	 */
	whichProfile() {
		this.profile = 'particle';
		this.readProfileData();
	}

	/**
	 * in another file in our user dir, we store a profile name that switches between setting override files
	 * @param {string} profileName  The name of the profile to switch to
	 */
	switchProfile(profileName) {
		this.profile_json.name = profileName;
		this.saveProfileData();
	}

	/**
	 * Reads "profile.json" and saves its content to profile_json
	 * @return {undefined} nothing but keep the linter happy
	 */
	readProfileData(fs=require('fs')) {
		const particleDir = this.ensureFolder();
		const proFile = path.join(particleDir, 'profile.json');      //proFile, get it?
		if (fs.existsSync(proFile)) {
			try {
				const data = JSON.parse(fs.readFileSync(proFile));
				this.profile = (data) ? data.name : 'particle';
				this.profile_json = data;
			} catch (err) {
				throw new Error('Error parsing file '+proFile+': '+err);
			}
		} else {
			this.profile = 'particle';
			this.profile_json = {};
		}
	}

	/**
	 * Saves profile.json
	 */
	saveProfileData(fs=require('fs')) {
		const particleDir = this.ensureFolder();
		const proFile = path.join(particleDir, 'profile.json');      //proFile, get it?
		fs.writeFileSync(proFile, JSON.stringify(this.profile_json, null, 2), { mode: '600' });
	}


	// this is here instead of utilities to prevent a require-loop
	// when files that utilties requires need settings
	matchKey(needle, obj, caseInsensitive) {
		needle = (caseInsensitive) ? needle.toLowerCase() : needle;
		for (let key in obj) {
			const keyCopy = (caseInsensitive) ? key.toLowerCase() : key;
			if (keyCopy === needle) {
				return key; 				//return the original
			}
		}
		return null;
	}


	override(profile, key, value) {
		if (!this.overrides) {
			this.overrides = {};
		}

		if (this.settings[key]===undefined) {
			// find any key that matches our key, regardless of case
			const realKey = this.matchKey(key, this.settings, true);
			if (realKey) {
				//console.log("Using the setting \"" + realKey + "\" instead ");
				key = realKey;
			}
		}

		if (value===undefined) {
			delete this.settings[key];
			delete this.overrides[key];
		} else {
			//store the new value (redundant)
			this.settings[key] = value;

			//store that in overrides
			this.overrides[key] = value;
		}
		//make sure our overrides are in sync
		_.extend(this.settings, this.overrides);

		const filename = this.findOverridesFile(profile);
		try {
			fs.writeFileSync(filename, JSON.stringify(this.overrides, null, 2), { mode: '600' });
		} catch (ex) {
			console.error('There was an error writing ' + filename + ': ', ex);
		}
	}

	transitionSparkProfiles(fs=require('fs'), notifyTranslate) {
		const sparkDir = path.join(this.findHomePath(), '.spark');
		const particleDir = path.join(this.findHomePath(), '.particle');
		if (fs.existsSync(sparkDir) && !fs.existsSync(particleDir)) {
			fs.mkdirSync(particleDir);

			if (notifyTranslate) {
				notifyTranslate(sparkDir, particleDir);
			}

			const files = fs.readdirSync(sparkDir);
			files.forEach((filename) => {
				const data = fs.readFileSync(path.join(sparkDir, filename));
				let jsonData;
				try {
					jsonData = JSON.parse(data);
				} catch (ex) {
					// invalid JSON, don't transition
					return;
				}

				if (filename === 'profile.json') {
					if (jsonData.name === 'spark') {
						jsonData.name = 'particle';
					}
				}

				if (filename === 'spark.config.json') {
					filename = 'particle.config.json';
				}

				if (jsonData.apiUrl && jsonData.apiUrl.indexOf('.spark.io') > 0) {
					jsonData.apiUrl = jsonData.apiUrl.replace('.spark.io', '.particle.io');
				}

				const jsonString = JSON.stringify(jsonData, null, 2);
				fs.writeFileSync(path.join(particleDir, filename), jsonString, { mode: '600' });
			});
		}
	}

	listConfigs(particleDir = this.ensureFolder()) {
		const files = utilities.globList(null, [
			path.join(particleDir, '*.config.json')
		]);

		return files.map(item => {
			const filename = path.basename(item);
			//strip the extension
			const name = filename.replace('.config.json', '');
			return name;
		});
	}

	/**
	 * Retrieves a function that can retrieve or set a value.
	 * @param {string} key       The key of the setting to fetch/update
	 * @returns {function(newValue)}   A function that fetches the current value, or updates if an argument
	 * is defined.
	 */
	fetchUpdate(key) {
		function fetchUpdateKey(key, value) {
			if (value!==undefined) {
				this.set(key, value);
				return value;
			} else {
				return this.get(key);
			}
		}
		return fetchUpdateKey.bind(this, key);
	}
}

const defaultSettings = {
	apiUrl: 'https://api.particle.io',
	buildUrl: 'https://build.particle.io',
	access_token: null,

	notSourceExtensions: [
		'.ds_store',
		'.jpg',
		'.gif',
		'.png',
		'.include',
		'.ignore',
		'.ds_store',
		'.git',
		'.bin'
	],

	dirIncludeFilename: 'particle.include',
	dirExcludeFilename: 'particle.ignore',

	knownApps: {
		'deep_update_2014_06': true,
		'cc3000': true,
		'cc3000_1_14': true,
		'tinker': true,
		'voodoo': true
	},
	knownPlatforms: {
		0: 'Core',
		6: 'Photon',
		8: 'P1',
		10: 'Electron',
		88: 'Duo',
		103: 'Bluz'
	},
	updates: {
		'2b04:d006': {
			systemFirmwareOne: 'system-part1-0.6.1-photon.bin',
			systemFirmwareTwo: 'system-part2-0.6.1-photon.bin'
		},
		'2b04:d008': {
			systemFirmwareOne: 'system-part1-0.6.1-p1.bin',
			systemFirmwareTwo: 'system-part2-0.6.1-p1.bin'
		},
		'2b04:d00a': {
			// The bin files MUST be in this order to be flashed to the correct memory locations
			systemFirmwareOne:   'system-part2-0.6.1-electron.bin',
			systemFirmwareTwo:   'system-part3-0.6.1-electron.bin',
			systemFirmwareThree: 'system-part1-0.6.1-electron.bin'
		}
	}
};

function buildSettings(separateSettings, initialSettings, skipLoadProfile) {
	const settings = new Settings({ separateSettings, settings:[defaultSettings, initialSettings] });
	if (!skipLoadProfile) {
		settings.transitionSparkProfiles();
		settings.whichProfile();
		settings.loadOverrides();
	}
	return settings;
}


export {
	buildSettings,
	defaultSettings,
	Settings
};

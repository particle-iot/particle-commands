
class Settings {

	constructor() {
		this.profile = null;        // current profile name
		this.profile_json = null;   // parsed contents of profile.json
		this.settings = {};   // current configuration settings
		this.overrides = {};  // current overrides from the profile config file
	}

	/**
	 * retrieve a value from the environment
	 * @param {string} varName  The name of the environment variable to retrieve
	 * @param {string} defaultValue The value to return when the environment variable is not defined
	 */
	envValue(varName, defaultValue) {
		var value = process.env[varName];
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
		const value = envValue(varName);
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
	 * @returns {*}
	 */
	findOverridesFile(profile) {
		profile = this.defaultProfile(profile);
		const particleDir = this.ensureFolder();
		return path.join(particleDir, profile + '.config.json');
	};

	defaultProfile(profile) {
		return profile || this.profile || 'particle';
	}

	loadOverrides(profile) {
		profile = this.defaultProfile(profile);

		try {
			const filename = this.findOverridesFile(profile);
			if (fs.existsSync(filename)) {
				this.overrides = JSON.parse(fs.readFileSync(filename));
				// need to do an in-situ extend since external clients may have already obtained the settings object
				// this.settings = extend(this.settings, this.overrides);
				_.extend(this.settings, this.overrides);
			}
		} catch (ex) {
			console.error('There was an error reading ' + filename + ': ', ex);
		}
		return settings;
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
	 */
	switchProfile(profileName) {
		if (!this.profile_json) {
			this.profile_json = {};
		}

		this.profile_json.name = profileName;
		this.saveProfileData();
	};

	/**
	 * Reads "profile.json" and saves its content to profile_json
	 * @return {undefined} nothing but keep the linter happy
	 */
	readProfileData(fs=require('fs')) {
		const particleDir = this.ensureFolder();
		const proFile = path.join(particleDir, 'profile.json');      //proFile, get it?
		if (fs.existsSync(proFile)) {
			try {
				var data = JSON.parse(fs.readFileSync(proFile));
				this.profile = (data) ? data.name : 'particle';
				this.profile_json = data;
			} catch (err) {
				throw new Error('Error parsing file '+proFile+': '+err);
			}
		} else {
			this.profile = 'particle';
			this.profile_json = {};
		}
	};

	/**
	 * Saves profile.json
	 */
	saveProfileData(fs=require('fs')) {
		var particleDir = this.ensureFolder();
		var proFile = path.join(particleDir, 'profile.json');      //proFile, get it?
		fs.writeFileSync(proFile, JSON.stringify(this.profile_json, null, 2), { mode: '600' });
	};


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

		if (!this.settings[key]) {
			// find any key that matches our key, regardless of case
			var realKey = matchKey(key, this.settings, true);
			if (realKey) {
				//console.log("Using the setting \"" + realKey + "\" instead ");
				key = realKey;
			}
		}

		//store the new value (redundant)
		this.settings[key] = value;

		//store that in overrides
		this.overrides[key] = value;

		//make sure our overrides are in sync
		this.settings = extend(this.settings, this.overrides);

		try {
			var filename = this.findOverridesFile(profile);
			fs.writeFileSync(filename, JSON.stringify(this.overrides, null, 2), { mode: '600' });
		} catch (ex) {
			console.error('There was an error writing ' + filename + ': ', ex);
		}
	};

	transitionSparkProfiles(fs=require('fs')) {
		const sparkDir = path.join(this.findHomePath(), '.spark');
		const particleDir = path.join(this.findHomePath(), '.particle');
		if (fs.existsSync(sparkDir) && !fs.existsSync(particleDir)) {
			fs.mkdirSync(particleDir);

			console.log();
			console.log(chalk.yellow('!!!'), 'I detected a Spark profile directory, and will now migrate your settings.');
			console.log(chalk.yellow('!!!'), 'This will only happen once, since you previously used our Spark-CLI tools.');
			console.log();

			var files = fs.readdirSync(sparkDir);
			files.forEach(function (filename) {
				var data = fs.readFileSync(path.join(sparkDir, filename));
				var jsonData;
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

				data = JSON.stringify(jsonData, null, 2);
				fs.writeFileSync(path.join(particleDir, filename), data, { mode: '600' });
			});
		}
	};
}

export {
	Settings
}

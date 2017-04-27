const glob = require('glob');

function globList(basepath, arr) {
	var line, found, files = [];
	for (var i=0;i<arr.length;i++) {
		line = arr[i];
		if (basepath) {
			line = path.join(basepath, line);
		}
		found = glob.sync(line, { nodir: true });

		if (found && (found.length > 0)) {
			files = files.concat(found);
		}
	}
	return files;
}

export {
	globList
}



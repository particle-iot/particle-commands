
import path from 'path';
import { resourcesDir } from 'particle-library-manager';
import LibraryProperties from './library_properties';
import ProjectProperties from './project_properties';

export function libraryTestResources() {
	return path.join(resourcesDir(), 'libraries');
}

export function findProject(directory, mustExist=false) {
	const libraryProperties = new LibraryProperties(directory);
	const projectProperties = new ProjectProperties(directory);

	return projectProperties.exists()
		.then(exists => {
			if (exists) {
				return projectProperties;
			} else {
				return libraryProperties.exists()
				.then(exists => {
					if (!exists && mustExist) {
						throw new Error(`Project or library not found in directory ${directory}`);
					}
					return exists ? libraryProperties : null;
				});
			}
		});

}


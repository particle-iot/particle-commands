
import path from 'path';
import {resourcesDir} from 'particle-library-manager';

export function libraryTestResources() {
	return path.join(resourcesDir(), 'libraries');
}


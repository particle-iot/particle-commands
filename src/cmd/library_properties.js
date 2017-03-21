import ProjectProperties from './project_properties';

export { legacy, simple, extended } from './project_properties';

export default class LibraryProperties extends ProjectProperties {
	constructor(dir, { filename='library.properties' } = {}) {
		super(dir, { filename });
	}
}

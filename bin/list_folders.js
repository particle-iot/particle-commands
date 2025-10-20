import { Projects, Libraries } from '../src/cmd/Projects';

const projects = new Projects();
const libraries = new Libraries();

libraries.myLibrariesFolder().then((path) => {
	// eslint-disable-next-line no-console
	console.log('my libraries:', path);
});
projects.myProjectsFolder().then((path) => {
	// eslint-disable-next-line no-console
	console.log('my projects:', path);
});

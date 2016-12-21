
import {Projects, Libraries} from '../src/cmd/Projects';


const projects = new Projects();
const libraries = new Libraries();


libraries.myLibrariesFolder().then(path => {
	console.log('my libraries:', path);
});
projects.myProjectsFolder().then(path => {
	console.log('my projects:', path);
});
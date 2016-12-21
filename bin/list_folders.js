
import {Projects} from '../src/cmd/Projects';


const projects = new Projects();


projects.myLibrariesFolder().then(path => {
	console.log('my libraries:', path);
});
projects.myProjectsFolder().then(path => {
	console.log('my projects:', path);
});
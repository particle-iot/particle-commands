
import {Projects} from '../src/cmd/Projects';


const projects = new Projects();

console.log('my libraries:', projects.myLibrariesFolder());
console.log('my libraries:', projects.myProjectsFolder());
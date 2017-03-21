import path from 'path';
import { expect, sinon } from '../test-setup';
import { ProjectInitCommand } from '../../src/cmd/project_init';
import { ProjectInitCommandSite } from '../../src/cmd/project_init';
import ProjectProperties from '../../src/cmd/project_properties';
import underscore from 'underscore';
const fs = require('fs');
const mockfs = require('mock-fs');

describe('project_init', () => {

	function addFile(target, filename) {
		const content = fs.readFileSync(filename, 'utf-8');
		target[filename] = content;
	}

	beforeEach(() => {
		const fs = {};
		addFile(fs, ProjectInitCommand.templateFile('README.md'));
		addFile(fs, ProjectInitCommand.templateFile('project.ino'));
		mockfs(fs);
	});

	afterEach(() => {
		return mockfs.restore();
	});

	describe('run', () => {
		function createProject({ directory, name, allowDirectoryCreate }) {
			const cmd = new ProjectInitCommand();
			const site = new ProjectInitCommandSite();
			site.notifyProjectNotCreated = sinon.stub();
			site.directory = sinon.stub().resolves(directory);
			site.name = sinon.stub().resolves(name);
			if (allowDirectoryCreate!==undefined) {
				site.notifyDirectoryExists = () => allowDirectoryCreate;
			}
			return cmd.run({}, site).then(() => site);
		}

		function expectTemplate(targetFile, templateName, properties) {
			const templateFile = ProjectInitCommand.templateFile(templateName);
			const expectedContent = underscore.template(fs.readFileSync(templateFile, 'utf-8'))(properties);
			const actualContent = fs.readFileSync(targetFile, 'utf-8');
			expect(actualContent).to.equal(expectedContent);
		}

		function expectProject(directory, properties) {
			expect(fs.existsSync(directory), 'expected project directory to exist').to.be.true;
			expect(fs.existsSync(path.join(directory, 'src')), 'expected src directory to exist').to.be.true;
			expect(fs.existsSync(path.join(directory, 'project.properties')), 'expected project.properties to exist').to.be.true;
			expectTemplate(path.join(directory, 'README.md'), 'README.md', properties);
			expectTemplate(path.join(directory, 'src', properties.name+'.ino'), 'project.ino', properties);

			const project = new ProjectProperties(directory, { fs:ProjectProperties.buildFs(fs) });
			return project.load()
				.then(() => {
					for (let propName in properties) {
						expect(project.getField(propName)).to.equal(properties[propName]);
					}
					return project;
				});
		}

		function expectCreateProject({ directory, allowDirectoryCreate, name }) {
			return createProject({ directory, allowDirectoryCreate, name })
				.then((site) => {
					return expectProject(directory, { name });
				});
		}

		it('creates the project when the directory does not exist', () => {
			return expectCreateProject({ directory:'dir', name:'name1' });
		});

		it('creates the project when the directory exists and is empty', () => {
			fs.mkdirSync('dir2');
			return expectCreateProject({ directory:'dir2', name:'name2' });
		});

		it('creates the project when the directory exists and is not empty and the site returns true', () => {
			fs.mkdirSync('dir4');
			fs.writeFileSync('dir4/file', 'hi');
			return expectCreateProject({ directory:'dir4', allowDirectoryCreate:true, name:'name4' });
		});

		it('does not create the project when the directory exists, contains files and the site returns false', () => {
			fs.mkdirSync('dir3');
			fs.writeFileSync('dir3/file', 'hi');
			return createProject({ directory:'dir3', allowDirectoryCreate:false, name:'name3' })
				.then((site) => {
					expect(site.notifyProjectNotCreated).to.have.been.calledWith('dir3');
					expect(fs.existsSync(path.join('dir3', 'project.properties')), 'expected project.properties to not exist').to.be.false;
				});
		});

		it('fails with a validation error when the name is not valid', () => {
			return createProject({ directory:'dir5', name:'$$invalid$$' })
				.then(() => {
					throw Error('expected exception');
				})
				.catch(error => {
					expect(error.message).to.contain('name: must only contain letters, numbers');
				});
		});

		it('preserves existing fields within project.properties', () => {
			fs.mkdirSync('dir');
			fs.writeFileSync(path.join('dir','project.properties'), 'wookie_meat_can_be=chewy');
			return createProject({ directory:'dir', name:'badass', allowDirectoryCreate:true })
				.then(() => expectProject('dir', { name:'badass' }))
				.then((project) => {
					expect(project.getField('wookie_meat_can_be')).to.equal('chewy');
				});
		});

		// todo - preserve comments and field order
	});
});

import path from 'path';
import {expect, sinon} from '../test-setup';
import {ProjectInitCommand} from '../../src/cmd/project_init';
import {ProjectInitCommandSite} from '../../src/cmd/project_init';
const fs = require('fs');
const mockfs = require('mock-fs');


describe('project_init', () => {

	beforeEach(() => {
		mockfs({});
	});

	afterEach(() => {
		return mockfs.restore();
	});

	describe('run', () => {
		function createProject(directory, allowDirectoryCreate) {
			const cmd = new ProjectInitCommand();
			const site = new ProjectInitCommandSite();
			site.notifyProjectNotCreated = sinon.stub();
			site.directory = () => directory;
			if (allowDirectoryCreate!==undefined) {
				site.notifyDirectoryExists = () => allowDirectoryCreate;
			}
			return cmd.run({}, site).then(() => site);
		}

		function expectProject(directory) {
			expect(fs.existsSync(directory), 'expected project directory to exist').to.be.true;
			expect(fs.existsSync(path.join(directory, 'src')), 'expected src directory to exist').to.be.true;
			expect(fs.existsSync(path.join(directory, 'project.properties')), 'expected project.properties to exist').to.be.true;
		}

		function expectCreateProject(directory, allowDirectoryCreate) {
			return createProject(directory, allowDirectoryCreate)
				.then((site) => {
					expectProject(directory);
				});
		}

		it('creates the project when the directory does not exist', () => {
			return expectCreateProject('dir');
		});

		it('creates the project when the directory exists and is empty', () => {
			fs.mkdirSync('dir2');
			return expectCreateProject('dir2');
		});

		it('creates the project when the directory exists and is not empty and the site returns true', () => {
			fs.mkdirSync('dir4');
			fs.writeFileSync('dir4/file', 'hi');
			return expectCreateProject('dir4', true);
		});

		it('does not create the project when the directory exists, contains files and the site returns false', () => {
			fs.mkdirSync('dir3');
			fs.writeFileSync('dir3/file', 'hi');
			return createProject('dir3', false)
				.then((site) => {
					expect(site.notifyProjectNotCreated).to.have.been.calledWith('dir3');
					expect(fs.existsSync(path.join('dir3', 'project.properties')), 'expected project.properties to not exist').to.be.false;
				});
		});

		it('fails with an error when the parent directory does not exist', () => {
			return createProject('dir1/dir2')
				.then(() => {
					throw Error('expected exception');
				})
				.catch(error => {
					expect(error).has.property('code').equal('ENOENT');
				});
		});
	});
});
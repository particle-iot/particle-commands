import { expect, sinon } from '../test-setup';
import { Projects } from '../../src/cmd/projects';
import { Libraries } from '../../src/cmd/projects';
const fs = require('fs');
const mockfs = require('mock-fs');
import path from 'path';

describe('projects', () => {

	beforeEach(() => {
		mockfs({});
	});

	afterEach(() => {
		return mockfs.restore();
	});

	let projects;
	let libraries;
	const home = '/home';
	beforeEach(() => {
		projects = new Projects();
		libraries = new Libraries();
		libraries.documentsFolder = sinon.stub().returns(home);
		projects.documentsFolder = sinon.stub().returns(home);
	});

	it('can retrieve my projects common folder', () => {
		return expect(projects.myProjectsFolder()).eventually.equals(path.join(home, 'Particle', 'projects'));
	});

	it('can retrieve community projects common folder', () => {
		return expect(projects.communityProjectsFolder()).eventually.equals(path.join(home, 'Particle', 'community', 'projects'));
	});

	it('can retrieve my libraries common folder', () => {
		return expect(libraries.myLibrariesFolder()).eventually.equals(path.join(home, 'Particle', 'libraries'));
	});

	it('can retrieve community libraries common folder', () => {
		return expect(libraries.communityLibrariesFolder()).eventually.equals(path.join(home, 'Particle', 'community', 'libraries'));
	});

	it('can create a nested folder', () => {
		const dir = 'one/two/three';
		return projects.ensureDirectoryExists(dir)
			.then(() => {
				const stat = fs.statSync(dir);
				expect(stat.isDirectory()).to.be.equal(true);
			});
	});

});

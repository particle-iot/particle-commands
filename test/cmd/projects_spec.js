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
		expect(projects.myProjectsFolder()).eventually.equals(path.join(home, 'particle', 'projects'));
	});

	it('can retrieve community projects common folder', () => {
		expect(projects.communityProjectsFolder()).eventually.equals(path.join(home, 'particle', 'community', 'projects'));
	});

	it('can retrieve my libraries common folder', () => {
		expect(libraries.myLibrariesFolder()).eventually.equals(path.join(home, 'particle', 'libraries'));
	});

	it('can retrieve community libraries common folder', () => {
		expect(libraries.communityLibrariesFolder()).eventually.equals(path.join(home, 'particle', 'community', 'libraries'));
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

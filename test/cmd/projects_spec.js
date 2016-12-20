import {expect, sinon} from '../test-setup';
import {Projects} from '../../src/cmd/projects';
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

	let sut;
	const home = '/home';
	beforeEach(() => {
		sut = new Projects();
		sut.userHomeFolder = sinon.stub().returns(home);
	});

	it('can retrieve my projects common folder', () => {
		expect(sut.myProjectsFolder()).equals(path.join(home, 'particle', 'projects', 'mine'));
	});

	it('can retrieve community projects common folder', () => {
		expect(sut.communityProjectsFolder()).equals(path.join(home, 'particle', 'projects', 'community'));
	});

	it('can retrieve my libraries common folder', () => {
		expect(sut.myLibrariesFolder()).equals(path.join(home, 'particle', 'libraries', 'mine'));
	});

	it('can retrieve community libraries common folder', () => {
		expect(sut.communityLibrariesFolder()).equals(path.join(home, 'particle', 'libraries', 'community'));
	});

	it('can create a nested folder', () => {
		const dir = 'one/two/three';
		return sut.ensureDirectoryExists(dir)
			.then(() => {
				const stat = fs.statSync(dir);
				expect(stat.isDirectory()).to.be.equal(true);
			});
	})

});
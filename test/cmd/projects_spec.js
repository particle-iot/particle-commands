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
		expect(sut.myProjectsFolder()).equals(path.join(home, 'particle', 'projects'));
	});

	it('can retrieve community projects common folder', () => {
		expect(sut.projectsFolder()).equals(path.join(home, 'particle', 'projects', 'community'));
	});

	it('can retrieve my libraries common folder', () => {
		expect(sut.myLibrariesFolder()).equals(path.join(home, 'particle', 'libraries'));
	});

	it('can retrieve community libraries common folder', () => {
		expect(sut.librariesFolder()).equals(path.join(home, 'particle', 'libraries', 'community'));
	});


});

import { expect, sinon } from '../test-setup';
import { LibraryInstallCommand, LibraryInstallCommandSite } from '../../src/cmd/library_install';
import { legacy } from '../../src/cmd/project_properties';

describe('library install', () => {

	describe('installSingleLib', () => {
		it('calls site.notifyIncorrectLayout if the project is not an extended project and the installation is vendored', () => {
			const sut = new LibraryInstallCommand();
			sut._installLib = sinon.stub();
			const site = { notifyIncorrectLayout: sinon.stub() };
			const repo = {};
			const vendored = true;
			const libName = undefined;
			const libVersion = undefined;
			const installTarget = (name,version) => name+'+'+version;
			const project = { projectLayout: sinon.stub().resolves(legacy) };
			const promise = sut.installSingleLib(site, repo, vendored, libName, libVersion, installTarget, project, context);
			return promise.then(() => {
				expect(site.notifyIncorrectLayout).to.have.been.calledOnce;
				expect(sut._installLib).to.have.not.been.called;
			});
		});

		it('non-vendored install always installs', () => {
			const sut = new LibraryInstallCommand();
			sut._installLib = sinon.stub();
			const site = {};
			const repo = {};
			const vendored = false;
			const libName = undefined;
			const libVersion = undefined;
			const installTarget = (name,version) => name+'+'+version;
			const project = undefined;
			const promise = sut.installSingleLib(site, repo, vendored, libName, libVersion, installTarget, project, context);
			return promise.then(() => {
				expect(sut._installLib).to.have.been.calledOnce;
			});
		});
	});

	describe('_installDependents', () => {

	});
});

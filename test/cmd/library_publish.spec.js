
import { expect, sinon } from '../test-setup';
import { LibraryPublishCommand, LibraryPublishCommandSite } from '../../src/cmd/library_publish';

describe('LibraryPublishCommand', () => {
	it('handles api errors', () => {
		const sut = new LibraryPublishCommand();
		const apiError = new Error();

		const convertedError = sut.apiError(apiError);

		expect(convertedError).to.be.ok;
	});

	it('converts an API error when the client fails to publish a library', () => {
		const sut = new LibraryPublishCommand();
		const ident = 'mylib';
		const client = {
			publishLibrary: sinon.stub().rejects(new Error('API error'))
		};
		const site = {
			apiClient: sinon.stub().returns(client),
			libraryIdent: () => ident,
			publishingLibrary: sinon.stub(),
			publishLibraryComplete: sinon.stub(),
			error: (error) => {
				throw error;
			}
		};

		const execute = () => sut.run({user: {id: 'foo'}, api: {key: 'bar'}}, site);

		const verify = () => {
			throw new Error('expected rejection');
		};
		const verifyReject = (error) => {
			expect(error).to.match(/API error/);
			expect(site.publishingLibrary).to.be.calledOnce;
			expect(site.publishingLibrary.firstCall.args[0]).to.be.ok;
			expect(site.publishingLibrary.firstCall.args[1]).to.equal(ident);
			expect(site.publishLibraryComplete).to.be.not.called;
		};

		return execute().then(verify, verifyReject);
	});

	it('publishes a library from the API', () => {
		const sut = new LibraryPublishCommand();
		const ident = 'mylib';
		const library = { name:ident };
		const client = {
			publishLibrary: sinon.stub().resolves(library)
		};
		const site = {
			apiClient: sinon.stub().returns(client),
			libraryIdent: sinon.stub().returns(ident),
			publishingLibrary: sinon.stub().returnsArg(0),
			publishLibraryComplete: sinon.stub()
		};

		const execute = () => sut.run({}, site);

		const verify = (result) => {
			expect(result).to.equal(library);
			expect(site.publishLibraryComplete).to.be.calledOnce;
			expect(site.publishLibraryComplete.firstCall.args[0]).to.be.eql(library);
			expect(site.publishingLibrary).to.be.calledOnce;
			expect(site.publishingLibrary.firstCall.args[0]).to.be.ok;
			expect(site.publishingLibrary.firstCall.args[1]).to.be.equal(ident);
		};

		return execute().then(verify);
	});
});

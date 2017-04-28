import { expect, sinon } from '../test-setup';

import { track, flush, test } from '../../src/lib/analytics';
const CommandContext = test.CommandContext;

const SegmentKey = 'DFhKeLxnEmFVs3ejUDFUj5UH4Vv7SvUO';

describe('analytics', () => {
	const tool = { name: 'cli', version: '1.2.3' };
	const api = { key: 'apikey' };
	const auth = 'blahblah';

	describe('context object', () => {
		function commandContext() {
			const sut = new CommandContext();
			sut.trackingUser = () => Promise.resolve({ id:'abcd', email:'someone@example.com' });
			return sut.buildContext({tool, api, auth});
		}

		it('has user.id', () => {
			return expect(commandContext()).to.eventually.have.property('user').to.have.property('id').eql('abcd');
		});

		it('has user.email', () => {
			return expect(commandContext()).to.eventually.have.property('user').to.have.property('email').eql('someone@example.com');
		});

		it('has api.key', () => {
			return expect(commandContext()).to.eventually.have.property('api').to.have.property('key').to.be.ok;
		});

		it('has tool.name', () => {
			return expect(commandContext()).to.eventually.have.property('tool').to.have.property('name').to.eql('cli');
		});
	});

	describe('identifyUser', () => {
		it('rejects when api is not ready', () => {
			const sut = new CommandContext();
			const api = { ready: sinon.stub().returns(false) };
			return expect(sut.identifyUser(api)).to.eventually.be.rejected;
		});

		it('resolves with the user when ready', () => {
			const sut = new CommandContext();
			const user = { id:'123' };
			const api = { ready: sinon.stub().returns(true), trackingIdentity: sinon.stub().resolves(user) };
			return expect(sut.identifyUser(api)).to.eventually.eql(user);
		});
	});

	describe('isIdentity', () => {
		const isIdentity = new CommandContext().isIdentity;

		it('returns true when id and email are present', () => {
			expect(isIdentity({ id:'123', email:'email' })).to.be.true;
		});

		it('returns false if any property is missing', () => {
			expect(isIdentity({ id:'123' })).to.be.false;
			expect(isIdentity({ email:'123' })).to.be.false;
		});

		it('returns false for a null reference', () => {
			expect(isIdentity(null)).to.be.false;
		});
	});

	describe('trackUser', () => {
		const user = { id: '123', email: 'biffa@viz.co.uk' };

		it('resolves the existing identity when already present in settings', () => {
			const sut = new CommandContext();
			sut.identifyUser = sinon.stub().throws(new Error('do not touch'));
			const identity = sinon.stub().returns(user);
			expect(sut.trackingUser(identity)).to.eventually.eql(user);
		});

		it('calls identifyUser when not already present in settings and saves it to settings', () => {
			const sut = new CommandContext();
			const identity = sinon.stub();
			const client = { trackingIdentity: sinon.stub().returns(Promise.resolve(user))};
			const clientFactory = sinon.stub().returns(client);
			sut.identifyUser = sinon.stub().resolves(user);
			const auth = 'xyz';
			return sut.trackingUser(identity, auth, clientFactory)
				.then(user_ => {
					expect(user_).to.be.eql(user);
					expect(identity).calledWith(user);
					expect(clientFactory).calledWith(auth);
					expect(client.trackingIdentity).not.called; // because we stub identifyUser where it is called from
				});
		});

		it('calls identifyUser when not already present, and returns null if the fetched user fails the identify call', () => {
			const sut = new CommandContext();
			const cache = sinon.stub();
			const auth = 'xyz';
			const client = 'client';
			const clientFactory = sinon.stub().returns(client);
			sut.identifyUser = sinon.stub().resolves(user);
			sut.isIdentity = sinon.stub().returns(false);
			return sut.trackingUser(cache, auth, clientFactory)
				.then(user_ => {
					expect(user_).to.be.eql(null);
					expect(sut.identifyUser).calledWith(client);
					expect(cache.withArgs(sinon.match.any)).to.not.be.called;
				});
		});
	});

	describe('track', () => {
		const command = {};
		const site = {};

		it('implements flush', () => {
			const promise = flush();
			expect(promise).to.eventually.be.ok;
		});

		it('can track an event against a user id', () => {
			const userId = 'test-no-indentify';
			const command = {};
			const site = {};
			const context = {
				tool: { name: 'particle-commands unit tests' },
				api: { key: SegmentKey },
				user: { id: userId }
			};
			const event = 'integration-test';
			const properties = { foo:'bar' };

			const promise = track({ command, context, site, event, properties });
			return expect(promise).to.eventually.be.ok;
		});

		it('raises an error when the api key is not provided', () => {
			return expect(() => track({ command, context:{ user: { id:'abcd' } }, site, event:'this should not appear', traits:{ foo:'bar' } }))
				.to.throw('context.api.key not provided');
		});

		it('raises an error when the user id is not provided', () => {
			return expect(() => track({ command, context:{ api: { key:'abcd' } }, site, event:'this should not appear', traits:{ foo:'bar' } }))
				.to.throw('context.user.id not provided');
		});

		it('returns silently when track:false is defined', () => {
			return expect(track({ command, context:{ user: { track: false } }, site, event:'this should not appear', traits:{ foo:'bar' } }))
				.to.eventually.resolve;
		});

		it('raises an error when track:true is defined', () => {
			return expect(() => track({ command, context:{ user: { track: true } }, site, event:'this should not appear', traits:{ foo:'bar' } }))
				.to.throw('context.user.id not provided');
		});

	});
});

import { expect, sinon } from '../test-setup';

import { identify, track, flush } from '../../src/lib/analytics';

const SegmentKey = 'DFhKeLxnEmFVs3ejUDFUj5UH4Vv7SvUO';

describe('analytics', () => {
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

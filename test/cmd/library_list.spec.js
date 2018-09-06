
import { expect, sinon } from '../test-setup';
import { LibraryListCommand } from '../../src/cmd/library_list';


describe('library list', () => {
	let sut;
	beforeEach(() => {
		sut = new LibraryListCommand();
	});

	describe('category', () => {
		function expectFetchesCategory(name, scope, excludeScope, sort) {
			const client = { libraries: sinon.stub().returns(Promise.resolve(123)) };
			const site = {
				settings: () => {return {};},
				sections: () => {
					const obj = {};
					obj[name] = {};
					return obj;
				},
				target: () => {{}},
				error: (err) => { throw err; },
				apiClient: () => client,
				notifyFetchList: () => 0,
				notifyFetchLists: () => 0
			};

			return sut.run({}, site)
				.then(() => {
					let args = sut._removeUndefined({
						scope,
						excludeScope,
						sort
					});
					expect(client.libraries).to.have.been.calledWith(args);
				});
		}

		it('official', () => {
			return expectFetchesCategory('official', 'official', undefined, undefined);
		});

		it('featured', () => {
			return expectFetchesCategory('featured', 'featured', undefined, undefined);
		});

		it('verified', () => {
			return expectFetchesCategory('verified', 'verified', 'official', undefined);
		});

		it('popular', () => {
			return expectFetchesCategory('popular', 'public', 'verified,official', undefined);
		});

		it('mine', () => {
			return expectFetchesCategory('mine', 'mine', undefined, 'name');
		});

		it('recent', () => {
			return expectFetchesCategory('recent', 'all', undefined, '-date');
		});

		it('community', () => {
			return expectFetchesCategory('community', 'all', 'mine', 'official,verified,popularity,name');
		});


	});

	describe('fetchLists', () => {
		xit('calls _buildFetchPromise and _buildFetchLists', () => {
			const config = 'config';
			const client = 'client';
			const site = { notifyFetchLists: sinon.stub() };
			sut._buildFetchLists = sinon.stub().returns(123);
			sut._buildFetchPromise = sinon.stub().returns(456);
			const result = sut.fetchLists(site, client, config);
			expect(sut._buildFetchLists).to.have.been.calledWith(site, client, config);
			expect(sut._buildFetchPromise).to.have.been.calledWith(site, 123, config);
			expect(result).to.be.equal(456);
		});

		it('combines multiple lists into the result', () => {
			const target = {};
			const list1 = Promise.resolve(123);
			const list2 = Promise.resolve(456);
			const client = { libraries: sinon.stub().returns(list1, list2) };
			const site = { notifyFetchList: sinon.stub(), notifyFetchLists: sinon.stub() };
			const settings = { a:'A' };
			const config = sut.normalizeConfig({}, { mine:{}, official:{} });
			const result = sut.fetchLists(site, client, config, target);
			return expect(result).to.eventually.deep.equal(target);
		});
	});

	describe('fetchList', () => {
		it('calls libraries on the client', () => {
			const target = {};
			const list = Promise.resolve(123);
			const promise = sut._addResultToTarget(list, 'abc', target);
			const client = { libraries: sinon.stub().returns(list) };
			const site = { notifyFetchList: sinon.stub() };
			const settings = { a:'A' };
			const result = sut.fetchList(site, client, 'abc', settings, target);
			expect(client.libraries).to.have.been.calledWith(settings);
			expect(result).to.be.deep.equal(promise);
			return expect(result).to.eventually.deep.equal(target);
		});

		xit('calls notifyFetchList on the site and when it returns a falsey value, uses the original promise', () => {
			const target = {};
			const list = Promise.resolve(123);
			const promise2 = sut._addResultToTarget(list, 'abc', target);
			const client = { libraries: sinon.stub().returns(list) };
			const site = { notifyFetchList: sinon.stub() };
			const settings = { a:'A' };
			const result = sut.fetchList(site, client, 'abc', settings);
			expect(site.notifyFetchList).to.have.been.calledWithMatch(promise2, 'abc', settings, target);
			expect(result).to.be.deep.equal(promise);
			return expect(result).to.eventually.deep.equal(target);
		});

		it('calls notifyFetchList on the site and when it returns a non-falsey value, returns that', () => {
			const target = {};
			const list = Promise.resolve(123);
			const promise = sut._addResultToTarget(list, 'abc', target);
			const client = { libraries: sinon.stub().returns(list) };
			const site = { notifyFetchList: sinon.stub().returns('hi') };
			const settings = { a:'A' };
			const result = sut.fetchList(site, client, 'abc', settings);
			expect(site.notifyFetchList).to.have.been.calledWith(promise, 'abc', settings);
			expect(result).to.be.equal('hi');
		});

		xit('adds the libraries to the result object', () => {
			const target = {};
			const promise2 = sut._addResultToTarget(Promise.resolve(123), 'abc', target);
			const client = { libraries: sinon.stub().returns(Promise.resolve(123)) };
			const site = { notifyFetchList: sinon.stub().returns() };
			const settings = { a:'A' };
			const result = sut.fetchList(site, client, 'abc', settings);
			expect(site.notifyFetchList).to.have.been.calledWithMatch(promise2, 'abc', settings, target);
			return expect(result).to.eventually.be.deep.equal({ abc:123 });
		});
	});

	describe('_buildFetchPromise', () => {
		it('calls the site notifyFetchLists callback and uses the result', () => {
			const site = { notifyFetchLists: sinon.stub().returns(123) };
			const lists = [];
			const config = {};
			const promise = sut._buildFetchPromise(site, lists);
			const result = sut._buildNotifyFetchPromise(site, lists, config);
			expect(site.notifyFetchLists).to.have.been.calledWith(promise, config);
			expect(result).to.be.equal(123);
		});

		it('calls the site notifyFetchLists callback and uses the original promise when the result is falsey', () => {
			const site = { notifyFetchLists: sinon.stub().returns(0) };
			const lists = [];
			const config = {};
			const promise = sut._buildFetchPromise(site, lists);
			const result = sut._buildNotifyFetchPromise(site, lists, config);
			expect(site.notifyFetchLists).to.have.been.calledWith(promise, config);
			expect(result).to.be.not.equal(0);
		});
	});

	describe('normalizeConfig', () => {
		function baseConfig() {
			return {
				a:'a',
				b:'b'
			};
		}

		it('returns an empty config when no settings are provided', () => {
			const base = baseConfig();
			expect(sut.normalizeConfig(base)).to.eql({});
		});

		it('propagates features in the base to each setting', () => {
			const settings = {
				one: { a:undefined },     // this will be removed
				two: { c:'c', a:'A' }     //
			};
			const result = {
				one: {
					b:'b'
				},
				two: {
					a:'A',
					b:'b',
					c:'c'
				}
			};
			expect(sut.normalizeConfig(baseConfig(), settings)).to.eql(result);
		});
	});

});

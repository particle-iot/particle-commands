import { Command, CommandSite } from './command';
import { FileSystemLibraryRepository, FileSystemNamingStrategy } from 'particle-library-manager';
import path from 'path';
import { buildAdapters } from './library_install';

export class LibraryMigrateCommandSite extends CommandSite {

	/**
	 * Provides the list of library directories to process.
	 * Can return a value or a promise.
	 */
	getLibraries() {}

	/**
	 * Notify that the given library is being migrated.
	 * @param {string} dir The directory containing the library
	 */
	notifyStart(dir) {}

	/**
	 *
	 * @param {string}  lib The directory containing the library that migration was attempted on.
	 * @param {object}  result  There result of the migration.
	 * @param {object}  err if defined, is the error that occurred migrating the library.
	 */
	notifyEnd(lib, result, err) {}

	isAdaptersRequired() {
		return false;
	}

}


class AbstractLibraryMigrateCommand extends Command {
	/**
	 * Executes the library command.
	 * @param {object} state Conversation state
	 * @param {LibraryMigrateCommandSite} site Conversation interface
	 * @return {Array<object>} Returns a promise for an array, one index for each library processed.
	 * Each element has properties:
	 *  - libdir: the directory of the library
	 *  - result: result of running `processLibrary()` if no errors were produced.
	 *  - err: any error that was produced.
	 */
	async run(state, site) {
		const libraries = await site.getLibraries();
		const promises = libraries.map(libdir => this._executeLibrary(libdir, state, site));
		return Promise.all(promises);
	}

	async _executeLibrary(libdir, state, site){
		await site.notifyStart(libdir);
		const dir = path.resolve(libdir);
		const repo = new FileSystemLibraryRepository(dir, FileSystemNamingStrategy.DIRECT);
		const [res, err] = await this.processLibrary(repo, '', state, site, libdir);
		await site.notifyEnd(libdir, res, err);
		return { libdir, res, err };
	}

	/**
	 * Handle migration of a single library.
	 * @param {FileSystemLibraryRepo} repo          The filesystem repo containing the library.
	 * @param {string} libname       The identifier of the library
	 * @param {object} state         the current command state
	 * @param {LibraryMigrateCommandSite} site          the command site
	 */
	processLibrary(repo, libname, state, site) {}
}

function resultError(promise) {
	return promise
		.then(result => [result, null])
		.catch(err => [null, err]);
}

export class LibraryMigrateTestCommand extends AbstractLibraryMigrateCommand {

	processLibrary(repo, libname, state, site, libdir) {
		return resultError(repo.getLibraryLayout(libname));
	}
}

export class LibraryMigrateCommand extends AbstractLibraryMigrateCommand {

	async processLibrary(repo, libname, state, site, libdir) {
		return resultError(this._processLibrary(repo, libname, state, site, libdir));
	}

	async _processLibrary(repo, libname, state, site, libdir) {
		const layout = await repo.getLibraryLayout(libname);
		if (layout === 2) {
			return false;
		}
		await repo.setLibraryLayout(libname, 2);
		if (site.isAdaptersRequired()) {
			await buildAdapters(libdir, libname);
		}
		return true;
	}
}

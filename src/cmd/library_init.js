import { Command, CommandSite } from './command';
import { LibraryInitGenerator } from 'particle-library-manager';

/**
 * Specification and base implementation for the site instance expected by
 * the LibraryInitCommand.
 */
export class LibraryInitCommandSite extends CommandSite {

	constructor() {
		super();
	}

	options() {
		return {};
	}

	args() {
		return [];
	}

	prompter() {
		throw new Error('not implemented');
	}

	outputStreamer() {
		throw new Error('not implemented');
	}

}

/**
 * Implements the library initialization command.
 */
export class LibraryInitCommand extends Command {

	/**
	 *
	 * @param {object} state The current conversation state.
	 * @param {LibraryInitCommandSite} site external services.
	 * @returns {Promise} To run the library initialization command.
	 */
	run(state, site) {
		const opts = site.options();

		const generator = new LibraryInitGenerator({ prompt: site.prompter(), stdout: site.outputStreamer() });
		return generator.run({ options: opts });
	}
}


/**
 * Describes the interface expected of objects passed as the command site to a command.
 */
class CommandSite {

	constructor() {}

	/**
	 * @abstract
	 * @param {object} _state Conversation state
	 * @param {object} _cmd The command that was started
	 */
	begin(_state, _cmd) {}

	/**
	 * @abstract
	 * @param {object} _state Conversation state
	 * @param {object} _cmd The command that was finished
	 */
	end(_state, _cmd) {}


	async run(cmd, state = {}) {
		try {
			await this.begin(state, this);
			return await cmd.run(state, this);
		} finally {
			await this.end(state, this);
		}
	}
}


/**
 * Encapsulates a single unit of execution. A command is stateless, storing all state
 * in the `state` instance passed in.
 * The `site` instance is typically a unique interface for each command, that provides the input
 * and output required by the command.
 */
class Command {

	/**
	 * An async function/returns a promise for the command execution.
	 * @param {object} _state  Conversation state
	 * @param {CommandSite} _site    The command interaction site.
	 * @abstract
	 */
	run(_state, _site) {}
}


/**
 * wip
 */
class AbstractStatefulCommand {

	create() {
		return Promise.reject('not implemented');
	}

	doRun() {
		// the run method for this command
	}

	run(state, _site) {
		if (state === this) {
			return this.doRun();
		}

	}

}

export {
	Command,
	AbstractStatefulCommand,
	CommandSite
};

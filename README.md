# Particle Commands 
UX-neutral commands for developer tools

[![Build Status](https://circleci.com/gh/particle-iot/particle-commands.svg?style=shield)](https://app.circleci.com/pipelines/github/particle-iot/particle-commands)

[Installation](#installation) | [Development](#development)  | [Conventions](#conventions) | [Docs](#docs--resources) | [Releasing](#releasing) | [License](#license)

## Installation
1. Install Node.js [`node@16.x` and `npm@8.x` are required]
2. Clone this repository `$ git clone git@github.com:particle-iot/particle-commands.git && cd ./particle-commands`
3. Install dependencies `$ npm install`
4. View available commands `$ npm run`
5. Run the tests `$ npm test`
6. Start Hacking!

## Development

All essential commands are available at the root via `npm run <script name>` - e.g. `npm run lint`. To view the available commands, run: `npm run`

<details id="develop-run-tests">
<summary><b>How to run your tests</b></summary>
<p>

to run the tests:

`npm test`

to run the coverage:

`npm run coverage`

</p>
</details>


<details id="develop-npm-scripts">
<summary><b>How to name npm scripts</b></summary>
<p>

npm scripts are the primary means of executing programmatic tasks (e.g. tests, linting, releasing, etc) within the repo. to view available scripts, run `npm run`.

when creating a new script, be sure it does not already exist and use the following naming convention:

`<category>:[<subcategory>]:[<action>]`

our standard categories include: `test`, `lint`, `build`, `clean`, `docs`, `package`, `dependencies`, and `release`. top-level scripts - e.g. `npm run clean` - will typically run all of its subcategories (e.g. `npm run clean:dist && npm run clean:tmp`).

`npm` itself includes special handling for `test` and `start` (doc: [1](https://docs.npmjs.com/cli/v6/commands/npm-test), [2](https://docs.npmjs.com/cli/v6/commands/npm-start)) amongst other [lifecycle scripts](https://docs.npmjs.com/cli/v7/using-npm/scripts#life-cycle-scripts) - use these to expose key testing and start-up commands.

sometimes your new script will be very similar to an existing script. in those cases, try to extend the existing script before adding another one.

</p>
</details>


## Conventions

* [npm scripts](https://docs.npmjs.com/misc/scripts) form the _developer's API_ for the repo and all of its packages - key orchestration commands should be exposed here
* document developer-facing process / tooling instructions in the [Development](#development) section
* plan to release your changes upon merging to `main` - refrain from merging if you cannot so you don't leave unpublished changes to others
* avoid making changes in files unrelated to the work you are doing so you aren't having to publish trivial updates
* test files live alongside their source files and are named like `*.test.js` or `*.spec.js`
* if the linter does not flag your code (error or warning), it's formatted properly
* avoid reformatting unflagged code as it can obscure more meaningful changes and increase the chance of merge conflicts
* todo comments include your last name and are formatted like: `TODO (mirande): <message>`
  
## Docs & Resources

* [Mocha](https://mochajs.org/)
* [Chai](http://www.chaijs.com/api/bdd/)
* [Sinon](https://sinonjs.org/)
* [NYC](https://github.com/istanbuljs/nyc)

## Releasing

Packages are only released from the `main` branch after peer review.

1. make sure you have the latest:
	* `$ git checkout main`
	* `$ git pull`
1. make sure tests pass
	* `$ npm test`
1. run the version command
	* `$ npm version <major|minor|patch>`
	* This command will bump the current version of the library in the `package.json` file. Before the command finishes, update `CHANGELOG.md`.
1. push your tags:
	* `$ git push origin main --follow-tags`
1. CircleCI will publish the npm package to the `latest` tag
1. Create a release on GitHub with the notes from the `CHANGELOG.md`
1. Point your project to the new version `npm install particle-commands@latest`

## License

Copyright &copy; 2016 Particle Industries, Inc. Released under the Apache 2.0 license. See [LICENSE](/LICENSE) for details.

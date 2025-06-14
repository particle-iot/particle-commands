# Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

### 1.0.2 - 2025-06-03
- Update `particle-api-js` and `particle-library-manager` to remove github.com/spark dependencies
- Remove support of `node@12` and `node@14`
- 

### 1.0.0 - 2024-03-13
- Fix return results for command site and library add

### 1.0.0 - 2024-03-13
- Remove yeoman and use own template engine with particle-library-manager new version

### 0.5.3 - 2023-10-18
- Fix template

### 0.5.2 - 2023-10-17
- Fix asset ota key in project properties file

### 0.5.1 - 2023-10-11
- Fix gitignore file

### 0.5.0 - 2023-10-10
- Add the new Particle project template

### 0.4.1-rc.0 - 2023-09-26
- [tests] add project directory

### 0.4.0 - 2022-05-31
- Move to `node@16` and `npm@8` for local development

### 0.3.0 - 2018-09-06
### Change
- revert changes for analytics

### 0.2.13 - 2018-09-06
### Fix
- allow single letter project names

### 0.2.12 - 2017-07-10
### Changed
- adds support for analytics

### 0.2.11 - 2017-03-21
### Changed
- bumps version of yeoman dependencies

### 0.2.10 - 2017-03-21
### Changed
- update particle-library-manager module to 0.1.11 which updates yeoman
- update to latest particle linting config

### 0.2.9 - 2017-01-23
### Changed
- update particle-library-manager module to latest version

### 0.2.8 - 2017-01-18
### Changed
- update particle-library-manager module to latest version

### 0.2.7 - 2017-01-10
### Changed
- update particle-library-manager module to latest version

## 0.2.6 - 2016-12-22
### Changed
- fix typo in project.ino template

## 0.2.5 - 2016-12-21
### Changed
- refactor the `Projects` class into `Projects` and `Libraries`
- library list command supports 'Community' as a section
- refreshed README.md and project.ino templates in project init command
- project init command adds the project name to project.properties
- default folders on Windows uses the `Documents` folder as a base path.
- default folders API changed from synchronous to asynchronous

## 0.2.4 - 2016-12-20
### Changed
- library install command copies libraries to the new community libraries directory

## 0.2.3 - 2016-12-20
### Added
- example README.md and project.ino templates to project init command
- common project folders support

## 0.2.2 - 2016-12-13
### Added
- library list command
- project init command
- non-vendored library install command
- findProject method to locate the library or project properties

### Changed
- library install respects the version given

## 0.2.1 - 2016-10-19
### Changed
- use latest version of particle-library-manager for the `contribute` repo method

## 0.2.0 - 2016-10-19
### Added
- support for library contribute and library publish

## 0.1.6 - 2016-09-23
### Changed
- added missing dependency es6-promisify

## 0.1.5 - 2016-09-22
### Changed
- `particle-cli-library-manager` renamed to `particle-library-manager`

## 0.1.4 - 2016-09-22
### Changed
- Use latest library manager
- Remove debug log

## 0.1.1 - 2016-09-22
### Changed
- Use .npmignore to include transpiled files in published package

## 0.1.0 - 2016-09-22
### Changed
- Initial public beta release

## 0.0.1 - 2016-09-21
### Added
- Initial extraction of commands from [particle-cli](https://github.com/spark/particle-cli)

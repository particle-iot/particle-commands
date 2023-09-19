# <%=name%>

_Write a brief description of your project here._

<!---
Explain what the project does and its purpose. Mention any prerequisites, such as the required hardware and software.
Example: The "Smart Home Temperature and Light Control System" is a project aimed at enhancing home comfort and energy efficiency. This project leverages an XYZ microcontroller and various sensors to automate temperature and lighting control within a home environment.
-->

# Getting started

- [Project structure](#project-strcuture)
- [Development](#development)
- [Continuous Integration](#continuous-integration)

# Learn more
- [Firmware best practices](#firmware-best-practices)
- [Debugging firmware builds](https://docs.particle.io/troubleshooting/guides/build-tools-troubleshooting/debugging-firmware-builds/)
- Develop with Device-OS source (WIP)

## Project strcuture

In your project directory (named <%=name%>), you'll find essential elements common to all Particle projects.

### Application sources (`/src` folder)
The `/src` folder houses the source code for your application. Please do not rename it. Add additional `.cpp` and `.h` files to this folder.

### Libraries (`/lib` folder)

Libraries that you install using Workbench are stored in `/lib/<libraryname>`.

To include custom libraries, create a new folder named `/lib/<libraryname>/src` and add the `.h`, `.cpp` & `library.properties` files for your library there. Read the [Firmware Libraries guide](https://docs.particle.io/guide/tools-and-features/libraries/) for more details on how to develop libraries.

### Project configuration (`project.properties` file)

This configuration file specifies dependencies and project settings.

When you add a library to your project using `particle library add` or the Workbench `Particle: Install Library` command, the library name and version is added to the `project.properties` file.

To use the [Asset OTA](https://docs.particle.io/reference/device-os/api/asset-ota/asset-ota/) feature, put your files in an `/assets` folder and ensure the `assetOtaDir=assets` line in `project.properties` is uncommented.

## Development

You can develop your Particle project using two recommended methods:

1. [Particle CLI](https://docs.particle.io/getting-started/developer-tools/cli/)
2. [Workbench](https://docs.particle.io/quickstart/workbench/)

To compile your project, navigate to your project directory and run `particle compile <platform>` in the CLI or use `Particle: Compile application (local)` in Workbench.

To flash your device over the air (OTA), navigate to your project directory, and run `particle flash <device>` or use `Particle: Cloud Flash` in Workbench.

To flash your project locally, navigate to your project directory and run `particle flash --local <device>` in the CLI or use `Particle: Flash application (local)` in Workbench.

## Continuous Integration

This template includes a GitHub Actions workflow to automatically build your project when you push code to GitHub. Update the `platform` and `deviceOsVersion` parameters in `.github/workflows/main.yml` to match your project.

More information about Continuous Integration for Particle can be found [here](https://docs.particle.io/firmware/best-practices/github-actions/)

## Firmware best practices

1. Enable detailed logging with `LOG_LEVEL_ALL` in the SerialLogHandler
2. To delay the application for USB connection, add the following line in setup()

        waitFor(Serial.isConnected, 15000);
3. TBD
4. TBD
5. TBD

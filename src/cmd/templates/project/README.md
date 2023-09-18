# <%=name%>

Brief project description goes here.

<!---
Explain what the project does and its purpose. Mention any prerequisites, such as the required hardware and software.
Example: The "Smart Home Temperature and Light Control System" is a project aimed at enhancing home comfort and energy efficiency. This project leverages an XYZ microcontroller and various sensors to automate temperature and lighting control within a home environment.
-->

# Getting Started

- [Project Structure](#project-strcuture)
- [Developement Tools](#development-tools)
- [Compile a Particle project](#compiling-your-project)
- Example projects (WIP)

# Advanced
- [Advanced topics](#advanced-topics)
- [Continuous Integration (WIP)](https://docs.particle.io/firmware/best-practices/github-actions/)
- [Debugging firmware builds](https://docs.particle.io/troubleshooting/guides/build-tools-troubleshooting/debugging-firmware-builds/)
- [Library Management](https://docs.particle.io/getting-started/developer-tools/workbench/#particle-libraries)
- Develop with Device-OS source (WIP)

## Project Strcuture

In your project directory (named <%=name%>), you'll find essential elements common to all Particle projects.

#### ```/src``` folder:  
The `/src` folder houses your project's firmware files. Please DO NOT rename it. Anything in this folder during compilation is sent to our compile service (unless specified in `particle.ignore` file as described below) and converted into firmware for the specified Particle device.

If your project consists of multiple files, include them all in the `/src` folder. If your firmware relies on Particle libraries, these dependencies are outlined in the project.properties file, as referenced below.

#### ```project.properties``` file:  
A project.properties file is a configuration file commonly used in Particle projects to specify dependencies and project settings. This is the file that specifies the name and version number of the libraries that your project depends on. Dependencies are added automatically to your `project.properties` file when you add a library to a project using the `particle library add` command in the CLI or add a library in Workbench (!TODO: double check). If you are working with Asset OTA feature, ensure the `assetOtaDir` line in this file is uncommented.

#### ```particle.include or particle.ignore``` file:
The particle.include and particle.ignore files provide a way to include or exclude additional files from the cloud compiler. More documentation available [here](https://docs.particle.io/getting-started/device-os/firmware-libraries/#particle-include-and-particle-ignore)

## Adding additional files to your project

#### Projects with multiple sources
If you would like add additional files to your application, they should be added to the `/src` folder. All files in the `/src` folder will be sent to the Particle Cloud to produce a compiled binary.

#### Projects with external libraries (```/lib``` folder)
If your project includes a library that has not been registered in the Particle libraries system, you should create a new folder named `/lib/<libraryname>/src` under `/<project dir>` and add the `.h`, `.cpp` & `library.properties` files for your library there. Read the [Firmware Libraries guide](https://docs.particle.io/guide/tools-and-features/libraries/) for more details on how to develop libraries. Note that all contents of the `/lib` folder and subfolders will also be sent to the Cloud for compilation.

## Development Tools

Two recommended ways to develop your Particle project
1. [Particle CLI](https://docs.particle.io/getting-started/developer-tools/cli/)
2. [Workbench](https://docs.particle.io/quickstart/workbench/)

## Compiling your project

When you're ready to compile your project, make sure you are in the project directory. Run `particle compile <platform>` in the CLI or run `Compile Application & DeviceOS (local)` if using Workbench. The following files in your project folder will be compiled:

- Everything in the `/src` folder, including your `.cpp` application file (with exceptions from `particle.ignore` file if any)
- The `project.properties` file for your project
- Any libraries stored under `lib/<libraryname>/src`

## Advanced topics

1. Enable more detailed logging using `LOG_LEVEL_ALL` in the SerialLogHandler
2. Delay the application for a specific period of time or until a condition is met. The following lines waits for USB connection for 15 sec before it starts to run the setup() of the application firmware
```
waitFor(Serial.isConnected, 15000);
```
3. TBD
4. TBD
5. TBD


## Learn More
- [Particle Docs](https://docs.particle.io/getting-started/getting-started/)
- Reach out via [Particle's Official Developer Community](https://community.particle.io/)
- TBD
- TBD
- TBD


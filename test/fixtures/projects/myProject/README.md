# myProject

This is a firmware project that was created using [Particle Developer Tools](https://www.particle.io/developer-tools/) and can be built to run on any of the [Particle Devices](https://www.particle.io/devices/). 

For a deeper dive on this project template, please review our [documentation](https://docs.particle.io/firmware/best-practices/firmware-template/).

Lastly, please feel free to whisk away this README.md file and replace with your own content (or keep it around for the memories!)

## Prerequisites To Use This Repository

In order to use this software / firmware on an actual device, you will need the following items:

- A [Particle Device](https://www.particle.io/devices/) on which this firmware can run!
- Windows/Mac/Linux in order to build this software and then flash it onto an actual device
- The [Particle Development Tools](https://docs.particle.io/getting-started/developer-tools/developer-tools/) installed and configured on your computer
- About 1 minute of your time to compile and flash the firmware :)
- A nice cup of tea (and maybe a biscuit).

## Getting Started
  
1. Whilst not necessary, we highly recommend you run the [device setup process ](https://setup.particle.io/) on your Particle device prior to setting off on your adventure. This will reset it back to a known working state so you don't have to second guess the rest of this process. 

2. If not already open, load this project into Visual Studio Code (File -> Open Folder) and then [compile and flash](https://docs.particle.io/getting-started/developer-tools/workbench/#cloud-build-and-flash) your device with the new firmware. It will flash using the USB port on your device which should be connected to your computer.

3. Check that the device is working by monitoring the logging output of the device! You can do this a couple of ways

	- Using the Particle Plugin within Visual Studio Code, open the [command palette](https://docs.particle.io/getting-started/developer-tools/workbench/#particle-commands) and select "Particle: Serial Monitor"
	- Using the Particle CLI, run  

		```
			particle serial monitor --follow
		```

4. Modify this project! For more info on the Firmware side, please visit  [Particle firmware](https://docs.particle.io/reference/device-os/api/introduction/getting-started/) and go here to learn more about the [project's directory structure](https://docs.particle.io/firmware/best-practices/firmware-template/#project-overview)
  
## Particle Firmware At A Glance

### Logging

The firmware has a built in [logging library](https://docs.particle.io/reference/device-os/api/logging/logger-class/). You can print out messages at different levels and filter for them on a file by file basis.

```
Log.trace("This is trace message");
Log.info("This is info message");
Log.warn("This is warn message");
Log.error("This is error message");
```

### Setup and Loop

Particle projects have a heritage in Wiring (and prior to that, Processing), an open source programming framework based on C++. The normal practice is that you put the one time setup style functions in setup() and then run your application from the loop() function.

For more advanced use cases, checkout our (threading)[https://docs.particle.io/firmware/software-design/threading-explainer/] support!


### Delays and Timing

By default, the setup() and loop() functions are blocking whilst they run, meaning that if you put in a delay, your entire application will wait for that delay to finish before anything else can run. 

For techniques to run multiple execution tasks in parallel without creating threads, checkout the code example [here](https://docs.particle.io/firmware/best-practices/firmware-template/).

For best practices, we don't recommend you use delay() in your code base. However, its perfectly fine to do this for testing and hacking around :)

### Testing and Debugging

For firmware testing and debugging guides, refer to the [documentation here](https://docs.particle.io/troubleshooting/guides/build-tools-troubleshooting/debugging-firmware-builds/)

### GitHub Actions (CI/CD)

This project contains a YAML file that you can use of the door with GitHub that can automatically compile your firmware when you push any changes to GitHub, alerting you to that accidental 'yyyyy' that we all include periodically in our best work (usually at the top of the file!). 

Visit this link for more information on [Particle GitHub Actions](https://docs.particle.io/firmware/best-practices/github-actions/) - the guide includes information on how to automatically compile, flash, or upload firmware.

### OTA

For more information on how to use Particle's OTA service to update your device, take a look at this [documentation](https://docs.particle.io/getting-started/cloud/ota-updates/).

You can give our 1-time OTA a quick test drive however by running the command 'Particle: Cloud Flash' in Visual Studio Code or via the CLI command 'particle flash'.  

We support including binary assets in our firmware OTA packages so you can easily include audio, image files, configuration and firmware for external microcontrollers in your firmware project. For more info, please visit this [link](https://docs.particle.io/reference/device-os/api/asset-ota/asset-ota/)!

### Support and Feedback

For any support on getting started or feedback to share (on this template or any of the Particle products), we warmly welcome you to join us in our [community](https://community.particle.io) and begin a conversation!

 Template version 1.0.1
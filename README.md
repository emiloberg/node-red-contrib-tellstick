# node-red-contrib-telldus

# Module is a work in progress!

This is a full featured [Node-RED](http://nodered.org/) module to communicate with a [Tellstick](http://www.telldus.se/products/tellstick), [Tellstick Duo](http://www.telldus.se/products/tellstick_duo), and [Tellstick Net](http://www.telldus.se/products/tellstick_net)

* Send data to a Tellstick (e.g. turning a lamp on).
* Recieve data from a (Tellstick compatible) transmitter (e.g a remote control or a temperature sensor).
* Manage devices (e.g. add and "teach" a new wall plug)

## Status
What? | Status | What? | Status
------- | ------ | ------- | ------
Code Climate GPA | [![Code Climate](https://codeclimate.com/github/emiloberg/node-red-contrib-telldus/badges/gpa.svg)](https://codeclimate.com/github/emiloberg/node-red-contrib-telldus) | Licence | [![Licence](https://img.shields.io/npm/l/node-red-contrib-telldus.svg)](https://github.com/emiloberg/node-red-contrib-telldus/blob/master/LICENSE)
Codacy | [![Codacy Badge](https://www.codacy.com/project/badge/b2291afcead447048742a9cef0cdd347)](https://www.codacy.com/public/emiloberg/node-red-contrib-telldus) | Tag |  [![Tag](https://img.shields.io/github/tag/emiloberg/node-red-contrib-telldus.svg)](https://github.com/emiloberg/node-red-contrib-telldus/tags)
Issues | [![Issues](https://img.shields.io/github/issues/emiloberg/node-red-contrib-telldus.svg)](https://github.com/emiloberg/node-red-contrib-telldus/issues) | GitHub Forks | [![Forks](https://img.shields.io/github/forks/emiloberg/node-red-contrib-telldus.svg)](https://github.com/emiloberg/node-red-contrib-telldus/network)
GitHub Version | [![GitHub version](https://badge.fury.io/gh/emiloberg%2Fnode-red-contrib-telldus.svg)](http://badge.fury.io/gh/emiloberg%2Fnode-red-contrib-telldus) | GitHub Followers | [![Followers](https://img.shields.io/github/followers/emiloberg.svg)](https://github.com/emiloberg/followers)
NPM Version | [![npm version](https://badge.fury.io/js/node-red-contrib-telldus.svg)](http://badge.fury.io/js/node-red-contrib-telldus) | Dependencies | ![Dependencies](https://david-dm.org/emiloberg/node-red-contrib-telldus.svg)

## Issues
This is still getting developed. Feel free to [add issues, questions or feature requests](https://github.com/emiloberg/node-red-contrib-telldus/issues).

## Example flow
Light blue nodes are telldus nodes.

[![Screenshot - Sample Flows](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-sample-flows.png)](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-sample-flows.png)

## Installation

### 1. Install telldus-core and development libraries

#### Windows and Mac OS X
Make sure you have Telldus Center installed. If you own a Telldus, you probably have this already. If not, [download and install from the Telldus webpage](http://download.telldus.se/TellStick/Software/TelldusCenter/). That's it, go to step 2 below.

#### Ubuntu/Debian/Raspbian (Raspberry Pi)

```
#
# Make Telldus available to the distribution
#
sudo nano /etc/apt/sources.list
# add the following line (without the #):
# deb http://download.telldus.com/debian/ stable main

#
# Download and install Telldus repository key
#
wget -q http://download.telldus.se/debian/telldus-public.key -O- | sudo apt-key add -

#
# Update the repository
#
sudo apt-get update

#
# Install telldus-core AND libtelldus-core-dev
#
sudo apt-get install telldus-core libtelldus-core-dev
```

#### Other Linux

Install from source by following this [excellent guide from Lasse](https://lassesunix.wordpress.com/).

### 2. Install module(s)

For some reason, the underlying telldus library does not have node-gyp as a dependency (even though it actually needs it). Therefor install it by running this 3 commands in sequence. First `cd` to your Node-RED root directory.

```
npm install node-gyp
npm install telldus
npm install node-red-contrib-telldus
```


## Usage

This module consist of 2 nodes, one for listening to incoming data (remotes and sensors) and one for transmitting data (e.g telling a lamp to turn off).

## Usage, _In_ node
This module will listen to all incoming data and if that data matches the rule set in the _in_ node, the node will be triggered and pass the complete incoming message object forward.

E.g. you can set an input node to listen to all remote which sends `house`=_15414550_ and `group`=0. This will fire the node on all button press' on that remote control. If you want to qualify it you may adda a `unit`=10 to the rule which will make it only fire on button _10_. Or qualify it even more by adding the rule `method`=turnoff to only make it trigger on the _off_ button (and not the _on_ button).

You can easily make your rules by placing a Telldus in node on your Sheet, clicking it and select "Add new telldus-input". A dialog will open which will show _all_ incoming data. Just press a button on the remote (or wait for your sensor to transmit a signal) and it will show up on the dialog. From there you may can the _learn_ button which will populate the rule fields.

If you want to create an In node which passes on _all_ incoming data, just create a config with all fields left blank (meaning: no rules).

[![Screenshot of input configuration](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-in-config.png)](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-in-config.png)

If a in node is triggered, it will output the complete data message from the transmitter. Check the message out by wiring the input node to a debug node (set to display _full message_).

Example of outputted data. However, note that no transmitter sends _all_ fields. All transmitters have fields like `class` and `protocol` but e.g. _codeswitch_ type transmitters only transmit `code` and not `house` or `unit` where for a _selflearning_ transmitter it's the opposite.
 
```
{
    "class": "command",
    	// Could be 'command' for remote or 'sensor' for sensor
    "protocol": "sartano",
    "group": 0,
    "house": 12345678,
    "method": "turnon",
	    // Remotes usually send "turnon" for "on" and "turnoff" for "off" button
    "model": "codeswitch",
    "unit": 1,        
    "code": 1011011011,
    "id": 123,
    "additionalDataFields": 22.1
    	// A sensor could send "temp: 22.1" for temperature reading,
    	// or "humidity: 57" for humidity

}
```

Example, pressing the first off button on a Nexa handheld remote:

```
{
	class: 'command',
	protocol: 'everflourish',
	model: 'selflearning',
	house: 34937,
		// Built in identifyer for this particular remote
	unit: 1,
		// Number 1 button (this remote have 4 pairs of on/off buttons)
	method: 'turnoff'
		// Pressed the "off" button. On button would give "turnon"
}
```

Example Proove TSS320 Temperature/Hygrometer sensor. Sends a signal every minute.

```
{ 
	class: 'sensor',
	protocol: 'fineoffset',
	id: 183,
	model: 'temperaturehumidity',
	humidity: 37,
	temp: 22
 }
```

## Usage, _Out_ node

The out node will send a signal telling your heater to turn off or your lamp to dim to 45%. 

Example of an out node, dimming the device "Red lightsaber" to 165 (65%):

[![Screenshot of output configuration](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-out.png)](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-out.png)

### Passing data to the out node.

There are 3 ways of passing data to an out node:

* Configure the `device`, `method` (turn on/turn off/dim) and `dimlevel` (0-255) if a dim capable device on the output node itself (as done in the screenshot above)
* Send the data in the `msg` sent to the out node.
* A combination of above. E.g set the device to _Red lightsaber_ in the configuration dialog but send `method: turnon` or `method: turnoff` in the `msg` to the out node. Whatever is sent in the msg will always override the settings set in the node.

```
msg: {
	device: 1,
		// Integer, device ID. 
		// The Device IDs are displayed in the "Configure devices"
		// dialog (se further down in this README).
	method: 'turnon',
		// Valid methods: turnoff, turnon, dim, bell, learn
		// if dim is supplied so must dimlevel be.
		// method may also be an integer:
		//		0 (for turnoff)
		//		1 (for turnon)
		//		2 (for dim)
		//		3 (for bell)
		//		4 (for learn)
	dimlevel: 100
		// Only taken into account if method is "dim".
		// Valid input: 0-255, where 255 is 100% and 0 is off.
}
```

### Configure devices

The way the Tellstick works you have to configure your devices. On Windows and Mac OS X you do this in Telldus Center, on Linux you do this in `/etc/tellstick.conf`. However, this is a full featured module to handle Telldus devices and you may add/update/delete devices straight from Node-RED with this module. Any changes you do from Node-RED will be saved (e.g. written to `/etc/tellstick.conf`).

To configure devices. Place an Out node on a Sheet, click it and click the big blue "Configure/Add devices". A new dialog will open showing all configured devices. From here you can also test your devices but turning them on/off or dimming them. Or you may send the "learn" command to them.

[![Screenshot of device list](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-devicelist.png)](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-devicelist.png)

Clicking "Configure" or "Add new device" will give you a dialog to add/configure/remove a device.

[![Screenshot of input configuration](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-update-device.png)](https://raw.githubusercontent.com/emiloberg/node-red-contrib-telldus/master/docs/screenshot-update-device.png)


## About the Tellstick
The Telldus Tellstick is a small USB connected radio tranciever which plays well on Windows/Mac/Linux (Raspberry) and is used to control a wide range of 433 MHz based plugged in and built in electric switches and dimmers. Further, this module can also listen to _incoming_ Telldus data (or in other words: it can pick up signals from remote controls).

#### Commonly used Tellstick transmitters/receivers 
* [HomeEasy](http://www.homeeasy.eu/)
* Nexa [Swedish](http://www.nexa.se/) | [English](http://www.nexa.se/Home.html) (Resellers include Clas Ohlson in [United Kingdom](http://www.clasohlson.com/uk/), [Sweden](http://www.clasohlson.com/se/), [Norway](http://www.clasohlson.com/no/), [Finland](http://www.clasohlson.com/fi/) and [UAE](http://www.clasohlson.com/ae/)
* [Proove](http://proove.se/) (Swedish)
* [X10](http://en.wikipedia.org/wiki/X10_%28industry_standard%29)
* [Kjell & Company](http://www.kjell.com/) (Swedish)

#### Other supported Tellstick transmitters/receivers 
Anslut, Brennestuhl, Bye Bye Standby, Chacon, CoCo Technologies, Conrad, Ecosavers, Elro, GAO, Goobay, HQ, IKEA, Intertechno, Kappa, KlikAanKlikUit, Otio, Rusta, Sartano, UPM, Waveman.

See [complete list of supported devices](http://telldus.se/products/compability) on Telldus webpage.


## Developing
This modules is quite big and to make it easier to handle, the source code is is broken down into smaller files.

As per Node-RED standard, each module consist of 1 html file and 1 js file. These files lives in the `/telldus` folder and **gets built** from the `/lib` folder. This is, somewhat incorrectly, named _lib_ because it's a reserved word in the Node-RED world and Node-RED will not try to discover nodes in folders named _lib_. The more correct folder name would be _source_.

A Gulp build script is included. Run `gulp build` to build the html/js files. Run `gulp` to start gulp in developer mode and auto-build the files when the source files (in `/lib`) are changed.
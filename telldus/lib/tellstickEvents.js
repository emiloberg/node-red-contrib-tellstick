
'use strict';

var EventEmitter = require('events').EventEmitter;
var telldus = require('telldus');
var Settings = require('./settings.js');

var isStarted = false;
var events = new EventEmitter();
var tellstickStatus;

/**
 * Start listening to telldus data, and emit it over our EventEmitter.
 *
 * As this is radio traffic, a transmitter usually sends the same data
 * about 6 times. The Telldus does debounce this, but not all that good,
 * sometimes it will give us duplicate data. Therefor we throttle the data.
 *
 */
function startEmittingData() {
	if (!isStarted) {
		isStarted = true;
		var debData = {};
		tellstickStatus = telldus.addRawDeviceEventListener(function(controllerId, data) {
			if (!debData.hasOwnProperty(data)) {
				debData[data] = true;
				events.emit('tellstick-incoming', data);
			}
			setTimeout(function (prop) {
				delete debData[prop];
			}, Settings.inputThrottle, data);
		});
	}
}


/**
 * Get the status of the telldus device.
 *
 * NOTE: It seems to give us false negatives saying
 * that a device is not found even though one exists
 * and is working perfectly fine.
 *
 * @returns {{status: number, errStr: string}}
 */
function getStatus() {
	if(tellstickStatus > 0) {
		telldus.getErrorString(tellstickStatus, function (errCode, errStr) {
			return {
				status: tellstickStatus,
				errStr: errStr
			};
		});
	}
	return { status: 0, errStr: '' };
}



module.exports.startEmittingData = startEmittingData;
module.exports.events = events;
module.exports.getStatus = getStatus;

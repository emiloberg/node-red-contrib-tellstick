'use strict';

var telldus = require('telldus');
var Settings = require('./settings.js');


/**
 * Queue a command to be sent to the Tellstick.
 *
 * If two or more commands are sent to the Tellstick in a short
 * period of time (like within a few milliseconds), it will all
 * commands as fast as possible. This will pollute the air and
 * only the first receiver will pick up the signal.
 *
 * This is probably because the Tellstick send each command like 6
 * times (to make sure at least one of them gets through), and it
 * starts to send the second command before it's done sending all
 * 6 repetitions of the first command. Not sure about this, but
 * it's plausible.
 *
 * To solve this, this queue will queue the commands and send them
 * in order, making sure there's a sufficient waiting time between
 * the transmissions.
 *
 * @param msg Object with 'method', 'device' (id) and optionally 'dimlevel' property.
 * @param cb Optional callback to be executed one the method has been invoked.
 */
var invocationInterval;
var invocationQueue = [];
function queue(msg, cb) {

	invocationQueue.push({
		msg: msg,
		cb: cb
	});

	if (invocationQueue.length === 1) {
		_invokeTellstickMethod(invocationQueue[0].msg, invocationQueue[0].cb);
		invocationInterval = setInterval(function () {
			invocationQueue.shift();
			if (invocationQueue.length > 0) {
				_invokeTellstickMethod(invocationQueue[0].msg, invocationQueue[0].cb);
			} else {
				clearInterval(invocationInterval);
			}
		}, Settings.get('outputThrottle'));
	}
}


/**
 * Send a a command to the Tellstick. E.g. "turn lamp id 7 on".
 *
 * @param msg Object with method and device (for id) property.
 * @param cb Optional callback
 */
function _invokeTellstickMethod(msg, cb) {
	if (msg.method === 0) {
		telldus.turnOff(msg.device, function(err) {
			if (err) {
				(cb(err) || Function)();
			} else {
				(cb(null, { name: 'OFF' }) || Function)();
			}

		});
	} else if (msg.method === 1) {
		telldus.turnOn(msg.device, function(err) {
			if (err) {
				(cb(err) || Function)();
			} else {
				(cb(null, { name: 'ON' }) || Function)();
			}
		});
	} else if (msg.method === 2) {
		telldus.dim(msg.device, msg.dimlevel, function(err) {
			if (err) {
				(cb(err) || Function)();
			} else {
				(cb(null, { name: 'DIM', level: msg.dimlevel }) || Function)();
			}
		});
	} else if (msg.method === 3) {
		telldus.bell(msg.device, function(err) {
			if (err) {
				(cb(err) || Function)();
			} else {
				(cb() || Function)();
			}
		});
	} else if (msg.method === 4) {
		telldus.learn(msg.device, function(err) {
			if (err) {
				(cb(err) || Function)();
			} else {
				(cb() || Function)();
			}
		});
	}
}

module.exports.queue = queue;

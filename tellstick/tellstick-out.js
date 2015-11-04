'use strict';

var telldus = require('telldus');
var is = require('is_js');
var Settings = require('./lib/settings.js');

/**
 * Normalize and validate an incoming command.
 *
 * Merge any properties coming in the incoming data object with the
 * properties set as settings on the output node.
 *
 * @param incomingMsg
 * @param node
 * @returns deviceMethodObject
 */
function normalizeTellstickCommand(incomingMsg, node) {
	/**
	 * Merge incoming msg with config set on the node.
	 * Incoming msg will take precedence over configuration set
	 * on the node itself.
	 */
	var msg = {
		device: '',
		method: '',
		dimlevel: ''
	};
	Object.keys(msg).forEach(function (key) {
		if (typeof incomingMsg === 'object') {
			if (incomingMsg.hasOwnProperty(key)) {
				msg[key] = incomingMsg[key];
			} else {
				if (node) {
					msg[key] = node[key];
				}
			}
		} else {
			if (node) {
				msg[key] = node[key];
			}
		}
	});
	msg.err = false;
	msg.warn = false;
	msg.errWarnStr = '';


	/**
	 * We allow the incoming msg to be a little bit ambiguous,
	 * so lets normalize it.
	 */
	msg.device = parseInt(msg.device);
	msg.dimlevel = parseInt(msg.dimlevel);
	if (msg.method === 'turnon' || msg.method === '1') {
		msg.method = 1;
	} else if (msg.method === 'turnoff' || msg.method === '0') {
		msg.method = 0;
	} else if (msg.method === 'dim' || msg.method === '2') {
		msg.method = 2;
	} else if (msg.method === 'bell' || msg.method === '3') {
		msg.method = 3;
	} else if (msg.method === 'learn' || msg.method === '4') {
		msg.method = 4;
	} else {
		msg.err = true;
		msg.errWarnStr = "No valid method is supplied. Please select a method in the output node, or send a method in the msg: 'msg: {method: 'turnon'}'. Valid method are 'turnon' (or '1'), 'turnoff' (or '0'), 'dim' (or '2')'";
	}
	/**
	 * Convert 'dim to 0' to 'turnoff'
	 */
	if (msg.method === 2 && msg.dimlevel === 0) {
		msg.method = 0;
	}


	/**
	 * Validate msg
	 */
	if (is.not.integer(msg.device)) {
		msg.err = true;
		msg.errWarnStr = "Value for 'device' is not a number. Please select a device in the output node, or send a device in the msg: 'msg: {device: 1}'";
	}

	if (msg.method === 2) {
		if (is.integer(msg.dimlevel)) {
			if (msg.dimlevel < 0) {
				msg.dimlevel = 0;
				msg.warn = true;
				msg.errWarnStr = "Value for 'device' is not a number. Please select a device in the output node, or send a device in the msg: 'msg: {device: 1}'";
			} else if (msg.dimlevel > 255) {
				msg.dimlevel = 255;
				msg.warn = true;
				msg.errWarnStr = "'dimlevel' is > 255, setting dimlevel to 255 (max value)";
			}
		} else {
			msg.err = true;
			msg.errWarnStr = "'method' is set to 'dim' but no valid 'dimlevel' is supplied. Needs to be a number between 0 and 255.";
		}
	}

	return msg;
}


module.exports = function(RED) {
	var tellstickDevices = require('./lib/tellstickDevices.js');
	var tellstickMethods = require('./lib/tellstickMethods.js');

	/**
	 * If set: Read output throttle time from Node-RED settings
	 * and update our settings with that value.
	 */
	if (RED.settings.functionGlobalContext.hasOwnProperty('tellstickOutputThrottle')) {
		Settings.update('outputThrottle', RED.settings.functionGlobalContext.tellstickOutputThrottle);
	}
	if (RED.settings.functionGlobalContext.hasOwnProperty('repeatSendTimes')) {
		Settings.update('repeatSendTimes', RED.settings.functionGlobalContext.repeatSendTimes);
	}
	if (RED.settings.functionGlobalContext.hasOwnProperty('repeatSendInterval')) {
		Settings.update('repeatSendInterval', RED.settings.functionGlobalContext.repeatSendInterval);
	}

	/**
	 * Create Node
	 * @param n
	 * @constructor
	 */
	function TellstickOutNode(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name;
		this.device = n.device || '';
		this.method = n.method || '';
		this.dimlevel = n.dimlevel || '';
		this.devicefriendlyname = n.devicefriendlyname || '';

		/**
		 * Display Tellstick Status on Node
		 */
		var tellstickEvents = require('./lib/tellstickEvents.js');

		var tellstickStatus = tellstickEvents.getStatus();
		if (tellstickStatus.status === 0) {
			this.status({fill: 'green', shape: 'ring', text: 'connected'});
		} else {
			this.status({fill: 'red', shape: 'ring', text: tellstickStatus.errStr});
		}

		var node = this;


		/**
		 * On Input
		 */
		this.on('input', function(incomingMsg) {

			var msg = normalizeTellstickCommand(incomingMsg, node);

			if (msg.err === true) {
				this.error(msg.errWarnStr);
				return;
			} else if (msg.warn === true) {
				this.warn(msg.errWarnStr);
			}

			for (var i = 0; i < Settings.get('repeatSendTimes'); i++) {
				if (i === 0) {
					tellstickMethods.queue(msg, function (err) {
						if (err) {
							node.error(JSON.stringify(err.message));
						}
					});
				} else {
					setTimeout(function () {
						tellstickMethods.queue(msg);
					}, i * Settings.get('repeatSendInterval'));
				}
			}

		});
	}
	RED.nodes.registerType('tellstick-out', TellstickOutNode);



	/**
	 * Add new device
	 */
	function addUpdateDevice(updateDeviceId, deviceObj, cb) {
		if (is.not.integer(updateDeviceId)) {
			throw new Error('updateDeviceId must be a number');
		}
		var deviceId = updateDeviceId;
		var doneStatus = 'updated';
		if (updateDeviceId === -1) {
			deviceId = telldus.addDeviceSync();
			doneStatus = 'added';
		}
		if (is.under(deviceId, 1)) {
			cb(new Error('Could not add device: ' + telldus.getErrorString(deviceId)));
			return;
		}
		telldus.setName(deviceId, deviceObj.name, function () {
			telldus.setProtocol(deviceId, deviceObj.protocol, function () {
				telldus.setModel(deviceId, deviceObj.model, function() {
					Object.keys(deviceObj.parameters).forEach(function (param) {
						telldus.setDeviceParameterSync(deviceId, param, deviceObj.parameters[param]);
					});
					deviceObj.status = doneStatus;
					cb(null, deviceObj);
				});
			});
		});
	}


	/**
	 * API: Give the client a list of all brands
	 */
	RED.httpAdmin.get('/tellstick/supported-brands', function(req, res) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(tellstickDevices.getBrands()));
		res.end();
	});


	/**
	 * API: Give the client a list of all device types for a given brand
	 */
	RED.httpAdmin.get('/tellstick/supported-devices/:brand', function(req, res) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(tellstickDevices.getModels(req.params.brand)));
		res.end();
	});


	/**
	 * API: Add new device/Update device
	 */
	RED.httpAdmin.post('/tellstick/device', function(req, res) {

		var updateDeviceId = parseInt(req.body.id);
		if (is.not.integer(updateDeviceId)) {
			updateDeviceId = -1;
		}

		addUpdateDevice(updateDeviceId, req.body, function (err, data) {
			if (err) {
				res.writeHead(500, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(err.message));
				res.end();
				return;
			}
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(data));
			res.end();
		});

	});


	/**
	 * API: Invoke method (on, off, dim, bell, learn)
	 *
	 */
	RED.httpAdmin.get('/tellstick/invoke/:deviceid/:method/:dimlevel?', function(req, res) {
		var incomingMsg = {
			device: req.params.deviceid,
			method: req.params.method,
			dimlevel: req.params.dimlevel || ''
		};

		var out = normalizeTellstickCommand(incomingMsg);

		if (out.err === true) {
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(out));
			res.end();
			return;
		}

		for (var i = 0; i < Settings.get('repeatSendTimes'); i++) {
			if (i === 0) {
				tellstickMethods.queue(out, function(err, status) {
					if (err) {
						res.writeHead(500, {'Content-Type': 'application/json'});
						out.err = true;
						out.errWarnStr = err.message;
						res.write(JSON.stringify(out));
						res.end();
					} else {
						out.status = status;
						res.writeHead(200, {'Content-Type': 'application/json'});
						res.write(JSON.stringify(out));
						res.end();
					}
				});
			} else {
				setTimeout(function() {
					tellstickMethods.queue(out);
				}, i * Settings.get('repeatSendInterval'));
			}
		}

	});


	/**
	 * API: Give the client a single device and its configured parameters.
	 */
	RED.httpAdmin.get('/tellstick/device/:deviceid', function(req, res) {

		var deviceId = parseInt(req.params.deviceid);

		if (is.not.integer(deviceId)) {
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({
				errStr: 'Device needs to be a number'
			}));
			res.end();
			return;
		}

		tellstickDevices.getDevices(deviceId, function (errDevices, device) {
			if (errDevices) {
				res.writeHead(500, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(errDevices));
				res.end();
			} else {
				tellstickDevices.getParametersValues(deviceId, function (errParameters, parameters) {
					if (errParameters) {
						res.writeHead(500, {'Content-Type': 'application/json'});
						res.write(JSON.stringify(errParameters));
						res.end();
					} else {
						device.parameters = parameters;
						device.brand = tellstickDevices.getBrandFromModel(device.model);
						res.writeHead(200, {'Content-Type': 'application/json'});
						res.write(JSON.stringify(device));
						res.end();
					}
				});
			}
		});
	});


	/**
	 * API: Give the client a list of all configured devices
	 */
	RED.httpAdmin.get('/tellstick/device', function(req, res) {
		tellstickDevices.getDevices(function (err, data) {
			if (err) {
				res.writeHead(500, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(err));
				res.end();
				return;
			}
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(data));
			res.end();
		});
	});


	/**
	 * API: Delete Device
	 */
	RED.httpAdmin.delete('/tellstick/device/:id', function(req, res) {
		var deviceId = parseInt(req.params.id);

		if (is.not.integer(deviceId)) {
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({
				errStr: 'deviceId needs to be a number'
			}));
			res.end();
			return;
		}

		telldus.removeDevice(deviceId, function(err) {
			if (err) {
				res.writeHead(404, {'Content-Type': 'application/json'});
				res.write(JSON.stringify({
					errStr: err.message
				}));
				res.end();
				return;
			}
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({
				id: deviceId,
				status: 'deleted'
			}));
			res.end();
		});
	});


};

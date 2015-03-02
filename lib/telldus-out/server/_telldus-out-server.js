'use strict';

var telldus = require('telldus');

/**
 * Check if str is number.
 * @param str
 * @returns {boolean}
 */
function isNumber(str) {
	return (typeof str === 'number' && (str % 1) === 0);
}


function normalizeTelldusCommand(incomingMsg, node) {
	/**
	 * Merge incoming msg with config set on the node.
	 * Incoming msg will take precedence over configuration set
	 * on the node itself.
	 */
	var msg = {
		device: '',
		method: '',
		dimlevel: '',
		err: false,
		warn: false,
		errWarnStr: ''
	};
	Object.keys(msg).forEach(function (key) {
		if (incomingMsg.hasOwnProperty(key)) {
			msg[key] = incomingMsg[key];
		} else {
			if(node) {
				msg[key] = node[key];
			}
		}
	});


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
	if (!isNumber(msg.device)) {
		msg.err = true;
		msg.errWarnStr = "Value for 'device' is not a number. Please select a device in the output node, or send a device in the msg: 'msg: {device: 1}'";
	}
	if (msg.method === 2) {
		if (isNumber(msg.dimlevel)) {
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


/**
 * Send command to Telldus
 */
function invokeTelldusMethod(msg, cb) {
	if (msg.method === 0) {
		telldus.turnOff(msg.device, function(err) {
			if (err) {
				cb(err);
			}
			cb(null, { name: 'OFF' });
		});
	} else if (msg.method === 1) {
		telldus.turnOn(msg.device, function(err) {
			if (err) {
				cb(err);
			}
			cb(null, { name: 'ON' });
		});
	} else if (msg.method === 2) {
		telldus.dim(msg.device, msg.dimlevel, function(err) {
			if (err) {
				cb(err);
			}
			cb(null, { name: 'DIM', level: msg.dimlevel });
		});
	} else if (msg.method === 3) {
		telldus.bell(msg.device, function(err) {
			if (err) {
				cb(err);
			}
			cb();
		});
	} else if (msg.method === 4) {
		telldus.learn(msg.device, function(err) {
			if (err) {
				cb(err);
			}
			cb();
		});
	}
}



module.exports = function(RED) {
	var telldusDeviceTypes = require('./lib/telldusDeviceTypes.js');

	/**
	 * Create Node
	 * @param n
	 * @constructor
	 */
	function TelldusOutNode(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name;
		this.device = n.device || '';
		this.method = n.method || '';
		this.dimlevel = n.dimlevel || '';
		this.devicefriendlyname = n.devicefriendlyname || '';

		/**
		 * Display Telldus Status on Node
		 */
		var telldusShared = require('./lib/telldusEvents.js');

		var telldusStatus = telldusShared.getStatus();
		if (telldusStatus.status === 0) {
			this.status({fill: 'green', shape: 'ring', text: 'connected'});
		} else {
			this.status({fill: 'red', shape: 'ring', text: telldusStatus.errStr});
		}

		var node = this;


		/**
		 * On Input
		 */
		this.on('input', function(incomingMsg) {
			var msg = normalizeTelldusCommand(incomingMsg, node);

			// todo - send error/warn message to the browser
			if (msg.err === true) {
				this.error(msg.errWarnStr);
				return;
			} else if (msg.warn === true) {
				this.warn(msg.errWarnStr);
			}

			invokeTelldusMethod(msg, function(err) {
				if (err) {
					node.error(JSON.stringify(err));
				}
			});
		});
	}
	RED.nodes.registerType('telldus-out', TelldusOutNode);


	/**
	 * API: Give the client a list of all brands
	 */
	RED.httpAdmin.get('/telldus/supported-brands', function(req, res) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(telldusDeviceTypes.getBrands()));
		res.end();
	});


	/**
	 * API: Give the client a list of all device types for a given brand
	 */
	RED.httpAdmin.get('/telldus/supported-devices/:id', function(req, res) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(telldusDeviceTypes.getModels(req.params.id)));
		res.end();
	});


	/**
	 * Add new device
	 */
	function addNewDevice(deviceObj, cb) {
		// todo: add error handling and validation.
		var deviceId = telldus.addDeviceSync();
		telldus.setName(deviceId, deviceObj.name, function () {
			telldus.setProtocol(deviceId, deviceObj.protocol, function () {
				telldus.setModel(deviceId, deviceObj.model, function() {
					Object.keys(deviceObj.parameters).forEach(function (param) {
						telldus.setDeviceParameterSync(deviceId, param, deviceObj.parameters[param]);
					});
					deviceObj.status = 'added';
					cb(deviceObj);
				});
			});
		});
	}


	/**
	 * API: Add new device
	 */
	RED.httpAdmin.post('/telldus/device', function(req, res) {
		addNewDevice(req.body, function (status) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(status));
			res.end();
		});

	});



	/**
	 * API: Invoke method (on, off, dim, bell, learn)
	 *
	 */
	RED.httpAdmin.get('/telldus/invoke/:deviceid/:method/:dimlevel?', function(req, res) {
		var incomingMsg = {
			device: req.params.deviceid,
			method: req.params.method,
			dimlevel: req.params.dimlevel || ''
		};

		var out = normalizeTelldusCommand(incomingMsg);

		if (out.err === true) {
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(out));
			res.end();
			return;
		}

		invokeTelldusMethod(out, function(err, status) {
			if (err) {
				out.err(JSON.stringify(err));
				res.writeHead(400, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(out));
				res.end();
			} else {
				out.status = status;
				res.writeHead(200, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(out));
				res.end();
			}
		});
	});


	/**
	 * API: Give the client a single device and its configured parameters.
	 */
	RED.httpAdmin.get('/telldus/device/:deviceid', function(req, res) {

		var deviceId = parseInt(req.params.deviceid);

		if (!isNumber(deviceId)) {
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.write(JSON.stringify({
				errStr: 'Device needs to be a number'
			}));
			res.end();
			return;
		}

		telldusDeviceTypes.getDevices(deviceId, function (errDevices, device) {
			if (errDevices) {
				res.writeHead(500, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(errDevices));
				res.end();
			} else {
				telldusDeviceTypes.getParametersValues(deviceId, function (errParameters, parameters) {
					if (errParameters) {
						res.writeHead(500, {'Content-Type': 'application/json'});
						res.write(JSON.stringify(errParameters));
						res.end();
					} else {
						device.parameters = parameters;
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
	RED.httpAdmin.get('/telldus/device', function(req, res) {
		telldusDeviceTypes.getDevices(function (err, data) {
			if (err) {
				res.writeHead(500, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(err));
				res.end();
			} else {
				res.writeHead(200, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(data));
				res.end();
			}
		});
	});


};

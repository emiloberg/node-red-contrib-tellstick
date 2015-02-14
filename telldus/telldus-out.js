
module.exports = function(RED) {
	'use strict';

	var telldus = require('telldus');

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

			/**
			 * Check if str is number.
			 * @param str
			 * @returns {boolean}
			 */
			function isNumber(str) {
				return (typeof str === 'number' && (str % 1) === 0);
			}


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
				if (incomingMsg.hasOwnProperty(key)) {
					msg[key] = incomingMsg[key];
				} else {
					msg[key] = node[key];
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
			}


			/**
			 * Validate msg
			 */
			if (!isNumber(msg.device)) {
				this.error('[Telldus] Value for \'device\' is not a number. Please select a device in the output node, or send a device in the msg: \'msg: {device: 1}\'');
				return;
			}
			if (msg.method === 2) {
				if (isNumber(msg.dimlevel)) {
					if (msg.dimlevel < 0) {
						msg.dimlevel = 0;
						this.warn('[Telldus] \'dimlevel\' is < 0, setting dimlevel to 0 (min value)');
					} else if (msg.dimlevel > 255) {
						msg.dimlevel = 255;
						this.warn('[Telldus] \'dimlevel\' is > 255, setting dimlevel to 255 (max value)');
					}
				} else {
					this.error('[Telldus] \'method\' is set to \'dim\' but no valid \'dimlevel\' is supplied. Need to be a number between 0 and 255.');
					return;
				}
			} else if (!(msg.method === 0 || msg.method === 1)) {
				this.error('[Telldus] No valid method is supplied. Please select a method in the output node, or send a method in the msg: \'msg: {method: \'turnon\'}\'. Valid method are \'turnon\' (or \'1\'), \'turnoff\' (or \'0\'), \'dim\' (or \'2\')');
				return;
			}


			/**
			 * Convert 'dim to 0' to 'turnoff'
			 */
			if (msg.method === 2 && msg.dimlevel === 0) {
				msg.methord = 0;
			}


			/**
			 * Send command to Telldus
			 */
			if (msg.method === 0) {
				telldus.turnOff(msg.device, function(err) {
					if (err) {
						node.error(JSON.stringify(err));
					}
				});
			} else if (msg.method === 1) {
				telldus.turnOn(msg.device, function(err) {
					if (err) {
						node.error(JSON.stringify(err));
					}
				});
			} else if (msg.method === 2) {
				telldus.dim(msg.device, msg.dimlevel, function(err) {
					if (err) {
						node.error(JSON.stringify(err));
					}
				});
			}

		});
	}
	RED.nodes.registerType('telldus-out', TelldusOutNode);


	/**
	 * Give the client a list of all configured devices when asked for.
	 */
	RED.httpAdmin.get('/telldus/devices', function(req, res) {
		telldus.getDevices(function(err, data) {
			if (err) {
				res.writeHead(500, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(err));
				res.end();
			} else {

				// Unsure if there's anything else than 'devices' but lets filter
				// them anyways.
				data = data.filter(function (device) {
					return device.type === 'DEVICE';
				});

				// Convert method array into properties object for better API.
				var methods;
				for (var i = 0; i < data.length; i++) {
					methods = {};
					/*eslint-disable no-loop-func */
					data[i].methods.forEach(function (method) {
						methods[method.toLowerCase()] = true;
					});
					/*eslint-enable no-loop-func */
					data[i].methods = methods;
				}

				res.writeHead(200, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(data));
				res.end();
			}
		});



	});

};

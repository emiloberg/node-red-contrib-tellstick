	

module.exports = function(RED) {
	'use strict';

	var Settings = require('./lib/settings.js');
	var tellstickEvents = require('./lib/tellstickEvents.js');

	/**
	 * If set: Read input throttle time from Node-RED settings
	 * and update our settings with that value.
	 */
	if (RED.settings.functionGlobalContext.hasOwnProperty('tellstickInputThrottle')) {
		Settings.update('inputThrottle', RED.settings.functionGlobalContext.tellstickInputThrottle);
	}


	/**
	 * Make the Tellstick event service start giving us data
	 */
	tellstickEvents.startEmittingData();


	/**
	 * Helper, get a string, convert into number if possible.
	 *
	 * @param str
	 * @returns {*}
	 */
	function makeNumberIntoRealNumber(str) {
		var maybeNumber = parseFloat(str);
		if (isNaN(maybeNumber)) {
			return str;
		} else {
			return maybeNumber;
		}
	}

	/**
	 * Create in node
	 *
	 * @param n
	 * @constructor
	 */
	function TellstickInNode(n) {
		RED.nodes.createNode(this, n);

		this.name = n.name;
		this.inputconfig = n.inputconfig;

		/**
		 * If in node is yet configured, just
		 * set node status indicator in front end and return.
		 */
		this.configNode = RED.nodes.getNode(n.inputconfig);
		if (this.configNode === undefined) {
			this.status({fill: 'yellow', shape: 'ring', text: 'No input deployed'});
			return;
		}

		/**
		 * Display Tellstick Status on Node
		 */
		var tellstickStatus = tellstickEvents.getStatus();
		if (tellstickStatus.status === 0) {
			this.status({fill: 'green', shape: 'ring', text: 'listening'});
		} else {
			this.status({fill: 'red', shape: 'ring', text: tellstickStatus.errStr});
		}

		/**
		 * Set up matching rules.
		 *
		 */
		this.matchRules = {
			class: this.configNode.deviceclass || null,
			protocol: makeNumberIntoRealNumber(this.configNode.deviceprotocol) || null,
			group: makeNumberIntoRealNumber(this.configNode.devicegroup) || null,
			house: makeNumberIntoRealNumber(this.configNode.devicehouse) || null,
			method: makeNumberIntoRealNumber(this.configNode.devicemethod) || null,
			model: makeNumberIntoRealNumber(this.configNode.devicemodel) || null,
			unit: makeNumberIntoRealNumber(this.configNode.deviceunit) || null,
			code: makeNumberIntoRealNumber(this.configNode.devicecode) || null,
			id: makeNumberIntoRealNumber(this.configNode.deviceid) || null
		};

		var node = this;

		/**
		 * See if the incoming data is matching the rule for
		 * this node and if so, trigger the node and output
		 * the complete data object.
		 *
		 * @param {string} data Incoming raw tellstick data.
		 */
		var checkAndSendData = function (data) {
			data = data.slice(0, -1);
			var dataObj = {};
			data.split(';').forEach(function (kvp) {
				dataObj[kvp.split(':')[0]] = makeNumberIntoRealNumber(kvp.split(':')[1]);
			});

			var isMatch = true;
			Object.keys(node.matchRules).forEach(function (key) {
				if (node.matchRules[key] !== null) {
					if (node.matchRules[key] !== dataObj[key]) {
						isMatch = false;
					}
				}
			});

			if (isMatch) {
				node.send(dataObj);
			}
		};
		tellstickEvents.events.on('tellstick-incoming', checkAndSendData);


		/**
		 * Stop listening to data when removed.
		 */
		this.on('close', function() {
			tellstickEvents.events.removeListener('tellstick-incoming', checkAndSendData);
		});

	}
	RED.nodes.registerType('tellstick-in', TellstickInNode);

};


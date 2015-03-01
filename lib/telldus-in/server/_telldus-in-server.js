module.exports = function(RED) {
	'use strict';

	/**
	 * Telldus In
	 *
	 */

	var telldusShared = require('./lib/telldusEvents.js');
	telldusShared.startEmittingData();

	function makeNumberIntoRealNumber(str) {
		var maybeNumber = parseFloat(str);
		if (isNaN(maybeNumber)) {
			return str;
		} else {
			return maybeNumber;
		}
	}

	function TelldusInNode(n) {
		RED.nodes.createNode(this, n);

		this.name = n.name;
		this.inputconfig = n.inputconfig;

		if (n.inputconfig === undefined) {
			this.status({fill: 'yellow', shape: 'ring', text: 'No input deployed'});
			return;
		}

		this.configNode = RED.nodes.getNode(n.inputconfig);
		this.matchRules = {
			class: this.configNode.deviceclass || '',
			protocol: makeNumberIntoRealNumber(this.configNode.deviceprotocol) || null,
			group: makeNumberIntoRealNumber(this.configNode.devicegroup) || null,
			house: makeNumberIntoRealNumber(this.configNode.devicehouse) || null,
			method: makeNumberIntoRealNumber(this.configNode.devicemethod) || null,
			model: makeNumberIntoRealNumber(this.configNode.devicemodel) || null,
			unit: makeNumberIntoRealNumber(this.configNode.deviceunit) || null,
			code: makeNumberIntoRealNumber(this.configNode.devicecode) || null,
			id: makeNumberIntoRealNumber(this.configNode.deviceid) || null
		};


		/**
		 * Display Telldus Status on Node
		 */
		var telldusStatus = telldusShared.getStatus();
		if (telldusStatus.status === 0) {
			this.status({fill: 'green', shape: 'ring', text: 'connected'});
		} else {
			this.status({fill: 'red', shape: 'ring', text: telldusStatus.errStr});
		}

		var node = this;

		/**
		 *  See if the incoming data is matching the rule for
		 *  this node and if so, send all data as a node.send.
		 *
		 * @param {string} data Incoming raw telldus data.
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
		telldusShared.events.on('telldus-incoming', checkAndSendData);


		/**
		 * Stop listening to data when removed.
		 */
		this.on('close', function() {
			telldusShared.events.removeListener('telldus-incoming', checkAndSendData);
		});

	}
	RED.nodes.registerType('telldus-in', TelldusInNode);


};

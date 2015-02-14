
module.exports = function(RED) {
	'use strict';

	/**
	 * Telldus In
	 *
	 */
	var telldusShared = require('./lib/telldusEvents.js');

	function TelldusInNode(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name;
		this.inputconfig = n.inputconfig;

		this.configNode = RED.nodes.getNode(n.inputconfig);
		this.matchRules = {
			class: this.configNode.deviceclass || '',
			protocol: this.configNode.deviceprotocol || '',
			group: this.configNode.devicegroup || '',
			house: this.configNode.devicehouse || '',
			method: this.configNode.devicemethod || '',
			model: this.configNode.devicemodel || '',
			unit: this.configNode.deviceunit || '',
			code: this.configNode.devicecode || '',
			id: this.configNode.deviceid || ''
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
				dataObj[kvp.split(':')[0]] = kvp.split(':')[1];
			});

			var isMatch = true;
			Object.keys(node.matchRules).forEach(function (key) {
				if (node.matchRules[key].length > 0) {
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

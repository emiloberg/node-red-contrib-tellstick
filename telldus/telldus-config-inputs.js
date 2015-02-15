
module.exports = function(RED) {
	'use strict';

	var telldusShared = require('./lib/telldusEvents.js');

	/**
	 * Create node
	 */
	function TelldusInputsConfigNode(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name;
		this.deviceclass = n.deviceclass;
		this.deviceprotocol = n.deviceprotocol;
		this.devicegroup = n.devicegroup;
		this.devicehouse = n.devicehouse;
		this.devicemethod = n.devicemethod;
		this.devicemodel = n.devicemodel;
		this.deviceunit = n.deviceunit;
		this.devicecode = n.devicecode;
		this.deviceid = n.deviceid;

		telldusShared.startEmittingData();
	}
	RED.nodes.registerType('telldus-config-inputs', TelldusInputsConfigNode);


	/**
	 * Send telldus data to client
	 */
	var wsSendDataToClient = function (data) {
		RED.comms.publish('telldus-transmission', data);
	};
	telldusShared.events.on('telldus-incoming', wsSendDataToClient);


};

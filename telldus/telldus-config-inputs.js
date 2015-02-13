/**
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/


module.exports = function(RED) {
	'use strict';

	var telldusShared = require('./lib/telldusEvents.js');

	var deviceListenHeartbeat;
	var heartbeatInterval = null;

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


	/**
	 * Start sending incoming telldus data to the client when the client
	 * ask us to.
	 */
	RED.httpAdmin.get('/telldus/send-raw-data-over-ws/start', function(req, res) {

		//var tempMsg = 'class:command;protocol:myprot;model:mymodel;house:1234;unit:1;code:101101;method:turnon;';
		//RED.comms.publish('telldus-transmission', tempMsg);
		telldusShared.events.on('telldus-incoming', wsSendDataToClient);

		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(telldusShared.getStatus()));
		res.end();

		/**
		 * Start the heartbeat checker. If client hasn't given us a heartbeat
		 * in more than X seconds, treat the connection as dead and stop
		 * sending data to it.
		 */
		deviceListenHeartbeat = new Date().getTime();
		heartbeatInterval = setInterval(function(){
			var timeSinceLastHB = new Date().getTime() - deviceListenHeartbeat;
			if (timeSinceLastHB > 3500) {
				console.log('Lost Heartbeat, closing');
				telldusShared.events.removeListener('telldus-incoming', wsSendDataToClient);
				clearInterval(heartbeatInterval);
			}
		}, 3000);
	});


	/**
	 * Register heartbeat when client send us one.
	 */
	RED.httpAdmin.get('/telldus/send-raw-data-over-ws/heartbeat', function(req, res) {
		deviceListenHeartbeat = new Date().getTime();
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end();
	});


	/**
	 * Stop sending data when client ask us to
	 */
	RED.httpAdmin.get('/telldus/send-raw-data-over-ws/stop', function(req, res) {
		telldusShared.events.removeListener('telldus-incoming', wsSendDataToClient);
		clearInterval(heartbeatInterval);
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end();
	});
};

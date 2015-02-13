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
	"use strict";

	var telldusShared = require('./lib/telldusEvents.js');
	var deviceListenHeartbeat;

	function TelldusInputsConfigNode(n) {
		RED.nodes.createNode(this,n);
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

		// Start Event Emitter.
		telldusShared.startListen();
	}
	RED.nodes.registerType("telldus-config-inputs", TelldusInputsConfigNode);


	
	RED.httpAdmin.get("/telldus/listen",function(req,res) {

		////var tempMsg = 'class:command;protocol:myprot;model:mymodel;house:1234;unit:1;code:101101;method:turnon;';
		////RED.comms.publish('telldus-transmission', tempMsg);

		// Listen to incoming Telldus data and send it to the browser over WebSockets.
		var throttleLimit = 300;
		var throttleData = {};
		var incomingData = function (data) {
			if (!throttleData.hasOwnProperty(data)) {
				throttleData[data] = true;
				RED.comms.publish("telldus-transmission",data);
				console.log('Inputs        | Got data > ' + data);
			}
			setTimeout(function (prop) {
				delete throttleData[prop];
			}, throttleLimit, data);
		};
		telldusShared.events.on("telldus-incoming", incomingData);

		// Send Telldus Status as JSON Response
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(telldusShared.getStatus()));
		res.end();

		// Check if connection is alive
		deviceListenHeartbeat = new Date().getTime();
		var heartbeatInterval = setInterval(function(){
			var timeSinceLastHB = new Date().getTime() - deviceListenHeartbeat;

			if (timeSinceLastHB > 3500) {
				console.log('Lost Heartbeat, closing');
				telldusShared.events.removeAllListeners('telldus-incoming');
				clearInterval(heartbeatInterval);
			}
		}, 3000);
	});

	RED.httpAdmin.get("/telldus/listen-heartbeat",function(req,res) {
		deviceListenHeartbeat = new Date().getTime();
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end();
	});

};

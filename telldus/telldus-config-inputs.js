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



		var telldusShared = require('./lib/telldusEvents.js');
		telldusShared.start('Started from Config');
		


		//var debData = {};
		//var telldus = require('telldus');
		//var listener = telldus.addRawDeviceEventListener(function(controllerId, data) {
		//	if (!debData.hasOwnProperty(data)) {
		//		debData[data] = true;
		//		//RED.comms.publish("telldus-transmission",data);
		//		console.log('DATA > ' + data);
		//	}
		//	setTimeout(function (prop) {
		//		delete debData[prop];
		//	}, 300, data);
		//});

		//if(listener > 0) {
		//	telldus.getErrorString(listener, function (err, errStr) {
		//		var errMsg = {err: errStr};
		//		res.writeHead(200, {'Content-Type': 'application/json'});
		//		res.write(JSON.stringify(errMsg));
		//		res.end();
		//	});
		//}


	}
	RED.nodes.registerType("telldus-config-inputs", TelldusInputsConfigNode);





	


	RED.httpAdmin.get("/telldus/listen",function(req,res) {

		//var tempMsg = 'class:command;protocol:myprot;model:mymodel;house:1234;unit:1;code:101101;method:turnon;';
		//RED.comms.publish('telldus-transmission', tempMsg);

		/**
		* Listen to raw Telldus data
		*
		* As this is radio traffic, a transmitter usually sends the same data
		* about 6 times. The Telldus does debounce this, but not all that good,
		* sometimes it will give us duplicate data. Therefor we throttle the data.
		*
		*/
		var debData = {};
		var xtelldus = require('telldus');
		var listener = xtelldus.addRawDeviceEventListener(function(controllerId, data) {
			if (!debData.hasOwnProperty(data)) {
				debData[data] = true;
				RED.comms.publish("telldus-transmission",data);
			}
			setTimeout(function (prop) {
				delete debData[prop];
			}, 300, data);
		});

		if(listener > 0) {
			xtelldus.getErrorString(listener, function (err, errStr) {
				var errMsg = {err: errStr};
				res.writeHead(200, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(errMsg));
				res.end();
			});
		}




	});

};

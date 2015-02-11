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

	function TelldusOutNode(n) {
		RED.nodes.createNode(this,n);
		this.name = n.name;
		this.device = n.device || "";
		this.method = n.method || "";
		this.dimvalue = n.dimvalue || "";
		this.devicefriendlyname = n.devicefriendlyname || "";
	}
	RED.nodes.registerType("telldus-out",TelldusOutNode);


	// Kolla hardware/35-arduino.js
	RED.httpAdmin.get("/telldus/devices",function(req,res) {
		res.writeHead(200, {'Content-Type': 'application/json'});


		var telldus = require('telldus');
		telldus.getDevices(function(err, data) {
			if (err) {
				// Todo, make this into Node-RED error. How do you do that?
				console.log('Telldus Error: ');
				console.log(require('util').inspect(err, { showHidden: true, depth: null, colors: true }));
			} else {

				// Only get Devices
				data = data.filter(function (device) {
					return device.type === 'DEVICE';
				});

				// Convert method array into properties object for better API.
				var methods;
				for (var i = 0; i < data.length; i++) {
					methods = {};
					/*jshint -W083 */
					data[i].methods.forEach(function (method) {
						methods[method.toLowerCase()] = true;
					});
					/*jshint +W083 */
					data[i].methods = methods;
				}

				res.write(JSON.stringify(data));
				res.end();
			}
		});



	});

};

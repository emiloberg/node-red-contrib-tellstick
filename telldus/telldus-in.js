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

	/**
	 * Telldus In
	 *
	 */
	var telldusShared = require('./lib/telldusEvents.js');

	function TelldusInNode(n) {
		RED.nodes.createNode(this,n);
		this.name = n.name;
		this.inputconfig = n.inputconfig;

		var node = this;

		var incomingData = function (data) {
			//console.log(n.name + " | IN | event has occured: " + data);
			node.send(data);
		};

		telldusShared.events.on("telldus-incoming", incomingData);

		this.on('close', function() {
			telldusShared.events.removeListener("telldus-incoming", incomingData);
		});

	}
	RED.nodes.registerType("telldus-in", TelldusInNode);


};

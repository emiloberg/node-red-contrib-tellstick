/*eslint-env browser, jquery */
/*global RED */

'use strict';

RED.nodes.registerType('tellstick-in', {
	category: 'input',
	defaults: {
		name: {value: ''},
		inputconfig: {
			type: 'tellstick-input',
			required: true
		}
	},
	color: '#abd3ff',
	inputs: 0,
	outputs: 1,
	icon: 'tellstick-icon.png',
	label: function() {

		var inputconfigNodeLabel = '';
		if (this.inputconfig) {
			var inputconfigNode = RED.nodes.node(this.inputconfig);
			inputconfigNodeLabel = inputconfigNode.label();
		}

		return this.name || inputconfigNodeLabel || 'tellstick in';
	},
	labelStyle: function() {
		return this.name ? 'node_label_italic' : '';
	}
});

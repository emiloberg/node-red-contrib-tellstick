RED.nodes.registerType('telldus-in',{
	category: 'input',
	defaults: {
		name: {value:""},
		inputconfig: {type:"telldus-input", required:true}
	},
	color:"#abd3ff",
	inputs:0,
	outputs:1,
	icon: "bridge-dash.png",
	label: function() {

		var inputconfigNodeLabel = '';
		if (this.inputconfig) {
			var inputconfigNode = RED.nodes.node(this.inputconfig);
			inputconfigNodeLabel = inputconfigNode.label();
		}

		return this.name || inputconfigNodeLabel || "telldus in";
	},
	labelStyle: function() {
		return this.name?"node_label_italic":"";
	}
});

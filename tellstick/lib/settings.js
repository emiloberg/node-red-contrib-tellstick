'use strict';


var Settings = {
	outputThrottle: 900,
	inputThrottle: 500
};

function get(setting) {
	return Settings[setting];
}

function update(setting, val) {
	Settings[setting] = val;
	return val;
}

module.exports.get = get;
module.exports.update = update;

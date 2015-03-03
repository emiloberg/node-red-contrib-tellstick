'use strict';


var telldus = require('telldus');
var deviceTypes = require('./../resources/deviceTypesConfigurations.json');

function getBrands() {
	var brands = {};
	Object.keys(deviceTypes).forEach(function (protocol) {
		Object.keys(deviceTypes[protocol]).forEach(function (type) {
			deviceTypes[protocol][type].devices.forEach(function (device) {
				brands[device.brand] = true;
			});
		});
	});
	return Object.keys(brands).map(function (brand) {
		return brand;
	}).sort();
}

function getBrandFromModel(modelName) {
	var ret = '';
	Object.keys(deviceTypes).forEach(function (protocol) {
		Object.keys(deviceTypes[protocol]).forEach(function (type) {
			deviceTypes[protocol][type].devices.forEach(function (device) {
				if (device.model === modelName) {
					ret = device.brand;
				}
			});
		});
	});
	return ret;
}


function getModels(brandName) {
	var models = [];
	Object.keys(deviceTypes).forEach(function (protocol) {
		return Object.keys(deviceTypes[protocol]).forEach(function (type) {
			return deviceTypes[protocol][type].devices.forEach(function (device) {
				if (device.brand === brandName) {
					var outModel = device;
					outModel.protocol = protocol;
					outModel.type = type;
					outModel.parameters = deviceTypes[protocol][type].parameters;
					models.push(outModel);
				}
			});
		});
	});
	return models;
}

function getParametersName(modelName) {
	var ret = {};
	Object.keys(deviceTypes).forEach(function (protocol) {
		Object.keys(deviceTypes[protocol]).forEach(function (type) {
			deviceTypes[protocol][type].devices.forEach(function (device) {
				if (device.model === modelName) {
					ret = deviceTypes[protocol][type].parameters;
				}
			});
		});
	});
	return ret;
}

function getDevice(deviceId) {

	var out = {
		id: deviceId,
		methods: {},
		model: '',
		name: '',
		protocol: '',
		status: {},
		type: ''
	};

	return out;
}

function getDevices(deviceId, cb) {
	// todo validate deviceId
	if(!cb) {
		cb = deviceId;
		deviceId = -1;
	}

	telldus.getDevices(function(err, data) {
		if (err) {
			cb(err);
		} else {

			// If requested with a DeviceId, only return that device.
			// Unsure if there's anything else than 'devices' but lets filter
			// them anyways.
			data = data.filter(function (device) {
				if (deviceId > 0) {
					return device.id === deviceId && device.type === 'DEVICE';
				}
				return device.type === 'DEVICE';
			});

			// Sort
			data.sort(function (a, b) {
				if (a.name > b.name) {
					return 1;
				}
				if (a.name < b.name) {
					return -1;
				}
				return 0;
			});

			// Convert method array into properties object for better API.
			var methods;
			for (var i = 0; i < data.length; i++) {
				methods = {};
				/*eslint-disable no-loop-func */
				data[i].methods.forEach(function (method) {
					methods[method.toLowerCase()] = true;
				});
				/*eslint-enable no-loop-func */
				data[i].methods = methods;
			}

			// If asked for a single device, make sure to return an object.
			if (deviceId > 0) {
				if (data.length === 1) {
					data = data[0];
				} else {
					cb(deviceId + ' did not resolve to a single device');
				}
			}

			cb(null, data);

		}
	});
}

function getParametersValues(deviceId, cb) {

	var when = require('when');
	var out = {};

	telldus.getModel(deviceId, function (err, model) {
		if (err) {
			cb(err);
			return;
		}

		var parametersName = Object.keys(getParametersName(model)).map(function (param) {
			return param;
		});

		var arrPromises = parametersName.map(function (method) {
			return when.promise(function(resolve, reject) {
				telldus.getDeviceParameter(deviceId, method, '', function(err2, value) {
					if (err2) {
						reject(err2);
					} else {
						resolve({
							method: method,
							value: value
						});
					}
				});
			});
		});

		when.settle(arrPromises).then(function(descriptors) {
			var hasErrors = false;
			descriptors.forEach(function (d) {
				if (d.state === 'fulfilled') {
					out[d.value.method] = d.value.value;
				} else {
					hasErrors = true;
				}
			});
			if (hasErrors) {
				cb('Could not find value for parameters');
			}
			cb(null, out);
		});

	});
}

module.exports.getDevice = getDevice;
module.exports.getDevices = getDevices;
module.exports.getBrands = getBrands;
module.exports.getModels = getModels;
module.exports.getParametersValues = getParametersValues;
module.exports.getBrandFromModel = getBrandFromModel;

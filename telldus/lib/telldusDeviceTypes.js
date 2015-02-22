'use strict';



var deviceTypes = require('./../resources/deviceTypesConfigurations.json');

//(function() {
//	var executed = false;
//	return function () {
//		if (!executed) {
//			executed = true;
//			deviceTypes = require('./../resources/deviceTypes.json');
//			deviceTypes = deviceTypes.sort(function (a, b) {
//				if (a.make > b.make) {
//					return 1;
//				} else if (a.make < b.make) {
//					return -1;
//				} else {
//					if (a.name > b.name) {
//						return 1;
//					} else if (a.name < b.name) {
//						return -1;
//					} else {
//						return 0;
//					}
//				}
//			});
//
//		}
//	};
//})();
//
//
//function get() {
//	return deviceTypes;
//}

function getProtocols() {
	return Object.keys(deviceTypes).map(function (protocol) {
		return protocol;
	});
}

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


function getModels(brandName) {
	var models = [];
	Object.keys(deviceTypes).forEach(function (protocol) {
		return Object.keys(deviceTypes[protocol]).forEach(function (type) {
			return deviceTypes[protocol][type].devices.forEach(function (device) {
				if (device.brand === brandName) {
					var outModel = device;
					outModel.protocol = protocol;
					outModel.type = type;
					models.push(outModel);
				}
			});
		});
	});
	return models;
}

//module.exports.getProtocols = getProtocols;
module.exports.getBrands = getBrands;
module.exports.getModels = getModels;

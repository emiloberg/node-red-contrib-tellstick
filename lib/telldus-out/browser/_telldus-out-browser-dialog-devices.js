/*eslint-env browser, jquery */
/*global node, showHideMethods, $ */

/**
 * Configure list configured devices dialog
 */
'use strict';

$('#telldus-dialog-list-configured-devices').dialog({
	dialogClass: 'telldus-list-configured-device-dialog no-close',
	autoOpen: false,
	modal: true,
	width: 900,
	maxHeight: ( $(window).height() - ( $(window).height() / 10 ) ),
	buttons: [
		{
			text: 'Add New Device',
			class: 'telldus-btn-add-new-device',
			click: function() {
				$('#telldus-dialog-add-edit-device').dialog('open');
			}
		},
		{
			text: 'Done',
			click: function() {
				$(this).dialog( 'close' );
			}
		}
	]
});


function statusObjToStr(statusObj) {
	if (statusObj.name === 'OFF') {
		return '<i class="fa fa-lightbulb-o telldus-status-icon-off telldus-status-icon"></i> Off';
	} else if (statusObj.name === 'ON') {
		return '<i class="fa fa-lightbulb-o telldus-status-icon-on telldus-status-icon"></i> On';
	} else if (statusObj.name === 'DIM') {
		return '<i class="fa fa-lightbulb-o telldus-status-icon-on telldus-status-icon"></i> ' + Math.round((statusObj.level / 255) * 100) + '%';
	} else {
		return 'Unknown';
	}
}


function deviceObjToButtons(deviceObj) {
	var strOut = '';
	if (deviceObj.methods.dim && deviceObj.methods.turnon && deviceObj.methods.turnoff) {
		strOut += '<a href="#" class="telldus-invoke-method-link" data-method="turnoff" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-off telldus-status-icon telldus-status-icon-button"></i></a>' +
		'<a href="#" class="telldus-invoke-method-link" data-method="dim" data-methodvalue="64" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-25 telldus-status-icon telldus-status-icon-button"></i></a>' +
		'<a href="#" class="telldus-invoke-method-link" data-method="dim" data-methodvalue="128" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-50 telldus-status-icon telldus-status-icon-button"></i></a>' +
		'<a href="#" class="telldus-invoke-method-link" data-method="dim" data-methodvalue="192" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-75 telldus-status-icon telldus-status-icon-button"></i></a>' +
		'<a href="#" class="telldus-invoke-method-link" data-method="dim" data-methodvalue="255" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-100 telldus-status-icon telldus-status-icon-button"></i></a>';
	} else {
		if (deviceObj.methods.turnoff === true) {
			strOut += '<a href="#" class="telldus-invoke-method-link" data-method="turnoff" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-off telldus-status-icon telldus-status-icon-button"></i></a>';
		}
		if (deviceObj.methods.turnon === true) {
			strOut += '<a href="#" class="telldus-invoke-method-link" data-method="turnon" data-deviceid="' + deviceObj.id + '"><i class="fa fa-lightbulb-o telldus-status-icon-100 telldus-status-icon telldus-status-icon-button"></i></a>';
		}
	}

	if (deviceObj.methods.bell === true) {
		strOut += '<a href="#" class="telldus-invoke-method-link" data-method="bell" data-deviceid="' + deviceObj.id + '"><i class="fa fa-bell-o telldus-status-icon-bell telldus-status-icon telldus-status-icon-button"></i></a>';
	}

	return strOut;
}


function methodObjToLearnButton(methodObj) {
	if (methodObj.learn) {
		return '<a href="#" class="telldus-button">Learn</a>';
	} else {
		return '';
	}
}


/**
 * Get all configured devices from backend, and populate device lists
 */
/*eslint-disable no-unused-vars*/
var devices = [];
function getAllDevicesAndPopulateLists() {
	$.getJSON('telldus/configured-devices', function(data) {
		devices = data;
		var jqOutputConfigDevices = $('#telldus-output-config-devices').find('tbody');
		var jqNodeInputDevice = $('#node-input-device');

		// Reset
		jqOutputConfigDevices.empty();
		jqNodeInputDevice
			.empty()
			.append('<option value=""></option>');


		data.forEach(function (device) {
			jqNodeInputDevice
				.append($('<option>', { value: device.id })
					.text(device.name));
			jqOutputConfigDevices
				.append(
				'<tr>' +
				'<td>' + statusObjToStr(device.status) + '</td>' +
				'<td>' + device.name + '</td>' +
				'<td>' + deviceObjToButtons(device) + '</td>' +
				'<td>' + methodObjToLearnButton(device.methods) + '</td>' +
				'<td class="telldus-config-column">' +
				'<a href="#" class="telldus-button">Configure</a>' +
				'</td>' +
				'<tr>'
			);
			//device.id
		});
		jqNodeInputDevice.find('option[value="' + node.device + '"]').prop('selected', true);
		showHideMethods(node.device, node.method);
	});
}
/*eslint-enable no-unused-vars*/

$('body').on('click', '.telldus-invoke-method-link', function() {
	var jqThis = $(this);
	var outObj = {
		id: jqThis.data('deviceid') || '',
		method: jqThis.data('method') || '',
		value: jqThis.data('methodvalue') || ''
	};

	$.getJSON('telldus/invoke/' + outObj.id + '/' + outObj.method + '/' + outObj.value, function(data) {

	});

	console.dir(outObj);

	//<a href="#" class="telldus-invoke-method-link" data-method="dim" data-methodvalue="64" data-deviceid="5"><i class="fa fa-lightbulb-o telldus-status-icon-25 telldus-status-icon telldus-status-icon-button"></i></a>
});

//$('.telldus-invoke-method-link').click(function(event){
//	event.preventDefault();
//	console.log('APA');
//	//$('#telldus-dialog-list-configured-devices').dialog('open');
//});

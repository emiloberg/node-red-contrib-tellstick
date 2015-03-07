/*eslint-env browser, jquery */
/*global $, RED, devices */

'use strict';

/**
 *  Event Listener - "Configure/Add Device" Button
 *  Open the "List of Configured Devices" dialog when button
 *  is pressed.
 */
$('#telldus-btn-open-device-list' ).click(function(event){
	event.preventDefault();
	$('#telldus-dialog-list-configured-devices').dialog('open');
});


/**
 * Event Listeners - "Device", "Method", "Dim-value"
 * Show/Hide user inputable fields.
 */
$('#node-input-device').change(function() {
	var jqNodeInputDevice = $('#node-input-device');
	var curDeviceId = jqNodeInputDevice.val();
	if (curDeviceId !== null) {
		$('#node-input-devicefriendlyname').val(jqNodeInputDevice.find('option:selected').text());
		showHideMethods(curDeviceId, $('#node-input-method').val());
	}
});
$('#node-input-method').change(function() {
	var curMethod = $('#node-input-method').val();
	if (curMethod !== null) {
		showHideDim(curMethod);
	}
});
$('#dimlevel-range').change(function() {
	$('#node-input-dimlevel').val($('#dimlevel-range').val());
});
$('#node-input-dimlevel').change(function() {
	$('#dimlevel-range').val($('#node-input-dimlevel').val());
});


/**
 * Populate methods select box with all methods for the current device
 * or hide it, if no device is selected.
 */
function showHideMethods(selectedDeviceId, selectedMethod) {
	var jqNodeInputMethod = $('#node-input-method');
	if (selectedDeviceId) {
		// Get data for current device

		var curDevice = devices.filter(function (device) {
			/*eslint-disable eqeqeq */
			return device.id == selectedDeviceId;
			/*eslint-enable eqeqeq */
		});
		if (curDevice.length === 0) {
			RED.notify('<strong>Error</strong>: could not find device with id \'' + selectedDeviceId + '\' configured on Tellstick', 'error');
			return;
		}
		curDevice = curDevice[0];
		$('.node-input-method').show();

		// Populate method select
		jqNodeInputMethod.find('option[value!=""]').remove();
		Object.keys(curDevice.methods).forEach(function (key) {
			if (key !== 'learn') {
				jqNodeInputMethod
					.append($('<option>', {value: key})
						.text(key));
			}
		});
		jqNodeInputMethod.find('option[value="' + selectedMethod + '"]').prop('selected', true);
	} else {
		$('.node-input-method').hide();
	}

	showHideDim(jqNodeInputMethod.val());
}


/**
 * Show/hide dim input fields, and sync range/text input.
 */
function showHideDim(currentMethod) {
	if (currentMethod === 'dim') {
		$('#dimlevel-range').val($('#node-input-dimlevel').val());
		$('.node-input-dimlevel').show();
	} else {
		$('.node-input-dimlevel').hide();
	}
}

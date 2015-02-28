/* ************************************************************* *\
 *
 *  Original Telldus-Out Dialog
 *
 \* ************************************************************* */


/**
 *  Event Listener - "Configure/Add Device" Button
 *  Open the "List of Configured Devices" dialog when button
 *  is pressed.
 */
$("#telldus-btn-open-device-list" ).click(function(event){
	event.preventDefault();
	$( "#telldus-dialog-list-configured-devices" ).dialog( "open" );
});


/**
 * Event Listeners - "Device", "Method", "Dim-value"
 * Show/Hide user inputable fields.
 */
$("#node-input-device").change(function() {
	var curDeviceId = $("#node-input-device").val();
	if (curDeviceId !== null) {
		$('#node-input-devicefriendlyname').val($('#node-input-device option:selected').text());
		showHideMethods(curDeviceId, $("#node-input-method").val());
	}
});
$("#node-input-method").change(function() {
	var curMethod = $("#node-input-method").val();
	if (curMethod !== null) {
		showHideDim(curMethod);
	}
});
$("#dimlevel-range").change(function() {
	$("#node-input-dimlevel").val($("#dimlevel-range").val());
});
$("#node-input-dimlevel").change(function() {
	$("#dimlevel-range").val($("#node-input-dimlevel").val());
});


/**
 * Populate methods select box with all methods for the current device
 * or hide it, if no device is selected.
 */
function showHideMethods(selectedDeviceId, selectedMethod) {
	if (selectedDeviceId) {
		// Get data for current device
		var curDevice = devices.filter(function (device) {
			return device.id == selectedDeviceId;
		});
		if (curDevice.length === 0) {
			RED.notify('<strong>Error</strong>: could not find device with id \'' + selectedDeviceId + '\' configured on Telldus device', 'error');
			return;
		}
		curDevice = curDevice[0];
		$('.node-input-method').show();

		// Populate method select
		$('#node-input-method option[value!=""]').remove();
		Object.keys(curDevice.methods).forEach(function (key) {
			if (key !== 'learn') {
				$('#node-input-method')
					.append($('<option>', {value: key})
						.text(key));
			}
		});
		$('#node-input-method option[value="' + selectedMethod + '"]').prop('selected', true);
	} else {
		$('.node-input-method').hide();
	}

	showHideDim($("#node-input-method").val())
}


/**
 * Show/hide dim input fields, and sync range/text input.
 */
function showHideDim(currentMethod) {
	if (currentMethod === 'dim') {
		$("#dimlevel-range").val($("#node-input-dimlevel").val());
		$('.node-input-dimlevel').show();
	} else {
		$('.node-input-dimlevel').hide();
	}
}
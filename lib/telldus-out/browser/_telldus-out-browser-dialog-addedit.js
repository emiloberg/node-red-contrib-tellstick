/*eslint-env browser, jquery */
/*global RED, window */

'use strict';

/**
 * Configure add/edit device dialog
 */
$('#telldus-dialog-add-edit-device').dialog({
	dialogClass: 'telldus-add-edit-device-dialog no-close form-horizontal',
	autoOpen: false,
	modal: true,
	width: 700,
	maxHeight: ( $(window).height() - ( $(window).height() / 10) ),
	buttons: [
		{
			text: 'Save Device',
			click: function() {
				var success = saveAddEdit();
				if (success) {
					$(this).dialog('close');
				}
			}
		},
		{
			text: 'Cancel',
			click: function() {
				$( this ).dialog('close');
			}
		}
	],
	close: function() {
		console.log('Dialog was closed');
	},
	open: function() {
		resetAllParametersFields();

		/**
		 * Make request to server for all supported Brands and
		 * populate "Brands" select box.
		 */
		$.getJSON('telldus/supported-brands', function(data) {
			// todo add error handling
			var jqSelectBrands = $('#telldus-select-supported-brands');
			jqSelectBrands.empty();
			jqSelectBrands.append('<option value=""></option>');
			data.forEach(function(brand) {
				jqSelectBrands.append('<option value="' + brand + '">' + brand + '</option>');
			});
		});
	}
});


function saveAddEdit() {

	/**
	 * Validate every input and build payload object
	 */
	var errStr = [];
	var jqSelectedBrands = $('#telldus-select-supported-brands').find(':selected');
	var jqSelectedDevice = $('#telldus-select-supported-devices').find(':selected');

	$('#telldus-dialog-add-edit-device').find('.input-error').removeClass('input-error');

	var payload = {
		model: jqSelectedDevice.data('model'),
		protocol: jqSelectedDevice.data('protocol'),
		type: jqSelectedDevice.data('type'),
		parameters: {}
	};

	if (jqSelectedDevice.val().length > 0 && jqSelectedBrands.val().length > 0) {
		var jqInputHouseNumber = $('#telldus-addedit-parameter-house-number');
		var jqInputHouseLetter = $('#telldus-addedit-parameter-house-letter');
		var jqInputUnit = $('#telldus-addedit-parameter-unit');
		var jqInputCode = $('#telldus-addedit-parameter-code');
		var jqInputName = $('#telldus-addedit-name');

		if (jqInputHouseNumber.data('use') === 'true') {
			if(validateParamInput(jqInputHouseNumber)) {
				payload.parameters.house = jqInputHouseNumber.val();
			} else {
				jqInputHouseNumber.addClass('input-error');
				errStr.push('non-valid house number');
			}
		}

		if (jqInputHouseLetter.data('use') === 'true') {
			if(validateParamInput(jqInputHouseLetter)) {
				payload.parameters.house = jqInputHouseLetter.val();
			} else {
				jqInputHouseLetter.addClass('input-error');
				errStr.push('non-valid house letter');
			}
		}

		if (jqInputUnit.data('use') === 'true') {
			if(validateParamInput(jqInputUnit)) {
				payload.parameters.unit = jqInputUnit.val();
			} else {
				jqInputUnit.addClass('input-error');
				errStr.push('non-valid unit');
			}
		}

		if (jqInputCode.data('use') === 'true') {
			payload.parameters.code = '';
			$('#telldus-row-addedit-parameter-code').find('input:checked').each(function () {
				if ($(this).val() === 'true') {
					payload.parameters.code += '1';
				} else {
					payload.parameters.code += '0';
				}
			});
		}

		if (jqInputName.val().trim().length > 0) {
			payload.name = jqInputName.val().trim();
			jqInputName.removeClass('input-error');
		} else {
			errStr.push('name is left blank');
			jqInputName.addClass('input-error');
		}
	} else {
		errStr.push('No device selected');
	}


	if (errStr.length > 0) {
		RED.notify('<strong>Telldus error</strong>: ' + errStr.join(', ') + '.', 'error');
		return false;
	}

	/**
	 * Send payload
	 */
	var jqXHR = $.post('/telldus/device', payload);

	jqXHR.fail(function(jqXHRObj) {
		RED.notify('<strong>Telldus error (err: 4)</strong>: ' + jqXHRObj.responseText, 'error');
	});

	jqXHR.done(function( data, textStatus, jqXHRObj) {
		var res = JSON.parse(jqXHRObj.responseText);
		if (res.status === 'added') {
			RED.notify('<strong>Device added!</strong>', 'success');
			/*eslint-disable no-undef */
			getAllDevicesAndPopulateLists();
			/*eslint-ensable no-undef */
			$('#telldus-dialog-add-edit-device').dialog('close');
		} else {
			RED.notify('<strong>Telldus error (err: 5)</strong>: Could not add device: ' + res.status, 'error');
		}
	});


}

/**
 * Reset all input fields (like if dialog has been opened before)
 */
function resetAllParametersFields() {
	$('.telldus-addedit-parameter-row').hide();
	$('#telldus-row-addedit-devices').hide();
	$('#telldus-addedit-parameter-house-number').val('');
	$('#telldus-addedit-parameter-house-letter').val('');
	$('#telldus-addedit-parameter-unit').val('');
	$('#telldus-addedit-name').val('');
	$('.telldus-addedit-param-input').data('use', 'false');
	$('.telldus-code-block input[value="false"]').prop('checked', true);
	$('.telldus-code-block input[value="true"]').prop('checked', false);
}


/**
 * Event Listener - "Brands" Select Box
 * Update "Device" Select Box when "Brands" Select Box is changed.
 */
$('#telldus-select-supported-brands').change(function () {
	if ($(this).find(':selected').val().length > 0) {
		updateDeviceSelect($(this).find(':selected').val());
	}
});


/**
 *  Event Listener - "Devices" Select Box
 */
$('#telldus-select-supported-devices').change(function () {
	var jqSelectedDevice = $(this).find(':selected');
	getAndDisplayModelParameters(
		jqSelectedDevice.data('paramhouse'),
		jqSelectedDevice.data('paramunit'),
		jqSelectedDevice.data('paramcode')
	);
});


/**
 *  Event Listener - Randomize button
 */
$('.telldus-random-button').click(function () {
	var jqThis = $(this);
	var min = jqThis.data('min');
	var max = jqThis.data('max');
	$('#' + jqThis.data('randomfor')).val(Math.floor(Math.random() * (max - min) + min));
});


/**
 *  Event Listener - Validate name input on blur
 */
$('#telldus-addedit-name').blur(function () {
	var jqThis = $(this);
	if (jqThis.val().trim().length > 0) {
		jqThis.removeClass('input-error');
	} else {
		jqThis.addClass('input-error');
	}
});


/**
 *  Event Listener - Validate parameters input on blur
 */
$('.telldus-addedit-param-input').blur(function () {
	var jqThis = $(this);
	if (validateParamInput(this) === true) {
		jqThis.removeClass('input-error');
	} else {
		jqThis.addClass('input-error');
	}
});


function isNumber(str) {
	return (typeof str === 'number' && (str % 1) === 0);
}


/**
 * Validate parameters inputs
 */
function validateParamInput(elem) {
	var jqInput = $(elem);
	var param = jqInput.data('param');
	jqInput.val(jqInput.val().trim().toUpperCase());
	var inputValue = jqInput.val();
	var span = param.split('-');
	if (span.length === 2) {
		if (isNumber(makeNumberIntoRealNumber(span[0])) && isNumber(makeNumberIntoRealNumber(span[1]))) {
			return (inputValue >= makeNumberIntoRealNumber(span[0]) && inputValue <= makeNumberIntoRealNumber(span[1]));
		} else {
			var Regex = new RegExp('^[' + param + ']$');
			return Regex.test(inputValue);
		}
	} else {
		return false;
	}
}



function getAndDisplayModelParameters(house, unit, code) {
	$('.telldus-addedit-parameter-row').hide();
	$('.telldus-addedit-param-input').data('use', 'false');

	if (house === undefined && unit === undefined && code === undefined) {
		return;
	}

	var jqCurrentRow;

	/**
	 * Show "House" input field
	 */
	if (house !== 'undefined' && house !== undefined) {
		var houseData = house.split('-');
		if (houseData.length === 2) {
			if (isNumber(makeNumberIntoRealNumber(houseData[0])) && isNumber(makeNumberIntoRealNumber(houseData[1]))) {
				/**
				 * House is a number span
				 */
				$('#telldus-addedit-parameter-house-number')
					.data('param', house)
					.data('use', 'true')
					.attr('maxlength', houseData[1].length);

				jqCurrentRow = $('#telldus-row-addedit-parameter-house-number');
				jqCurrentRow.find('.telldus-random-button')
					.data('min', houseData[0])
					.data('max', houseData[1]);
				jqCurrentRow.find('.telldus-parameter-help-text')
					.text('Number: ' + house);
				jqCurrentRow.show();
			} else {
				/**
				 * House is a letter span
				 */
				$('#telldus-addedit-parameter-house-letter')
					.data('param', house)
					.data('use', 'true')
					.attr('maxlength', houseData[1].length);

				$('#telldus-row-addedit-parameter-house-letter')
					.data('param', house)
					.show()
					.find('.telldus-parameter-help-text')
					.text('Characters: ' + house);

			}
		} else {
			RED.notify('<strong>Telldus error (err: 1)</strong>: "house" could not be understood, Configuration JSON file probably not correct', 'error');
		}
	}


	/**
	 * Show "Unit" input field
	 */
	if (unit !== 'undefined' && unit !== undefined) {
		var unitData = unit.split('-');
		if (unitData.length === 2) {
			if (isNumber(makeNumberIntoRealNumber(unitData[0])) && isNumber(makeNumberIntoRealNumber(unitData[1]))) {
				$('#telldus-addedit-parameter-unit')
					.data('param', unit)
					.data('use', 'true')
					.attr('maxlength', unitData[1].length);

				jqCurrentRow = $('#telldus-row-addedit-parameter-unit');
				jqCurrentRow.find('.telldus-parameter-help-text')
					.text('Number: ' + unit);
				jqCurrentRow.show();
			} else {
				RED.notify('<strong>Telldus error (err: 2)</strong>: "unit" could not be understood, Configuration JSON file probably not correct', 'error');
			}
		} else {
			RED.notify('<strong>Telldus error (err: 3)</strong>: "unit" could not be understood, Configuration JSON file probably not correct', 'error');
		}
	}


	/**
	 * Show "Code" input field
	 */
	if (code === true) {
		$('#telldus-addedit-parameter-code')
			.data('use', 'true');
		$('#telldus-row-addedit-parameter-code')
			.show();
	}
}


/**
 * Take brand name, make request to the server for all
 * devices of that brand name and populate the "Brands"
 * Select Box with those devices.
 */
function updateDeviceSelect(brandName, selectedModel) {
	$.getJSON('telldus/supported-devices/' + brandName, function(data) {
		var jqSelectDevices = $('#telldus-select-supported-devices');
		jqSelectDevices.empty();
		data.forEach(function (device) {
			jqSelectDevices.append(
				'<option data-brand="' + device.brand +
				'" data-model="' + device.model +
				'" data-protocol="' + device.protocol +
				'" data-type="' + device.type +
				'" data-paramhouse="' + device.parameters.house +
				'" data-paramunit="' + device.parameters.unit +
				'" data-paramcode="' + device.parameters.code +
				'">' + device.name + '</option>'
			);
		});

		$('#telldus-row-addedit-devices').show();

		/**
		 * If no selectedModel is sent in, do a request for the parameters
		 * for the _first_ device in the list. And display the
		 * parameters.
		 */
		if(!selectedModel) {
			getAndDisplayModelParameters(
				data[0].parameters.house,
				data[0].parameters.unit,
				data[0].parameters.code
			);
		}
	});
}


function makeNumberIntoRealNumber(str) {
	var maybeNumber = parseFloat(str);
	if (isNaN(maybeNumber)) {
		return str;
	} else {
		return maybeNumber;
	}
}

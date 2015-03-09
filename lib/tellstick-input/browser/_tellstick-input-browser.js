/*eslint-env browser, jquery */
/*global $, RED, window */

'use strict';

/**
 * Register Node
 */
RED.nodes.registerType('tellstick-input', {
	category: 'config',
	defaults: {
		name: { value: '', required: true},
		deviceclass: { value: ''},
		deviceprotocol: { value: ''},
		devicegroup: { value: ''},
		devicehouse: { value: ''},
		devicemethod: { value: ''},
		devicemodel: { value: ''},
		deviceunit: { value: ''},
		devicecode: { value: ''},
		deviceid: { value: ''}
	},
	label: function() {
		return this.name || 'Unnamed';
	},
	oneditprepare: function() {

		var isListening = true;

		/**
		 * Make data values in the table a little prettier.
		 */
		function printPrettyValue(codeStr) {
			if (codeStr === undefined) {
				return '';
			}
			return '<span class="telldus-code">' + codeStr + '</span>';
		}


		/**
		 * Increase dialog window size. This is not done all that beautiful
		 * but we need a bigger window to play with.
		 */
		setTimeout(function () {
			var jqCurDialog = $("[aria-describedby='node-config-dialog']:visible");
			var dialogWidth = ($(window).width() - 100);
			if (dialogWidth > 1400) {
				dialogWidth = 1400;
			}
			jqCurDialog.css('width', dialogWidth);
			jqCurDialog.css('left', (($(window).width() - dialogWidth) / 2));
			jqCurDialog.css('top', (($(window).height() - 580) / 2));
			jqCurDialog.css('min-height', '580px');
		}, 0);


		/**
		 * Faux stop/start listening. We do actually not stop listening
		 * when the user clicks to do so. Rather we're setting isListening to
		 * false and then just stop printing data to the table if that is set
		 * to false. No need to start/stop the actual listening.
		 */
		$('#telldus-listen').click(function () {
			if (isListening) {
				isListening = false;
				$('.listen-button-listen').show();
				$('.listen-button-stop').hide();
			} else {
				isListening = true;
				$('.listen-button-listen').hide();
				$('.listen-button-stop').show();
			}
		});

		$('#filter-method-learn').click(function () {
			if($(this).is(':checked')) {
				$('.transmission-table').removeClass('hide-method-learn');
			} else {
				$('.transmission-table').addClass('hide-method-learn');
			}
		});


		/**
		 * Move command/sensor data from table to input fields
		 * when user clicks on "Learn" button.
		 */
		$('body').on('click', '.telldus-learn-button', function() {
			// Empty any previous values
			$('.device-property').val('');

			var data = $(this).data('data').split(';');
			data.forEach(function (kvp) {
				$('#node-config-input-device' + kvp.split(':')[0]).val(kvp.split(':')[1]);
			});
		});


		/**
		 * Print all incoming data to the table
		 *
		 * For some reason, when creating a _new_ config,
		 * we can't reach 'this' when unloading, Therefor
		 * we're (for now) polluting the window object by
		 * attaching a few the listener there.
		 */
		window.tellstick = window.tellstick || {};
		window.tellstick.inputConfigListener = function(topic, rawdata) {
			if (!isListening) { return; }

			rawdata = rawdata.slice(0, -1);
			var data = {};
			rawdata.split(';').forEach(function (kvp) {
				data[kvp.split(':')[0]] = kvp.split(':')[1];
			});

			var learnButtonIcon;
			if (data.class === 'command') {
				learnButtonIcon = 'fa-mobile';
			} else if (data.class === 'sensor') {
				learnButtonIcon = 'fa-bar-chart';
			} else {
				learnButtonIcon = 'fa-bullseye';
			}

			var html = '<tr class="method-' + data.method + '">' +
				'<td class="first">' +
				'<button data-data="' + rawdata + '" type="button" id="" class="telldus-learn-button ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false">' +
				'<span class="ui-button-text">Learn</span>' +
				'</button>' +
				'</td>' +
				'<td>' + '<i class="fa ' + learnButtonIcon + '"></i>' + '</td>' +
				'<td>' + printPrettyValue(data.protocol) + '</td>' +
				'<td>' + printPrettyValue(data.model) + '</td>' +
				'<td>' + printPrettyValue(data.id) + '</td>' +
				'<td>' + printPrettyValue(data.house) + '</td>' +
				'<td>' + printPrettyValue(data.group) + '</td>' +
				'<td>' + printPrettyValue(data.unit) + '</td>' +
				'<td>' + printPrettyValue(data.code) + '</td>' +
				'<td>' + printPrettyValue(data.method) + '</td>';

			delete data.class;
			delete data.protocol;
			delete data.id;
			delete data.group;
			delete data.house;
			delete data.method;
			delete data.model;
			delete data.unit;
			delete data.code;
			if (Object.keys(data).length > 0) {
				html += '<td class="last">';
				html += Object.keys(data).map(function (key) {
					return key + ': ' + printPrettyValue(data[key]);
				}).join('<br>');
				html += '</td>';
			} else {
				html += '<td class="last">&nbsp;</td>';
			}


			html += '</tr>';

			$('.command-table tbody').prepend(html);
		};


		/**
		 * Ask server to start sending incmming radio data to browser,
		 * over websockets. And start listening to WebSockets.
		 */
		RED.comms.subscribe('tellstick-transmission', window.tellstick.inputConfigListener);


	},
	oneditcancel: function() {
		RED.comms.unsubscribe('tellstick-transmission', window.tellstick.inputConfigListener);
	},
	oneditsave: function() {
		RED.comms.unsubscribe('tellstick-transmission', window.tellstick.inputConfigListener);
	},
	oneditdelete: function() {
		RED.comms.unsubscribe('tellstick-transmission', window.tellstick.inputConfigListener);
	}
});

// Access the WCH CH9325 trough NodeJS

// The chip stores bytes received via the UART RX pin into a buffer.
// It transfers the contents of the buffer to a HID packet at regular intervals
// (maximum 12ms). The HID packets are always 8 bytes long, with the first byte
// containing the number of payload bytes.
// This is encoded as 0xf0 + length. The next 7 bytes contain the payload,
// padded with zeroes. Thus, even if no data is ever received on the UART,
// the chip always sends at least one packet every 12ms containing:
// f0 00 00 00 00 00 00 00
//
// More info: http://sigrok.org/wiki/WCH_CH9325#USB_encapsulation


var HID = require('node-hid');

var util = require('util');
var events = require('events');

var allDevices;
function getAllDevices()
{
  if (!allDevices) {
    vendorId = 0x1a86;
    productId = 0xe008;
    allDevices = HID.devices(vendorId, productId);
  }
  return allDevices;
}

function ch9325(index)
{
  if (!arguments.length) {
    index = 0;
  }

  var devices = getAllDevices();
  if (!devices.length) {
    throw new Error("No Devices could be found");
  }
  if (index > devices.length || index < 0) {
    throw new Error("Index " + index + " out of range, only " + devices.length + " Devices found");
  }
  this.hid = new HID.HID(devices[index].path);
  this.hid.sendFeatureReport([0x00, 0x0960]);

	this.hid.on('data', (data, error) => {
		var output = [];
		if (data) {
			var length = data[0] - 0xf0;
			for (var i = 0; i < length; i++) {
				output[i] = data[i + 1];
			}
			this.emit('data', output);
		} else {
			this.emit('error', error);
		}
	});
}

util.inherits(ch9325, events.EventEmitter);

exports.ch9325 = ch9325;
exports.deviceCount = function () { return getAllDevices().length; }

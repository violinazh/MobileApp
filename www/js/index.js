// We're using this BLE plugin that's also available in the PhoneGap Developer App.
// For reference, see:
// https://github.com/don/cordova-plugin-ble-central

// Service/Characteristics for TECO Vibration Wearable.
var VIB_SERVICE	       	= "713D0000-503E-4C75-BA94-3148F18D941E";
var VIB_CHARACTERISTIC	= "713D0003-503E-4C75-BA94-3148F18D941E";

// Start listening for deviceready event.
document.addEventListener('deviceready', onDeviceReady, false);

var scanTimeout;
var cycleInterval;
var connected = false;

// The BLE device
var connectedDevice;

// TypedArray for data we want to send (5 bytes)
var data = new Uint8Array(5);
var last_data = new Uint8Array(5);

// Set status line when device is ready.
function onDeviceReady() {
	$("#status").html("Status: Ready!");
}

// When scan button is clicked, check if BLE is enabled and available, then start BLE scan.
function startBLEScan() {
	ble.isEnabled(bleEnabled, bleDisabled);
}

// Set status line when BLE is disabled or not available.
function bleDisabled() {
	$("#status").html("Enable Bluetooth first.");
}

// BLE is enabled, start scan for 10 seconds.
function bleEnabled() {
	
	// Set status line.
	$("#status").html("Started 10 second scan.");
	
	// Start scan with "device found"-callback.
	ble.scan([], 10, function(device) {
		
		// If a device was found, check if the name includes "TECO WEARABLE"
		if (device.name.toUpperCase().includes("TECO WEARABLE")) {
			$("#status").html("Found device. Connecting...");
			
			// If so, stop scan immediately and connect.
			ble.stopScan(stopSuccess, stopFailure);
			clearTimeout(scanTimeout);
			ble.connect(device.id, connectSuccess, connectFailure);
			connected = true;
		} else {
			// Device is not one of our wearables. No action required.
		}
	}, function() {
		$("#status").html("Scan failed.");
	});
	
	// If device was not found after 10 seconds, stop scan.
	scanTimeout = setTimeout(stopBLEScan, 10000);
}

function stopSuccess(){}

function stopFailure(){}

// Callback for finished BLE scan.
function stopBLEScan(){
	$("#status").html("Scan finished.");
}

// Connection failed or connection lost. Set status accordingly.
function connectFailure(peripheral) {
	$("#status").html("Disconnected.");
	$("#val1").html("");
	$("#val2").html("");
	$("#val3").html("");
	
	clearInterval(shiftByteAndSend);
	
	connected = false;
}

// Callback for established connection.
function connectSuccess(device) {
	connectedDevice = device;
	
	// Print all device info to debug.
	console.log(JSON.stringify(device));
	$("#status").html("Connected!");
	
	// This is how you would do notifications.
	// ble.startNotification( ... );	
	
	// Reset data to initial state (first motor on)
	data[0] = 0xff;
	data[1] = 0x00;
	data[2] = 0x00;
	data[3] = 0x00;
	data[4] = 0x00;
	
	// Start interval: Send data and shift bytes every 0.1 seconds
	cycleInterval = setInterval(shiftByteAndSend, 100);
}

function shiftByteAndSend() {
	
	// Shift ("rotate") byte by one, so FF000000 becomes 00FF000000 and so on.
	for (var i = 0; i < 5; i++) {
		last_data[i] = data[i];
	}	
	for (var i = 0; i < 5; i++) {
		data[i] = last_data[(i + 1) % 5];
	}
	
	// Send byte array to wearable.
	ble.writeWithoutResponse(connectedDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC, data.buffer, writeDone, writeFailure);
}

// Callback when write is done.
function writeDone() {
	$("#status").html("Writing data...");
}

// Callback when write fails.
function writeFailure() {
	$("#status").html("Write failed.");
}






// Variables for the range of good position for reading in portrait
var minRange = 30; //35
var maxRange = 50; //45

// Variables for the range of good position for reading in landscape
var minRange = 30; //35
var maxRange = 50; //45

// Variable for the range of light
var lightRange = 100

// Variable for the interval
var interval;

// Counter variable for the time
var seconds = 0;

/* BLE */
// Service/Characteristics for TECO Vibration Wearable.
var VIB_SERVICE	       		= "713D0000-503E-4C75-BA94-3148F18D941E";
var VIB_CHARACTERISTIC_2	= "713D0002-503E-4C75-BA94-3148F18D941E";
var VIB_CHARACTERISTIC_3	= "713D0003-503E-4C75-BA94-3148F18D941E";

var scanTimeout;
var cycleInterval;
var connected = false;

// The BLE device
var connectedDevice;

// TypedArray for data we want to send (4 bytes)
var dataToWrite = new Uint8Array(4);
var last_data = new Uint8Array(4);

//var dataR = new ArrayBuffer(1);

$('#panel').enhanceWithin().panel();

// Start listening for the deviceready-Event.
function initialize() {
	document.addEventListener('deviceready', onDeviceReady, false);
}

// Event received. We may now use PhoneGap APIs.
function onDeviceReady() {
	$("#status").html("Status: Ready!");
}

/* BLE */
// When scan button is clicked, check if BLE is enabled and available, then start BLE scan.
function startBLEScan() {
	ble.isEnabled(bleEnabled, bleDisabled);
}

// Set status line when BLE is disabled or not available.
function bleDisabled() {
	$("#status").html("Enable Bluetooth first.");
	alert('Enable Bluetooth first.');
}

// BLE is enabled, start scan for 10 seconds.
function bleEnabled() {
	
	// Set status line.
	$("#status").html("Started 10 second scan.");
	
	// Start scan with "device found"-callback.
	ble.scan([], 10, function(device) {
		
		// If a device was found, check if the name includes "TECO WEARABLE"
		if (device.name.toUpperCase().includes("TECO WEARABLE 8")) {
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
	$("#status").html("Connection failed.");
}

// Callback for established connection.
function connectSuccess(device) {
	connectedDevice = device;
		doNothing();
	// Print all device info to debug.
	console.log(JSON.stringify(device));
	// read data from a characteristic, do something with output data ??? why is it not working
	ble.read(device.id, VIB_SERVICE, VIB_CHARACTERISTIC_2, 
		function(data){
		    console.log("Max. update frequency: " + JSON.stringify(data));
		},
		function(failure){
			console.log("Max. update frequency couldn't be obtained'");
		}
	);
	$("#status").html("Connected!");

}

/*function initData() {
	// Reset data to initial state (first motor on)
	data[0] = 0xff;
	data[1] = 0x00;
	data[2] = 0x00;
	data[3] = 0x00;	
}

function shiftByteAndSend() {
	
	// Shift ("rotate") byte by one, so FF000000 becomes 00FF000000 and so on.
	for (var i = 0; i < 4; i++) {
		last_data[i] = data[i];
	}	
	for (var i = 0; i < 4; i++) {
		data[i] = last_data[(i + 1) % 4];
	}
	
	// Send byte array to wearable.
	ble.writeWithoutResponse(connectedDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC, data.buffer, writeDone, writeFailure);
}*/

function doNothing() {
	console.log("bla bla");
	dataToWrite[0] = 0x00;
	dataToWrite[1] = 0x00;
	dataToWrite[2] = 0x00;
	dataToWrite[3] = 0x00;

	// Send byte array to wearable.
	ble.writeWithoutResponse(connectedDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC_3, dataToWrite.buffer, writeDone, writeFailure);
}

function doSomething() {

	dataToWrite[0] = 0xF0;
	dataToWrite[1] = 0xF0;
	dataToWrite[2] = 0xF0;
	dataToWrite[3] = 0xF0;

	// Send byte array to wearable.
	ble.writeWithoutResponse(connectedDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC_3, dataToWrite.buffer, writeDone, writeFailure);
}

// Callback when write is done.
function writeDone() {
	$("#status").html("Writing data...");
}

// Callback when write fails.
function writeFailure() {
	$("#status").html("Write failed.");
}

function chbxPos() {

	var checkbox = document.getElementById("chbxPos");

	if(checkbox.checked == true) {
		
		position();
    }
   	else {
		document.getElementById('debug').innerHTML = "";
		document.getElementById('output').innerHTML = "";
    	window.removeEventListener("deviceorientation", handlePosE);

		/* BLE */
		if (connected == true) {
			doNothing();
		} else {
			// Do nothing
		}
	}

}

function position() {

	window.addEventListener("deviceorientation", handlePosE);

}

// Event listener for the gyroscope
function handlePosE(event) {

		var x = event.beta;  // In degree in the range [-180,180]; motion around the x axis
		var y = event.gamma;  // In degree in the range [-90,90]; motion around the y axis

		if (x == null && y == null) { // Checking if there is a gyroscope on the device
			document.getElementById('debug').innerHTML = "No gyroscope present.";
			
		} else {

			if (window.matchMedia("(orientation: portrait)").matches) { // Detecting portrait mode
				document.getElementById('debug').innerHTML = "Beta value = " + x;
				//console.log('We are here.');
   				if (x < minRange || x > maxRange) { // Here we handle the wrong position event

					document.getElementById('output').innerHTML  = "Wrong position!";
					document.getElementById('output').style.color = "red";

					/* BLE */
					if (connected == true) {
						doSomething();
					} else {
						// Do nothing
					}

				} else {

					document.getElementById('output').innerHTML  = "Position OK";
					document.getElementById('output').style.color = "green";

					/* BLE */
					if (connected == true) {
						doNothing();
					} else {
						// Do nothing
					}
					
				}	
			}

			if (window.matchMedia("(orientation: landscape)").matches) { // Detecting landscape mode
				document.getElementById('debug').innerHTML = "Gamma value = " + y;
		   		if ((y > -30 || y < -50)) { // Here we handle the wrong position event ??? for 30 and 50
					document.getElementById('output').innerHTML  = "Wrong position!";
					document.getElementById('output').style.color = "red";
				} else {
					document.getElementById('output').innerHTML  = "Position OK";
					document.getElementById('output').style.color = "green";
				}	
			}

		}
}

function chbxWearable() {

	var checkbox = document.getElementById("chbxW");

	if(checkbox.checked == true) {
		
		startBLEScan();
    }
   	else {
		ble.disconnect(connectedDevice.id, disconnectSuccess, disconnectFailure);
	}

}

// Disconnection failed.
function disconnectFailure(peripheral) {
	$("#status").html("Disconnection failed.");
}

// Callback for successful disconnect.
function disconnectSuccess(device) {
	$("#status").html("Disconnected.");
	connected = false;
	
}


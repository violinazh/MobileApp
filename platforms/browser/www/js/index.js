// Variables for the range of good position for reading in portrait
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
var data1 = new Uint8Array(4);
var data2 = new Uint8Array(4);
var last_data = new Uint8Array(4);

//var dataR = new ArrayBuffer(1);

// Variables for sending data to the wearable - every 10 times
var something = 0;
var nothing = 0;

var stop = false;

// External panel
$('#panel').enhanceWithin().panel();

// Opening and closing the panel on swipe
$(document).on("pagecreate", function() {
    $(document).on("swipeleft swiperight", function(e) {
        if ($(".ui-page-active" ).jqmData("panel") !== "open") {
            if (e.type === "swipeleft") {
				$(document.activeElement).blur();
                $("#panel").panel("close");
            } else if (e.type === "swiperight") {
                $("#panel").panel("open");
            }
        }
    });
});

// Disconnecting the device when closing the app through home button
document.addEventListener("pause", onPause, false); 

function onPause() { 
 	if (connected == true) {
		ble.disconnect(connectedDevice.id, disconnectSuccess, disconnectFailure);
		navigator.app.exitApp(); 
	}
} 

// Start listening for the deviceready-Event.
function initialize() {
	document.addEventListener('deviceready', onDeviceReady, false);
}

// Event received. We may now use PhoneGap APIs.
function onDeviceReady() {
	$("#status").html("Status: Ready!");
	window.plugin.lightsensor.getReading(
	    function success(reading){
	      console.log(JSON.stringify(reading)); 
	      alert(JSON.stringify(reading));
	      // Output: {"intensity": 25}
	    }, 
	    function error(message){
	     console.log(message);
	    }
  	)
  
}

/* BLE */
// When scan button is clicked, check if BLE is enabled and available, then start BLE scan.
function startBLEScan() {
	ble.isEnabled(bleEnabled, bleDisabled);
}

// Set status line when BLE is disabled or not available.
function bleDisabled() {
	$("#status").html("Enable Bluetooth first.");

	// Refresh the checkbox
	$('#chbxW').prop('checked', false);
	$('#chbxW').flipswitch("refresh");
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

function stopFailure(){
	alert("Stopping scan failed.");
}

// Callback for finished BLE scan.
function stopBLEScan(){
	$("#status").html("Scan finished.");
}

// Connection failed or connection lost. Set status accordingly.
function connectFailure(peripheral) {
	$("#status").html("Connection failed.");
	ble.isEnabled(
		function() {
			//
		},
		function() {
			if (connected == true) {
			ble.disconnect(connectedDevice.id, disconnectSuccess, disconnectFailure);
		    alert("Bluetooth is not enabled.");
			}
		}
	);
	alert("Connection failed.");
}

// Callback for established connection.
function connectSuccess(device) {
	connectedDevice = device;
	stop = false;

	// Print all device info to debug.
	console.log(JSON.stringify(device));

	// ??? read data from a characteristic, do something with output data
	/*ble.read(device.id, VIB_SERVICE, VIB_CHARACTERISTIC_2, 
		function(data){
		    console.log("Max. update frequency: " + JSON.stringify(data));
		},
		function(failure){
			console.log("Max. update frequency couldn't be obtained'");
		}
	);*/

	$("#status").html("Connected!");

}

function doNothing() {
	if (stop == false) {
		data1[0] = 0x00;
		data1[1] = 0x00;
		data1[2] = 0x00;
		data1[3] = 0x00;

		// Send byte array to wearable.
		ble.writeWithoutResponse(connectedDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC_3, data1.buffer, writeDone, writeFailure);
	}
	
}

function doSomething() {
	if (stop == false) {
		data2[0] = 0xF0;
		data2[1] = 0xF0;
		data2[2] = 0xF0;
		data2[3] = 0xF0;

		// Send byte array to wearable.
		ble.writeWithoutResponse(connectedDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC_3, data2.buffer, writeDone, writeFailure);
	}
}

// Callback when write is done.
function writeDone() {
	$("#status").html("Writing data...");
}

// Callback when write fails.
function writeFailure() {
	$("#status").html("Write failed.");
	alert("Write failed.");
}

function chbxPos() {

	var checkbox = document.getElementById("chbxPos");

	if(checkbox.checked == true) {
		
		position();
    }
   	else {
		document.getElementById('debug').innerHTML = "";
		document.getElementById('output').innerHTML = "";
		document.getElementById('pos').innerHTML = "";
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
			document.getElementById('pos').innerHTML = "No gyroscope present.";
			
		} else {

			if (window.matchMedia("(orientation: portrait)").matches) { // Detecting portrait mode
				document.getElementById('debug').innerHTML = "Beta value = " + x;
				
   				if (x < minRange || x > maxRange) { // Here we handle the wrong position event

					document.getElementById('output').innerHTML  = "Wrong position!";
					document.getElementById('output').style.color = "red";

					document.getElementById('pos').innerHTML  = "Wrong position!";
					document.getElementById('pos').style.color = "red";

					/* BLE */
					if (connected == true && stop == false) {
						if (something % 10 == 0) {
							doSomething();
							something = 0;
						}
						something++;
					} else {
						// Do nothing
					}

				} else {

					document.getElementById('output').innerHTML  = "Position OK";
					document.getElementById('output').style.color = "green";

					document.getElementById('pos').innerHTML  = ""; // or "Position OK"
					document.getElementById('pos').style.color = "green";

					/* BLE */
					if (connected == true && stop == false) {
						if (nothing % 10 == 0) {
							doNothing();
							nothing = 0;
						}
						nothing++;
					} else {
						// Do nothing
					}
					
				}	
			}

			if (window.matchMedia("(orientation: landscape)").matches) { // Detecting landscape mode
				document.getElementById('debug').innerHTML = "Gamma value = " + y;

		   		if ((y > -(minRange) || y < -(maxRange))) { // Here we handle the wrong position event ??? for 30 and 50
					
					document.getElementById('output').innerHTML  = "Wrong position!";
					document.getElementById('output').style.color = "red";

					document.getElementById('pos').innerHTML  = "Wrong position!";
					document.getElementById('pos').style.color = "red";

					/* BLE */
					if (connected == true && stop == false) {
						if (something % 10 == 0) {
							doSomething();
							something = 0;
						}
						something++;
					} else {
						// Do nothing
					}

				} else {

					document.getElementById('output').innerHTML  = "Position OK";
					document.getElementById('output').style.color = "green";

					document.getElementById('pos').innerHTML  = ""; // or "Position OK"
					document.getElementById('pos').style.color = "green";

					/* BLE */
					if (connected == true && stop == false) {
						if (nothing % 10 == 0) {
							doNothing();
							nothing = 0;
						}
						nothing++;
					} else {
						// Do nothing
					}

				}	
			}

		}
}

function chbxWearable() {

	var checkbox = document.getElementById("chbxW");
	var checkboxP = document.getElementById("chbxPos");

	if(checkbox.checked == true) {
		
		if(checkboxP.checked == true) {
			stop = true;
			// turn off the position event
			window.removeEventListener("deviceorientation", handlePosE);
			// connect the bluetooth device
			startBLEScan();
			// turn on the position event
			position();
		} else {
			// connect the bluetooth device
			startBLEScan();
		}
		
    }
   	else {

		if(checkboxP.checked == true) {
			stop = true;
			// turn off the position event
			window.removeEventListener("deviceorientation", handlePosE);
			// disconnet the bluetooth device
			ble.disconnect(connectedDevice.id, disconnectSuccess, disconnectFailure);
			// turn on the position event
			position();
		} else {
			// disconnet the bluetooth device
			ble.disconnect(connectedDevice.id, disconnectSuccess, disconnectFailure);
		}
	}

}

// Disconnection failed.
function disconnectFailure(peripheral) {
	$("#status").html("Disconnection failed.");
	alert("Disconnection failed.");
}

// Callback for successful disconnect.
function disconnectSuccess(device) {
	// Refresh the checkbox
	$('#chbxW').prop('checked', false);
	$('#chbxW').flipswitch("refresh");

	$("#status").html("Disconnected.");
	connected = false;
	stop = false;
	something = 0;
	nothing = 0;

}


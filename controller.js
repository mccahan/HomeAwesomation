#!/usr/bin/env node

var net = require('net');
var Blynk = require('blynk-library');
var blynk = new Blynk.Blynk('4905434f280341a7ac1a3818060f6704', options = { connector: new Blynk.TcpClient( { addr: 'localhost'} ) });

var devices = {};
devices.garage = { address: null, last: null, pins: { 'openState': null }};
devices.sprinklers = { address: null, last: null };

// Listening Server
var registrationString = /DEVICE: (.*) - (.*)/;
var messageString = /MESSAGE: (.*) - (.*)/;
var server = net.createServer(function(socket) {
  var body = [];
  socket.on('data', function(data) {
    body.push(data);
  }).on('end', function(){
    body = Buffer.concat(body).toString();

    // Device registrations
    var deviceData = registrationString.exec(body);
    if (deviceData !== null) {
      console.log("Device", deviceData[1], "registered from", deviceData[2]);
      devices[deviceData[1]].address = deviceData[2];
      devices[deviceData[1]].last = Date.now();
    }

    // Pin writes
    deviceData = messageString.exec(body);
    if (deviceData !== null) {
      if (devices[deviceData[1]].onMessage !== null)
	devices[deviceData[1]].onMessage(deviceData[2], socket);
    }
  });
}).listen(5000);

// Garage Door
var v0 = new blynk.VirtualPin(0);
v0.on('write', function(param) {
  if (param[0] == 1) {
    var client = new net.Socket();
    client.on('data', function(data){
      client.destroy();
      console.log("Triggered garage door");
    });
    client.connect(80, devices.garage.address, function() {
      client.write('DOOR');
    });
  }
});

var v1 = new blynk.VirtualPin(1);
devices.garage.pins.openState = v1;
devices.garage.onMessage = function(data, socket) {
  var message = data.split(':');
  if (message[0] == 'openState') {
    devices.garage.pins.openState.write(parseInt(message[1])*255);
  }
};

// Sprinklers
var zoneHandler = function(zone) {
  return function(param) {
    var message;
    var client = new net.Socket();
    if (param[0] == 1) {
      message = 'ZONE' + zone + 'ON';
    } else {
      message = 'ZONE' + zone + 'OFF';
    }
    client.on('data', function(data){
      client.destroy();
      console.log("Triggered sprinklers " + message);
    });
    client.connect(80, devices.sprinklers.address, function() {
      client.write(message);
    });
  };
};
var v2 = new blynk.VirtualPin(2);
v2.on('write', zoneHandler(0));
var v3 = new blynk.VirtualPin(3);
v3.on('write', zoneHandler(1));
var v4 = new blynk.VirtualPin(4);
v4.on('write', zoneHandler(2));
var v5 = new blynk.VirtualPin(5);
v5.on('write', zoneHandler(3));
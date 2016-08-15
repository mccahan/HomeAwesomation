var fs = require("fs");
var net = require('net');
var Service, Characteristic, DoorState; // set in the module.exports, from homebridge

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  DoorState = homebridge.hap.Characteristic.CurrentDoorState;

  homebridge.registerAccessory("homebridge-homeawesomation-garage", "HomeAwesomationGarageDoor", HomeAwesomationGarageDoor);
};

function HomeAwesomationGarageDoor(log, config) {
  this.log = log;
  this.name = "garage door";
  this.initService();
}

HomeAwesomationGarageDoor.prototype = {

  monitorDoorState: function() {
     var door = this;
     this.isOpen(function(open){
       var isClosed = !open;
       if (isClosed != door.wasClosed) {
         door.wasClosed = isClosed;
         var state = isClosed ? DoorState.CLOSED : DoorState.OPEN;
         door.log("Door state changed to " + (isClosed ? "CLOSED" : "OPEN"));
         if (!door.operating) {
           door.currentDoorState.setValue(state);
           door.targetDoorState.setValue(state);
           door.targetState = state;
         }
       }
       setTimeout(door.monitorDoorState.bind(door), 4000);
     });
  },

  isOpen: function(callback) {
    var client = new net.Socket();
    var body = [];
    client.on('data', function(data){
      body.push(data);
    }).on('end', function(){
      Buffer.concat(body).toString();
      var result = JSON.parse(body);
      callback(result.open);
    });
    client.connect(80, '10.0.1.4', function() {
      client.write('DOOR_STATE');
    });
  },

  initService: function() {
    this.garageDoorOpener = new Service.GarageDoorOpener(this.name,this.name);
    this.currentDoorState = this.garageDoorOpener.getCharacteristic(DoorState);
    this.currentDoorState.on('get', this.getState.bind(this));
    this.targetDoorState = this.garageDoorOpener.getCharacteristic(Characteristic.TargetDoorState);
    this.targetDoorState.on('set', this.setState.bind(this));
    this.targetDoorState.on('get', this.getTargetState.bind(this));
    var door = this;
    this.isOpen(function(open){
      door.currentDoorState.setValue(!open ? DoorState.CLOSED : DoorState.OPEN);
      door.targetDoorState.setValue(!open ? DoorState.CLOSED : DoorState.OPEN);
      door.wasClosed = !open;
    });
    this.infoService = new Service.AccessoryInformation();
    this.infoService
      .setCharacteristic(Characteristic.Manufacturer, "McCahan")
      .setCharacteristic(Characteristic.Model, "NodeMCU GPIO GarageDoor")
      .setCharacteristic(Characteristic.SerialNumber, "Version 1.0.0");

    this.operating = false;
    setTimeout(this.monitorDoorState.bind(this), this.doorPollInMs);
  },

  getTargetState: function(callback) {
    callback(null, this.targetState);
  },

  isClosed: function() {
    return true;
  },

  setFinalDoorState: function() {
    var door = this;
    this.isOpen(function(open){
      var isClosed = !open;
      if ((this.targetState == DoorState.CLOSED && !isClosed) || (this.targetState == DoorState.OPEN && isClosed)) {
        door.log("Was trying to " + (this.targetState == DoorState.CLOSED ? " CLOSE " : " OPEN ") + "the door, but it is still " + (isClosed ? "CLOSED":"OPEN"));
        door.currentDoorState.setValue(DoorState.STOPPED);
        door.targetDoorState.setValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
      } else {
        door.currentDoorState.setValue(door.targetState);
      }
      door.operating = false;
    });
  },

  setState: function(state, callback) {
    this.log("Setting state to " + state);
    this.targetState = state;
    var door = this;
    this.isOpen(function(open){
      var isClosed = !open;
      if ((state == DoorState.OPEN && isClosed) || (state == DoorState.CLOSED && !isClosed)) {
          door.log("Triggering GarageDoor Relay");
          door.operating = true;
          if (state == DoorState.OPEN) {
              door.currentDoorState.setValue(DoorState.OPENING);
          } else {
              door.currentDoorState.setValue(DoorState.CLOSING);
          }
          /* TRIGGER */
          var client = new net.Socket();
          client.on('data', function(data){
            client.destroy();
            console.log("Triggered garage door");
          });
          client.connect(80, '10.0.1.4', function() {
            client.write('DOOR');
          });
      }
      callback();
    });
    return true;
  },

  getState: function(callback) {
    var door = this;
    this.isOpen(function(open){
      var isClosed = !open;
      door.log("GarageDoor is " + (isClosed ? "CLOSED ("+DoorState.CLOSED+")" : "OPEN ("+DoorState.OPEN+")"));
      callback(null, (isClosed ? DoorState.CLOSED : DoorState.OPEN));
    });
  },

  getServices: function() {
    return [this.infoService, this.garageDoorOpener];
  }
};
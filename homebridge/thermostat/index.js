var types = require("/usr/local/lib/node_modules/homebridge/node_modules/hap-nodejs/accessories/types.js");
var request = require("request");
var extraLogging = false;

module.exports = function(homebridge) {
  types = homebridge.hapLegacyTypes;

  homebridge.registerAccessory("homebridge-homeawesomation-thermostat", "RadioThermostat", RadioThermostatAccessory);
}

function RadioThermostatAccessory(log, config) {
  // device info
  this.name = config["name"];
  this.host = config["host"];

  // the thermostat works in Fahrenheit but HomeKit works in Celsius, so leave this 0
  this.unit = 0; // 0 is Celsius and 1 is Fahrenheit
}

RadioThermostatAccessory.prototype = {
  httpRequest: function(uri, fields, callback) {
    request({
      method: (fields)?'POST':'GET',
      url: 'http://' + this.host + '/' + uri,
      form: JSON.stringify(fields)
    },

    function (error, response, body) {
      if (extraLogging) {
        console.log('return ' + body);
      }

      callback(error, response, body)
    })
  },

  setPowerState: function(powerOn) {
    var tmode = -1;

    if (powerOn) {
      console.log("Setting power state on the '" + this.name + "' to on");
      tmode = 2;
    } else {
      console.log("Setting power state on the '" + this.name + "' to off");
      tmode = 0;
    }

    var fields = {
      tmode: tmode
    }

    this.httpRequest('tstat', fields, function(error, response, body) {
      if (error) {
        return console.error('http power function failed:', error);
      } else {
        return console.log('http power function succeeded!');
      }
    });
  },

  setTemperature: function(temp) {
    var url = 'http://' + this.host;

    if (!this.unit) {
      //temp = (temp * 1.8) + 32;
      temp = (temp * (9/5)) + 32;
    }

    console.log("Setting temperature on the '" + this.name + "' to " + temp);

    var fields = {
      t_cool: parseInt(temp)
    }

    this.httpRequest('tstat', fields, function(error, response, body) {
      if (error) {
        return console.error('http temperature function failed:', error);
      } else {
        return console.log('http temperature function succeeded!');
      }
    });
  },

  getTemperature: function(callback) {
    if (extraLogging) {
      console.log("Getting current temperature...");
    }

    var fields = null;

    this.httpRequest('tstat', fields, function(error, response, body) {
      if (error) {
        if (extraLogging) {
          console.log('Could not get thermostat temperature');
        }
      } else {
        var json = JSON.parse(body);
        var temp = 20;
        if (json.tmode == 1) {
          temp = json.t_heat;
        } else if (json.tmode == 2) {
          temp = json.t_cool;
        }

        if (!this.unit) {
          //temp = (temp - 32) / 1.8;
          temp = (temp - 32) * (5/9);
        }

        console.log('Current temperature is ' + temp);
        callback(temp);
      }
    });
  },

  getServices: function() {
    var that = this;
    var model;

    if (extraLogging) {
      console.log("Getting unit model...");
    }

    var fields = null;
    this.httpRequest('tstat/model', fields, function(error, response, body) {
      if (error) {
        if (extraLogging) {
          console.log('Could not get thermostat model');
        }
      } else {
        var json = JSON.parse(body);
        model = json.model.replace(' ', '_');
        console.log('Thermostat model is ' + model);
      }
    });

    return [{
      sType: types.ACCESSORY_INFORMATION_STYPE,
      characteristics: [{
        cType: types.NAME_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: this.name,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Name of the accessory",
        designedMaxLength: 255
      },{
        cType: types.MANUFACTURER_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "Radio Thermostat",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Manufacturer",
        designedMaxLength: 255
      },{
        cType: types.MODEL_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: 'Rev-1',
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Model",
        designedMaxLength: 255
      },{
        cType: types.SERIAL_NUMBER_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "A1S2NASF88EW",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "SN",
        designedMaxLength: 255
      },{
        cType: types.IDENTIFY_CTYPE,
        onUpdate: null,
        perms: ["pw"],
        format: "bool",
        initialValue: false,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Identify Accessory",
        designedMaxLength: 1
      }]
    },{
      sType: types.THERMOSTAT_STYPE,
      characteristics: [{
        cType: types.NAME_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "Thermostat Control",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Bla",
        designedMaxLength: 255
      },{
        cType: types.CURRENTHEATINGCOOLING_CTYPE,
        onUpdate: function(value) { console.log("CURRENTHEATINGCOOLING_CTYPE Change:", value); },
        perms: ["pr","ev"],
        format: "int",
        initialValue: 0,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Current Mode",
        designedMaxLength: 1,
        designedMinValue: 0,
        designedMaxValue: 2,
        designedMinStep: 1,
      },{
        cType: types.TARGETHEATINGCOOLING_CTYPE,
        onUpdate: function(value) { console.log("TARGETHEATINGCOOLING_CTYPE Change:", value); },
        perms: ["pw","pr","ev"],
        format: "int",
        initialValue: 0,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Target Mode",
        designedMinValue: 0,
        designedMaxValue: 3,
        designedMinStep: 1,
      },{
        cType: types.CURRENT_TEMPERATURE_CTYPE,
        onUpdate: function(value) { console.log("CURRENT_TEMPERATURE_CTYPE Change:", value); },
        onRead: function(callback) { that.getTemperature(callback); },
        perms: ["pr","ev"],
        format: "int",
        initialValue: (that.unit)?68:20,
        //initialValue: 18.333,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Current Temperature",
        unit: (that.unit)?'fahrenheit':'celsius'
      },{
        cType: types.TARGET_TEMPERATURE_CTYPE,
        onUpdate: function(value) { console.log("TARGET_TEMPERATURE_CTYPE Change:", value); that.setTemperature(value); },
        perms: ["pw","pr","ev"],
        format: "int",
        initialValue: (that.unit)?68:20,
        //initialValue: 18.333,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Target Temperature",
        designedMinValue: (that.unit)?60:16,
        designedMaxValue: (that.unit)?90:32,
        //designedMinStep: (that.unit)?1:1.8,
        //designedMinValue: 18.333,
        //designedMaxValue: 23.888,
        //designedMinStep: 0.9603,
        designedMinStep: 1,
        //designedMinStep: 0.005,
        unit: (that.unit)?'fahrenheit':'celsius'
      },{
        cType: types.TEMPERATURE_UNITS_CTYPE,
        onUpdate: function(value) { console.log("TEMPERATURE_UNITS_CTYPE Change:", value); },
        perms: ["pr","ev"],
        format: "int",
        initialValue: that.unit,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Unit",
      }]
    }];
  }
};
//exports.HEATING_THRESHOLD_CTYPE = stPre + "12" + stPost;

module.exports.accessory = RadioThermostatAccessory;
#!/usr/bin/env node

var Blynk = require("../");

if (!process.argv[2]) {
  console.log("Please specify auth token.");
  process.exit(1);
}

var blynk = new Blynk.Blynk(process.argv[2], options = { connector: new Blynk.TcpClient( { addr: 'localhost'} ) });
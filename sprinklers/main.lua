print "Running main with IP"

-- Register yourself
tmr.alarm(1, 10000, 1, function()
  client = net.createConnection(net.TCP, false)
  client:on("receive", function(conn, pl) print(pl) end)
  client:connect(5000, "10.0.1.19")
  client:on("connection", function()
    client:send("DEVICE: sprinklers - " .. wifi.sta.getip() .. "\n")
    client:close()
  end)
end)

gpio.write(0, gpio.HIGH);
gpio.write(1, gpio.HIGH);
gpio.write(2, gpio.HIGH);
gpio.write(3, gpio.HIGH);
gpio.mode(0, gpio.OUTPUT, gpio.PULLUP);
gpio.mode(1, gpio.OUTPUT, gpio.PULLUP);
gpio.mode(2, gpio.OUTPUT, gpio.PULLUP);
gpio.mode(3, gpio.OUTPUT, gpio.PULLUP);

-- Listen for trigger events
srv = net.createServer(net.TCP)
srv:listen(80, function(conn)
  conn:on("receive", function(conn, payload)
    if payload == 'ZONE0ON' then
      print "Zone 0 ON"
      conn:send("OK")
      conn:close()
      gpio.write(0, gpio.LOW);
    end
    if payload == 'ZONE0OFF' then
      print "Zone 0 ON"
      conn:send("OK")
      conn:close()
      gpio.write(0, gpio.HIGH);
    end
    if payload == 'ZONE1ON' then
      print "Zone 1 ON"
      conn:send("OK")
      conn:close()
      gpio.write(1, gpio.LOW);
    end
    if payload == 'ZONE1OFF' then
      print "Zone 1 ON"
      conn:send("OK")
      conn:close()
      gpio.write(1, gpio.HIGH);
    end
    if payload == 'ZONE2ON' then
      print "Zone 2 ON"
      conn:send("OK")
      conn:close()
      gpio.write(2, gpio.LOW);
    end
    if payload == 'ZONE3OFF' then
      print "Zone 3 ON"
      conn:send("OK")
      conn:close()
      gpio.write(3, gpio.HIGH);
    end
    if payload == 'ZONE4ON' then
      print "Zone 4 ON"
      conn:send("OK")
      conn:close()
      gpio.write(4, gpio.LOW);
    end
    if payload == 'ZONE4OFF' then
      print "Zone 4 ON"
      conn:send("OK")
      conn:close()
      gpio.write(4, gpio.HIGH);
    end
  end)
end)

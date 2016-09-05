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
    if string.sub(payload, 0, 4) == 'ZONE' then
      zone = tonumber(string.sub(payload, 5, 5))
      if string.sub(payload, 6, 7) == 'OF' then
         print("Turning zone " .. zone .. " off")
         state = gpio.HIGH;
       else
         print("Turning zone " .. zone .. " on")
         state = gpio.LOW;

         -- Automatically shut off after ten minutes if we don't receive a signal
         tmr.alarm(5, 600000, tmr.ALARM_SINGLE, function()
            print("Auto Shutoff")
            gpio.write(0, gpio.HIGH);
            gpio.write(1, gpio.HIGH);
            gpio.write(2, gpio.HIGH);
            gpio.write(3, gpio.HIGH);
         end)
       end

       gpio.write(zone, state);
       conn:send("OK")
       conn:close()
    end

  end)
end)

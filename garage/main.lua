print "Running main with IP"

-- Register yourself
tmr.alarm(1, 10000, 1, function()
  client = net.createConnection(net.TCP, false)
  client:on("receive", function(conn, pl) print(pl) end)
  client:connect(5000, "10.0.1.19")
  client:on("connection", function()
    client:send("DEVICE: garage - " .. wifi.sta.getip() .. "\n")
    tmr.softwd(30)
    client:close()
  end)
end)

gpio.mode(7, gpio.OUTPUT, gpio.PULLUP)
gpio.mode(8, gpio.INPUT, gpio.PULLUP)

-- Listen for trigger events
srv = net.createServer(net.TCP)
srv:listen(80, function(conn)
  conn:on("receive", function(conn, payload)
    if payload == 'DOOR' then
      print "Opening door"
      conn:send('{"status":"success"}')
      conn:close()
      gpio.write(7, gpio.LOW);
      tmr.alarm(0, 300, 0, function()
        gpio.write(7, gpio.HIGH);
      end)
    end

    if payload == 'DOOR_STATE' then
      print "Pin status requested"
      if gpio.read(8) == 0 then
        conn:send('{"status":"success","open":true}');
      else
        conn:send('{"status":"success","open":false}');
      end
      conn:close()
    end
  end)
end)

function registerOpenState()
  client = net.createConnection(net.TCP, false)
  client:connect(5000, "10.0.1.19")
  client:on("connection", function()
    if gpio.read(8) == 0 then
      state = 1
    else
      state = 0
    end
    client:send("MESSAGE: garage - openState:" .. state .. "\n")
    print "Sent open state"
    client:close()
  end)
end
openstate = gpio.read(8);
registerOpenState()

tmr.alarm(2, 1000, 1, function()
  if gpio.read(8) ~= openstate then
    openstate = gpio.read(8)
    registerOpenState()
  end
end)

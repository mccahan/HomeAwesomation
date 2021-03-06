wifi.setmode(wifi.STATION)
wifi.sta.config("Pretty Good WiFi","helloworld12")

-- wait for an IP
cnt = 10
tmr.alarm(0,500,1,function()
  if wifi.sta.getip()==nil then
    cnt = cnt-1
    if cnt<=0 then

      -- Did not get an IP in time, so quitting
      tmr.stop(0)
      gpio.write(pin_error,1)
      print "Not connected to wifi."
    end
  else

    -- Connected to the wifi
    tmr.stop(0)
    print("\nStarting main")
    dofile("main.lua")
  end
end)

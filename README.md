-- Work In Progress --

# home_assistant_mqtt_translation
Script that takes data from Home Assistant  and publishes it to retained topics in (another) mqtt broker

- set "slave" hass to publish eventdata to its local mqtt
- run script on slave, and configure with slave and master broker
- script creates topic on master broker and publishes with retain values
- after a mqtt reconnect, it does a http api grab of the current state and publishes everything it finds, so if the service is restart / connection breaks, you don't have to wait for each device's event data to go trhough mqtt

so zwave.device.state becomes zwave/device/state = 0
and swtich.something.state becomes switch/something/state = 1
etc..

TODO:
- create one master mqtt connection per device so that when something fails, the status gets set to disconnected for each device

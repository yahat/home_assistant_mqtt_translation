var TargetMqtt = 'mqt://<target>';
var TargetPrefix = 'target/prefix';

var HassUpdaterOptions = {
     'host'             : '<localmqtt>'
    ,'connection'       : 'homeassistant/connection'
    ,'eventstream'      : 'homeassistant/eventstream'
};

const HassStateUpdater = require('./lib/HassStateUpdater.js');
const HassRemoteDevice = require('./lib/HassRemoteDevice.js');

var Devices={};
Hass = new HassStateUpdater(HassUpdaterOptions);

Hass.events.on('MqttConnected',function(){
    console.info('Connected!');
});
Hass.events.on('UpdateState',function(id,name,value){
   setTimeout(function(){
       ProcessData(id,name,value);
   });
});
Hass.events.on('UpdateStateStart',function(id){
    ProcessStart(id);
});
Hass.events.on('UpdateStateEnd',function(id){
    ProcessEnd(id);
});
Hass.events.on('ConnectionStatus',function(status){
    DeviceDefaultStatus=status;
    for(i in Devices){
        Devices[i].updateConnection(status);
    }
});


function DeviceIdExists(id){
    if(typeof(Devices[id])=='undefined'){
        Devices[id] = new HassRemoteDevice(id,TargetMqtt,TargetPrefix);
    }
}
function ProcessStart(id){
    DeviceIdExists(id);
    Devices[id].updateStart();
}
function ProcessEnd(id){
    DeviceIdExists(id);
    Devices[id].updateEnd();
}
function ProcessData(id,name,value){
    DeviceIdExists(id);
    Devices[id].update(name,value);
}

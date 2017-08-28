var mqtt = require('mqtt');

function HassRemoteDevice(id,mqtturl,mqttprefix){
    this.id = id;
    this.data={};
    this.connection=0;
    this.mqtturl=mqtturl;
    this.mqttprefix = mqttprefix;
    this.mqtt_connected=false;
    this.start();
}

HassRemoteDevice.prototype.start = function(){
    this.startMqtt();
};

HassRemoteDevice.prototype.startMqtt = function(){
    this.mqtt = mqtt.connect(this.mqtturl,{
         keepalive: 10
        ,connectTimeout: 10*1000
        ,will: {
             topic: this.mqttprefix+'/device/'+this.id+'/connection'
            ,payload: '0'
            ,retain: true
        }
    });
    var thatdevice;
    thatdevice=this;
    this.mqtt.on('connect',function(){
        thatdevice.mqtt_connected=true;
        thatdevice.mqttConnect();
    });
    this.mqtt.on('reconnect',function(){
        thatdevice.mqtt_connected=true;
        thatdevice.mqttConnect();
    });
    this.mqtt.on('offline',function(){
        thatdevice.mqtt_connected=false;
    });
};

HassRemoteDevice.prototype.mqttConnected = function(){
  return this.mqtt_connected;
};

HassRemoteDevice.prototype.mqttConnect = function(){
    this.MqttSend(
        '/device/' + this.id + '/connection'
        ,this.connection
    );
    for(i in this.data){
        this.MqttSend(
            '/device/' + this.id + '/' + i
            , this.data[i]
        );
    }
};

HassRemoteDevice.prototype.getId = function(){
    return this.id;
};
HassRemoteDevice.prototype.updateStart = function(){

};
HassRemoteDevice.prototype.updateEnd = function(){

};
HassRemoteDevice.prototype.updateConnection = function(status){
    this.connection = status;
    this.MqttSend(
        '/device/' + this.id + '/connection'
        ,this.connection
    );
};
HassRemoteDevice.prototype.update = function(name,value){
    if(
        name=='friendly_name'
        || name=='last_tripped_time'
        || name=='icon'
        || name=='last_triggered'
    ){
        return false;
    }
    this.data[name]=value;
    this.MqttSend(
        '/device/' + this.id + '/' + name
        ,value
    );
};

HassRemoteDevice.prototype.MqttSend = function(topic,message){
    if(this.mqttConnected()){
        m=null;
        try{
            m=message.toString()
        }catch(ecpt){}
        this.mqtt.publish(
            (this.mqttprefix+topic.toString()).split('.').join('/')
            ,m
            ,{
                 retain: true
            }
        );
    }
};

module.exports = HassRemoteDevice;

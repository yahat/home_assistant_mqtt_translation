const events = require('events');
const mqtt = require('mqtt');
const http = require('http');

function HassStateUpdater(options){
    this.id = 'hasssu1';
    this.host = options.host;
    this.connection = options.connection;
    this.last_connection = 0;
    this.mqtt = false;
    this.loadedHttpStates=false;
    this.timerHttpStates=false;
    this.devices = {};
    this.start();
}

HassStateUpdater.prototype.events = new events.EventEmitter();

HassStateUpdater.prototype.start = function(){
    this.events.setMaxListeners(100);
    //console.log(this.id,'mqtt','connected');
    this.events.emit('ConnectionStatus',0);
    this.events.emit('MqttConnected');
    this.mqtt = mqtt.connect('mqtt://'+this.host);
    thatstartparent=this;
    this.mqtt.on('connect',function(){
        thatstartparent.mqtt.subscribe('homeassistant/eventstream');
        thatstartparent.mqtt.subscribe(thatstartparent.connection);
        thatstartparent.loadedHttpStates = false;
        setTimeout(function(){
            thatstartparent.getStatesHttpApi();
        },1);
    });
    this.mqtt.on('message',function(topic,message){
        thatstartparent.processMqttMessage(topic,message);
    });
};

HassStateUpdater.prototype.getStatesHttpApi = function(){
    thatparent=this;
    http.get('http://'+this.host+':8123/api/states', function(res){
        var body = '';
        res.on('data', function(chunk){
            body += chunk;
        });
        res.on('end', function(){
            try {
                response = JSON.parse(body);
            }catch(exception){
                setTimeout(function(){
                    thatparent.getStateHttpApi();
                },5000);
                return;
            }
            for(i in response){
                if(typeof(response[i].entity_id)!='undefined'){
                    thatparent.updateState(response[i].entity_id,response[i],true);
                }
            }
        });
    }).on('error', function(e){
        console.error("Got an error: ", e);
        setTimeout(function(){
            thatparent.getStateHttpApi();
        },5000);
    });
};

HassStateUpdater.prototype.processMqttMessage = function(topic,message){
    if(topic == this.connection){
        this.processConnection(message.toString());
    }
    //console.log('topic ',topic.toString());
    //console.log('# ',message.toString());
    try {
        data = JSON.parse(message.toString());
    }catch(EcptJsonParse){
        console.error(EcptJsonParse);
        return ;
    }
    this.processMessage(data);
};

HassStateUpdater.prototype.processConnection = function(status){
    this.last_connection = parseInt(status);
    this.events.emit('ConnectionStatus',this.last_connection);
};

HassStateUpdater.prototype.processMessage = function(data){
    if(typeof(data.event_type) == 'undefined'){
        //console.error('E: No event_type subkey');
        return ;
    }
    if(typeof(data.event_data) == 'undefined'){
        //console.error('E: No event_data subkey');
        return ;
    }

    switch(data.event_type){
        case 'state_changed':
            //console.log('--> StateChanged');
            this.processStateChange(data.event_data);
            break;

        default:
            //console.log('E: unknown event type: '+data.event_type);
            //console.log(data);
            break;
    }
};

HassStateUpdater.prototype.processStateChange = function(data){
    if(typeof(data.new_state) == 'undefined'){
        console.error('E: No new_state subkey');
        return ;
    }
    if(typeof(data.entity_id) == 'undefined'){
        console.error('E: No entity_id subkey');
        return ;
    }
    //console.log('--> Device:',data.entity_id);
    this.updateState(data.entity_id,data.new_state);
};

HassStateUpdater.prototype.updateState = function(id,state,old){

    if(typeof(old)=='undefined'){
        old=false;
    }
    if(typeof(this.devices[id])=='undefined'){
        this.devices[id]={};
    }
    this.events.emit('UpdateStateStart',id,old);
    if(
        typeof(this.devices[id].state) == 'undefined'
        ||
        typeof(this.devices[id].state) != typeof(state.state)
        ||
        ( typeof(this.devices[id].state)== 'object' && JSON.stringify(this.devices[id].state) != JSON.stringify(state.state) )
        ||
        ( typeof(this.devices[id].state)!='object' && this.devices[id].state != state.state )
    ){
        if(old==false || typeof(this.devices[id].state) == 'undefined') {
            delete(before);
            if(typeof(this.devices[id].state)!='undefined'){
                before = this.devices[id].state;
            }
            this.devices[id].state = state.state;
            this.events.emit('UpdateState',id,'state',state.state);
            if(typeof(before)=='undefined') {
                //console.log('S:', id, '|=', this.devices[id].state);
            }else{
                //console.log('S:', id, before,'->',this.devices[id].state);
            }

        }
    }

    try{ delete(state['attributes']['new_entity_id']); }catch(err){}
    try{ delete(state['attributes']['old_entity_id']); }catch(err){}
    try{ delete(state['attributes']['last_changed']); }catch(err){}

    if(typeof(state.attributes)!='undefined'){
        for(i in state.attributes){
            if(
                typeof(this.devices[id][i]) == 'undefined'
                ||
                typeof(this.devices[id][i]) != typeof(state.attributes[i])
                ||
                ( typeof(this.devices[id][i])== 'object' && JSON.stringify(this.devices[id][i]) != JSON.stringify(state.attributes[i]) )
                ||
                ( typeof(this.devices[id][i])!= 'object' && this.devices[id][i] != state.attributes[i])
            ){
                if(old==false || typeof(this.devices[id][i]) == 'undefined') {
                    delete(before);
                    if(typeof(this.devices[id][i])!='undefined'){
                        before = this.devices[id][i];
                    }
                    this.devices[id][i] = state.attributes[i];
                    this.events.emit('UpdateState',id,i,state.attributes[i]);
                    if(typeof(before)=='undefined') {
                        //console.log('A:', id, i, '|=', this.devices[id][i]);
                    }else{
                        //console.log('A:', id, i, before,'->',this.devices[id][i]);
                    }
                }
            }
        }
    }
    this.events.emit('UpdateStateEnd',id,old);
};



module.exports = HassStateUpdater;

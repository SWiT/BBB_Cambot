var doT = require('dot');

var express = require('express');
var app = express();
app.use(express.urlencoded());

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var b = require('bonescript');
var os = require('os');
var spawn = require('child_process').spawn;

var port = 81;

server.listen(1080);

var appLocation = "/var/lib/cloud9/cambot";
var cameraCommandPath = '/home/root/mjpg-streamer-code/mjpg-streamer-experimental';
var wificonfig = '/var/lib/connman/wifi.config';
var pagetitle = "BeagleBone Black Webcam Stream";

var wifi_ssid = '';
var wifi_security = '';
var wifi_passphrase = '';

var cameraOn = false;
var mjpg_streamer;

/****************************
 * Setup
 */
var osni = os.networkInterfaces();
console.log("server running at:");

var ipaddress = osni.lo[0].address;
console.log(" http://%s:%s", ipaddress, port);
if(osni.usb0){
    var ipaddress = osni.usb0[0].address;
    console.log(" http://%s:%s", ipaddress, port);
}
if(osni.wlan0){
    ipaddress = osni.wlan0[0].address;
    console.log(" http://%s:%s", ipaddress, port);
}
if(osni.eth0){
    ipaddress = osni.eth0[0].address;
    console.log(" http://%s:%s", ipaddress, port);
}


/****************************
 * Resources
 */

app.get('/', function(req, res){
    startCamera();
    logRequest(req);
    
    var hostname = req.headers.host.split(":")[0];
    
    //Get wifi config settings
    parsewificonfig(b.readTextFile(wificonfig));
    
    var body = '';
    body += '<script src="http://yui.yahooapis.com/3.14.1/build/yui/yui-min.js"></script>';
    body += '<script src="http://10.0.0.17:1080/socket.io/socket.io.js"></script>';
    body += '<script type="text/javascript" src="client.js"></script>';
    body += '<link rel="stylesheet" type="text/css" href="default.css">';
    body += '<h1>'+pagetitle+'</h1>\n';
    body += '<img src="http://'+hostname+':8080/?action=stream" />\n';
    body += '<a href="/cameraoff">turn off camera</a>';
    
    body += '<div class="container control-pad">';
    body += '<div class="arrow-up"></div>';
    body += '<div class="arrow-down"></div>';
    body += '<div class="arrow-left"></div>';
    body += '<div class="arrow-right"></div>';
    body += '</div>';
    
    var tempFn = doT.template(b.readTextFile(appLocation+'/form_wifi.html'));
    body += tempFn({wifi_ssid:wifi_ssid, wifi_security:wifi_security, wifi_passphrase:wifi_passphrase});
    
    res.send(body);
    
});

app.get('/client.js', function(req, res){
    logRequest(req);
    res.send(b.readTextFile(appLocation+req.url));
});

app.get('/default.css', function(req, res){
    logRequest(req);
    res.send(b.readTextFile(appLocation+req.url));
});

io.sockets.on('connection', function(socket) {
  socket.emit('robotstatus', { servoL:'?',servoR:'?','bumpL':0,'bumpR':0 });
  
  socket.on('disconnect', function() {
    console.log('socket:client disconnected');
    stopCamera();
  });
  
  
  
});



/******************************************************
 * Commands
 */

app.post('/updatewifi', function(req, res){
    logRequest(req);
    
    wifi_ssid = req.body.wifi_ssid;
    wifi_security = req.body.wifi_security;
    wifi_passphrase = req.body.wifi_passphrase;
    
    var configdata = "[service_home]\n";
    configdata += "Type = wifi\n";
    configdata += "Name = "+wifi_ssid+"\n";
    if (wifi_security !== ''){
        configdata += "Security = "+wifi_security+"\n";
    }
    if (wifi_passphrase !== ''){
        configdata += "Passphrase = "+wifi_passphrase+"\n";
    }
    b.writeTextFile(wificonfig, configdata);
    res.send("Updated WiFi configuration.  Restarting now.<br/>Wait awhile then go <a href="/">back</a>");
    spawn('reboot');
});

app.get('/poweroff', function(req, res){
    logRequest(req);
    res.send('Shutting down now.');
    spawn('poweroff');
});

app.get('/reboot', function(req, res){
    logRequest(req);
    res.send("Restarting now.<br/>Wait awhile then go <a href="/">back</a>");
    spawn('reboot');
});

app.listen(port);


/**************************************************
 * Functions
 */

function parsewificonfig(data){
    var lines = data.split("\n");
    for (var key in lines){
        var line = lines[key].trim();
        if(line.substr(0,1) == "#"){
            continue;
        }else if(line.substr(0,1) == "["){
            continue;
        }else if(line.substr(0,4) == "Type"){
            continue;
        }else if(line.substr(0,4) == "Name"){
            wifi_ssid = line.substr(7);
        }else if(line.substr(0,8) == "Security"){
            wifi_security = line.substr(11);
        }else if(line.substr(0,10) == "Passphrase"){
            wifi_passphrase = line.substr(13);
        }
    }
}

function startCamera(){
    if(!cameraOn){
        console.log(printDateTime()+" starting camera.");
        mjpg_streamer = spawn(cameraCommandPath+'/mjpg_streamer', ['-i',cameraCommandPath+'/input_uvc.so','-o',cameraCommandPath+'/output_http.so'], {cwd:cameraCommandPath});
        /*mjpg_streamer.stdout.on('data', function (data) {
          console.log('stdout: ' + data);
        });    
        mjpg_streamer.stderr.on('data', function (data) {
          console.log('stderr: ' + data);
        });
        mjpg_streamer.on('exit', function (code) {
          console.log('child process exited with code ' + code);
        });*/
        cameraOn = true;
    }
}

function stopCamera(){
    console.log( printDateTime()+" stopping camera.");
    cameraOn = false;
    if(mjpg_streamer){
        mjpg_streamer.kill();
    }
}

var printDateTime = function(){
    var now = new Date();
    var datetime = now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate()+" ";
    datetime += now.getHours()+":"+("0"+now.getMinutes()).substr(-2,2)+":"+("0"+now.getSeconds()).substr(-2,2);
    return datetime;
};

function logRequest(req){
    var log = "";
    log += printDateTime();
    log += " "+req.headers.host+req.url;  //Requested URL
    log += " "+req.connection.remoteAddress;    //users IP address.
    console.log(log);
}



var doT = require('dot');

var express = require('express');
var app = express();
app.use(express.urlencoded());

var io = require('socket.io').listen(app);

var b = require('bonescript');
var os = require('os');
var spawn = require('child_process').spawn;

var port = 81;
var appLocation = "/var/lib/cloud9/cambot";
var camerattl = 25000; //camera time to live in ms
var cameraCommandPath = '/home/root/mjpg-streamer-code/mjpg-streamer-experimental';
var wificonfig = '/var/lib/connman/wifi.config';
var pagetitle = "BeagleBone Black Webcam Stream";

var wifi_ssid = '';
var wifi_security = '';
var wifi_passphrase = '';

var now = new Date();
var expire = new Date();

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
 
io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
}); 
 
app.get('/', function(req, res){
    startCamera();
    updateTimes();
    logRequest(req);
    
    var hostname = req.headers.host.split(":")[0];
    
    //Get wifi config settings
    parsewificonfig(b.readTextFile(wificonfig));
    
    var body = '';
    body += '<script src="http://yui.yahooapis.com/3.14.1/build/yui/yui-min.js"></script>';
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
    
    //var tempFn = doT.template(b.readTextFile(appLocation+'/form_wifi.html'));
    //body += tempFn({wifi_ssid:wifi_ssid, wifi_security:wifi_security, wifi_passphrase:wifi_passphrase});
    body += doT.template(b.readTextFile(appLocation+'/form_wifi.html'))({wifi_ssid:wifi_ssid, wifi_security:wifi_security, wifi_passphrase:wifi_passphrase});
    
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


/******************************************************
 * Commands
 */

app.post('/updatewifi', function(req, res){
    updateTimes();
    logRequest(req);
    console.log(req.body);
    
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
    console.log(configdata);
    b.writeTextFile(wificonfig, configdata);
    res.send("Updated WiFi configuration.  Restarting now.<br/><a href="/">back</a>");
    spawn('reboot');
});

app.get('/keepalive', function(req, res){
    updateTimes();
    logRequest(req);
    res.send("OK");
});

app.get('/cameraoff', function(req, res){
    logRequest(req);
    res.send("Stopping camera now.");
    stopCamera();
});

app.get('/poweroff', function(req, res){
    logRequest(req);
    res.send('Shutting down now.<br/><a href="/">back</a>');
    spawn('poweroff');
});

app.get('/reboot', function(req, res){
    logRequest(req);
    res.send("Restarting now.<br/><a href="/">back</a>");
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
        console.log(printDate()+" "+printTime()+" starting camera.");
        mjpg_streamer = spawn(cameraCommandPath+'/mjpg_streamer', ['-i',cameraCommandPath+'/input_uvc.so','-o',cameraCommandPath+'/output_http.so'], {cwd:cameraCommandPath});
        mjpg_streamer.stdout.on('data', function (data) {
          console.log('stdout: ' + data);
        });    
        mjpg_streamer.stderr.on('data', function (data) {
          console.log('stderr: ' + data);
        });
        mjpg_streamer.on('exit', function (code) {
          console.log('child process exited with code ' + code);
        });
        cameraOn = true;
    }
}

function stopCamera(){
    console.log(printDate()+" "+printTime()+" stopping camera.");
    cameraOn = false;
    if(mjpg_streamer){
        mjpg_streamer.kill();
    }
}

function updateTimes(){
    now = new Date();
    expire = new Date(now.getTime()+camerattl);
}

var printTime = function(){return now.getHours()+":"+("0"+now.getMinutes()).substr(-2,2)+":"+("0"+now.getSeconds()).substr(-2,2);};
var printDate = function(){return now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate();};

function logRequest(req){
    var log = "";
    log += printDate();  //Date
    log += " "+printTime();  //Time
    log += " "+req.headers.host+req.url;  //Requested URL
    log += " "+req.connection.remoteAddress;    //users IP address.
    console.log(log);
}

function checkExpired(){
    now = new Date();
    if(cameraOn && expire < now){
        console.log(printDate()+" "+printTime()+" expired");
        stopCamera();
    }
}
setInterval(checkExpired, 1000);


var express = require('express');
var app = express();
var b = require('bonescript');
var os = require('os');
var spawn = require('child_process').spawn;

var port = 81;
var applocation = "/var/lib/cloud9/cambot";
var camerattl = 25000; //camera time to live in ms
var cameraCommandPath = '/home/root/mjpg-streamer-code/mjpg-streamer-experimental';
var pagetitle = "BeagleBone Black Webcam Stream";

var now = new Date();
var expire = new Date();

var cameraOn = false;
var mjpg_streamer;

/****************************
 * Setup
 */
var osni = os.networkInterfaces();
var ipaddress = "192.168.7.2";
console.log("server running at:");
console.log(" http://%s:%s", ipaddress, port);
if(osni.wlan0){
    ipaddress = osni.wlan0[0].address;
    console.log(" http://%s:%s", ipaddress, port);
}
if(osni.eth0){
    ipaddress = osni.eth0[0].address;
    console.log(" http://%s:%s", ipaddress, port);
}


/****************************
 * Requests
 */
app.get('/keepalive', function(req, res){
    updateTimes();
    logRequest(req);
    res.end();
});

app.get('/', function(req, res){
    checkCamera();
    updateTimes();
    logRequest(req);
    
    var hostname = req.headers.host.split(":")[0];
    
    var body = '';
    body += '<script src="http://yui.yahooapis.com/3.14.1/build/yui/yui-min.js"></script>';
    body += '<script type="text/javascript" src="client.js"></script>';
    body += '<link rel="stylesheet" type="text/css" href="default.css">';
    body += '<h1>'+pagetitle+'</h1>\n';
    body += '<img src="http://'+hostname+':8080/?action=stream" />\n';
    
    body += '<div class="arrow-up"></div>';
    body += '<div class="arrow-down"></div>';
    body += '<div class="arrow-left"></div>';
    body += '<div class="arrow-right"></div>';

    res.send(body);
});

app.get('/client.js', function(req, res){
    logRequest(req);
    res.end(b.readTextFile(applocation+req.url));
});

app.get('default.css', function(req, res){
    logRequest(req);
    res.end(b.readTextFile(applocation+req.url));
});

app.listen(port);



function checkCamera(){
    if(!cameraOn){
        console.log("starting camera...");
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
        console.log(printTime()+" expired, stopping camera...");
        cameraOn = false;
        if(mjpg_streamer){
            mjpg_streamer.kill();
        }
    }
}
setInterval(checkExpired, 1000);


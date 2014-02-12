//var express = require('express');
//var app = express();
var b = require('bonescript');
var os = require('os');
var http = require('http');
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

var driverQue = [];

var server = http.createServer(function (req, res) {
    
    now = new Date();
    expire = new Date(now.getTime()+camerattl);
    var hostname = req.headers.host.split(":")[0];
    
    var log = "";
    log += now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate();  //Date
    log += " "+now.getHours()+":"+("0"+now.getMinutes()).substr(-2,2)+":"+("0"+now.getSeconds()).substr(-2,2);  //Time
    log += " "+req.headers.host+req.url;  //Requested URL
    log += " "+req.connection.remoteAddress;    //users IP address.
    console.log(log);
    
    res.writeHead(200, {'Content-Type': 'text/html'});
    
    if (req.url == "/"){
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
    
        res.write('<html>');
        res.write('<head>');
        res.write('<title>'+pagetitle+'</title>');
        res.write('<link rel="stylesheet" type="text/css" href="default.css">');
        res.write('</head>');
        res.write('<body>');
        res.write('<script src="http://yui.yahooapis.com/3.14.1/build/yui/yui-min.js"></script>');
        res.write('<script type="text/javascript" src="client.js"></script>');
        res.write('<h1>'+pagetitle+'</h1>\n');
        res.write('<img src="http://'+hostname+':8080/?action=stream" />\n');
        
        res.write('<div class="arrow-up"></div>');
        res.write('<div class="arrow-down"></div>');
        res.write('<div class="arrow-left"></div>');
        res.write('<div class="arrow-right"></div>');
        
        res.write('</body>');
        res.write('</html>');
        res.end();
    }else if(req.url == "/client.js"){
        res.end(b.readTextFile(applocation+req.url));
    }else if(req.url == "/default.css"){
        res.end(b.readTextFile(applocation+req.url));
    }else if(req.url == "/client.js"){
        res.end(b.readTextFile(applocation+req.url));
    }else{
        res.end("OK");
    }
});
server.listen(port);

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


function checkExpired(){
    now = new Date();
    if(cameraOn && expire < now){
        console.log("expired, stopping camera...");
        cameraOn = false;
        if(mjpg_streamer){
            mjpg_streamer.kill();
        }
    }
}
setInterval(checkExpired, 1000);


YUI().use('node', 'event', 'io-base', function (Y) {
    
    var socket = io.connect('http://10.0.0.17:1080');
    
    socket.on('robotstatus', function (data) {
        console.log(data);
    });
    
    var doc = Y.one(Y.config.doc);
    doc.on('keydown', function(e){
        if(e.keyCode == 37){
            console.log("left-arrow");
        }else if(e.keyCode == 38){
            console.log("up-arrow");
        }else if(e.keyCode == 39){
            console.log("right-arrow");
        }else if(e.keyCode == 40){
            console.log("down-arrow");
        }
    });
});


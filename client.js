YUI().use('node', 'event', 'io-base', function (Y) {
    
    var sockethost = Y.one("#socketiohost").get('value');
    var socket = io.connect('http://'+sockethost);
    
    socket.on('robotstatus', function (data) {
        console.log(data);
    });
    
    var doc = Y.one(Y.config.doc);
    
    doc.on('keydown', function(e){
        if(e.keyCode == 37){
            console.log("left-arrow down");
            Y.one('#arrow-left').setStyle('borderRightColor','#000000');
            socket.emit('drive', { key:'left-arrow', status:'down'});
            
        }else if(e.keyCode == 38){
            console.log("up-arrow down");
            Y.one('#arrow-up').setStyle('borderBottomColor','#000000');
            socket.emit('drive', { key:'up-arrow', status:'down'});
            
        }else if(e.keyCode == 39){
            console.log("right-arrow down");
            Y.one('#arrow-right').setStyle('borderLeftColor','#000000');
            socket.emit('drive', { key:'right-arrow', status:'down'});
            
        }else if(e.keyCode == 40){
            console.log("down-arrow down");
            Y.one('#arrow-down').setStyle('borderTopColor','#000000');
            socket.emit('drive', { key:'down-arrow', status:'down'});
        }
    });
    
    doc.on('keyup', function(e){
        if(e.keyCode == 37){
            console.log("left-arrow up");
            Y.one('#arrow-left').setStyle('borderRightColor','#bbbbbb');
            socket.emit('drive', { key:'left-arrow', status:'up'});
            
        }else if(e.keyCode == 38){
            console.log("up-arrow up");
            Y.one('#arrow-up').setStyle('borderBottomColor','#bbbbbb');
            socket.emit('drive', { key:'up-arrow', status:'up'});
            
        }else if(e.keyCode == 39){
            console.log("right-arrow up");
            Y.one('#arrow-right').setStyle('borderLeftColor','#bbbbbb');
            socket.emit('drive', { key:'right-arrow', status:'up'});
            
        }else if(e.keyCode == 40){
            console.log("down-arrow up");
            Y.one('#arrow-down').setStyle('borderTopColor','#bbbbbb');
            socket.emit('drive', { key:'down-arrow', status:'up'});
            
        }
    });
});


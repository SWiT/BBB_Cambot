YUI().use('node', 'event', 'io-base', function (Y) {
    var successFn = function(){
        console.debug('success');
    };
    
    var keepalive = function(){
        Y.io('/keepalive', {
            on:   {success: successFn}
        });
        //setTimeout(keepalive, 20000);
    };
    
    //keepalive();
    setInterval(keepalive, 20000);
});


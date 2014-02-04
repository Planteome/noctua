////
//// Let's try and communicate with the socket.io server for
//// messages and the like. For the time being, this is a brittle
//// and optional test. If it goes any where, it will be factored
//// out.
////

var bbop_messenger_client = function(msgloc, on_connect,
				     on_info_event, on_remote_event){

    var anchor = this;
    anchor.socket = null;
    anchor.model_id = null;
    anchor.okay_p = null;

    var logger = new bbop.logger('msg client');
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    // Check to make sure that the optional library was correctly
    // loaded.
    if( typeof(io) === 'undefined' || typeof(io.connect) === 'undefined' ){
	ll('was unable to load server.io from messaging server (io undefined)');
	anchor.okay_p = false;
    }else{
	ll('likely have the right setup--attempting');
	anchor.okay_p = true;
    }	

    // 
    anchor.okay = function(){
	var ret = false;
	//if( anchor.okay_p && anchor.socket && anchor.model_id ){
	if( anchor.okay_p ){
	    ret = true;
	}
	return ret;
    };

    // TODO: Specify the channel over and above the general server.
    // For the time being, just using the model id in the message.
    anchor.connect = function(model_id){
	if( ! anchor.okay() ){
	    ll('no good socket on connect; did you connect()?');
	}else{

	    // Set internal variables.
	    anchor.socket = io.connect(msgloc);
	    anchor.model_id = model_id;
	    
	    function _internal_on_connect(){
		
		// Emit general packet.
		var connect_packet = {
		    'model_id': anchor.model_id,
		    'text': 'new client connected'
		};
		anchor.socket.emit('info', connect_packet);
		
		// Run our external callback.
		if( typeof(on_connect) !== 'undefined' && on_connect ){
		    on_connect();				 
		}	    
	    }
	    anchor.socket.on('connect', _internal_on_connect);

	    // Setup to catch info events from the clients and pass them
	    // on if they were meant for us.
	    function _got_info(data){
		var mid = data['model_id'] || null;
		var str = data['text'] || '???';

		// Check to make sure it interestes us.
		if( ! mid || mid != anchor.model_id ){
		    ll('skip info packet--not for us');
		}else{
		    ll('received info: ' + str);
		
		    // Trigger whatever function we were given.
		    if(typeof(on_info_event) !== 'undefined' && on_info_event){
			on_info_event(str);
		    }
		}
	    }
	    anchor.socket.on('info', _got_info);

	    function _got_remote(data){
		var mid = data['model_id'] || null;
		var top = data['top'] || null;
		var left = data['left'] || null;
		var uid = data['user_id'] || '???';
		var ucolor = data['user_color'] || '#ffffff';

		// Check to make sure it interestes us.
		if( ! mid || mid != anchor.model_id ){
		    ll('skip info packet--not for us');
		}else{
		    //ll('received remote: ' + str);
		
		    // Trigger whatever function we were given.
		    if(typeof(on_remote_event) !== 'undefined' &&
		       on_remote_event){
			on_remote_event(uid, ucolor, top, left);
		    }
		}		
	    }
	    anchor.socket.on('remote', _got_remote);

	    // // ...
	    // anchor.socket.on('remote', function (data) {
	    // 		     ll('remote: ' + 'foo');
	    // 		     // console.log(data);
	    // 		     // anchor.socket.emit('my other event',
	    // 		     // 			{ my: 'app_base' });
	    // 		 });
	}
    };

    // 
    anchor.info = function(str){
	if( ! anchor.okay() ){
	    ll('no good socket on info; did you connect()?');
	}else{
	    ll('send info: (' + anchor.model_id + ') "' + str + '"');

	    var msg_packet = {
		model_id: anchor.model_id,
		text: str
	    };
	    anchor.socket.emit('info', msg_packet);
	}
    };

    // 
    anchor.location = function(user_id, user_color, top, left){
	if( ! anchor.okay() ){
	    ll('no good socket on location; did you connect()?');
	}else{
	    ll('send location: (' + anchor.model_id + ')');

	    var loc_packet = {
		model_id: anchor.model_id,
		top: top,
		left: left,
		user_id: user_id,
		user_color: user_color
	    };
	    anchor.socket.emit('remote', loc_packet);
	}
    };
};
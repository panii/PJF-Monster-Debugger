//                    潘
function startServer(btn)
{
	ServerSocketClass.init();
	ServerSocketClass.bind();
	
	btn.disabled = true;
}

var ServerSocketClass = {
	debug : false,
	serverSocket : null,
	clientSockets : {},
	clientReadBuffer : {},
	clientStarted : {},

	localIP : null,
	localPort : null,
	logField : null,

	init : function()
	{
		this.serverSocket = new air.ServerSocket();
		this.localIP = document.getElementById('localIP');
		this.localPort = document.getElementById('localPort');
		this.logField = document.getElementById('logField');
	},
	
	onConnect : function(event/*ServerSocketConnectEvent*/)
	{
		var clientSocket = event.socket;
		var socketId = clientSocket.remoteAddress + ":" + clientSocket.remotePort;
		ServerSocketClass.clientSockets[socketId] = new SocketClient(socketId, clientSocket);
		ServerSocketClass.log("Connection from " + clientSocket.remoteAddress + ":" + clientSocket.remotePort);
		//air.Introspector.Console.log(socketId + ' connect');
		ServerSocketClass.clientStarted[socketId] = 0;
	},
	
	onClose : function(socketId)
	{
		//air.Introspector.Console.log(socketId + ' close');
		dataEnd(ServerSocketClass.clientStarted[socketId]);
		delete ServerSocketClass.clientStarted[socketId];
		delete ServerSocketClass.clientSockets[socketId];
	},
	
	onClientSocketData : function(socketId, funcname, packet_len, s)
	{
		if(ServerSocketClass.debug) {
			ServerSocketClass.log( 'onClientSocketData:' + funcname + ':' + packet_len + ':' + s );
			return;
		}
		
		try {
			var oo = JSON.parse(s);
		} catch( e ) { alert('parse json error'); alert(s); return; }
		var o = oo;
		if(ServerSocketClass.clientStarted[socketId] === 0) {
			dataStart(o['unique_id'], socketId);
			ServerSocketClass.clientStarted[socketId] = o['unique_id'];
		}
		dataIn(o['unique_id'], o['trace_thing'], o['label'], o['level'], o['tag']);
		document.getElementById('into').style.display = 'none';
		document.getElementById('jtbox').style.display = 'block';
	},

	bind : function()
	{
		if(this.serverSocket.bound)
		{
			this.serverSocket.close();
			this.serverSocket = new air.ServerSocket();
		}
		this.serverSocket.bind( parseInt(this.localPort.value ), this.localIP.value);
		this.serverSocket.addEventListener(air.ServerSocketConnectEvent.CONNECT, this.onConnect);
		this.serverSocket.listen();
		if(!ServerSocketClass.debug) document.getElementById('into').innerHTML = "Listening: " + this.serverSocket.localAddress + ":" + this.serverSocket.localPort;
		this.log( "Listen to: " + this.serverSocket.localAddress + ":" + this.serverSocket.localPort );
		if(ServerSocketClass.debug) document.getElementById('logfielddiv').style.display='';
	},

	log : function(text/*String*/)
	{
		if(!ServerSocketClass.debug) return;
		this.logField.value += (text + "\n");
	}
}
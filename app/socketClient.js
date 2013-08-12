//                    潘
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

function SocketClient(clientIdStr, client)
{
	this.clientIdStr = clientIdStr;
	this.socket = client;
	// 16 bits
	this.funcname = 0;
	// 32 bits
	this.packet_len = -1;

	this.packet_buf = new air.ByteArray();
	
	this.socket.endian = air.Endian.BIG_ENDIAN;
	this.socket.addEventListener(air.Event.CLOSE, this.onClose.bind(this));
	this.socket.addEventListener(air.ProgressEvent.SOCKET_DATA, this.onSocketData.bind(this));
}

SocketClient.prototype.onClose = function(e) {
	this.disconnect();
}
SocketClient.prototype.disconnect = function() {
	if(this.socket == null) {
		return;
	}
	this.socket.removeEventListener(air.Event.CLOSE, this.onClose);
	this.socket.removeEventListener(air.ProgressEvent.SOCKET_DATA, this.onSocketData);
	this.socket.close();
	this.socket = null;
	ServerSocketClass.onClose(this.clientIdStr);
}
// 读取数据流, socket会粘包
// 第一种情况: 正好一个完整的包
// 第二种情况: 少了点长度, 要读2次或3次或4次......
// 第三种情况: 多了点长度, 把下个包的头也发来了
SocketClient.prototype.onSocketData = function(e/* :ProgressEvent */) {
	while (this.socket.bytesAvailable > 0)
	{
		if (this.packet_len == -1) // 初始, 那么就读头部的6Byte
		{
			if (this.socket.bytesAvailable < 6)
			{
				break;
			}
			this.funcname = this.socket.readShort();// 读取一个带符号的2Byte(16bits)整数  方法名
			this.packet_len = this.socket.readInt();// 读取一个带符号的4Byte(32bits)整数  数据流长度
			this.packet_buf = new air.ByteArray();

			if (this.socket.bytesAvailable >= this.packet_len) // 送来的数据 >= 指定要读的数据流长度
			{
				this.socket.readBytes(this.packet_buf, 0, this.packet_len); // 读到指定长度结束
			}
			else // 送来的数据 < 指定要读的数据流长度
			{
				this.socket.readBytes(this.packet_buf, 0, this.socket.bytesAvailable); // 读全部送来的
			}
		}
		else
		{
			if((this.packet_buf.length + this.socket.bytesAvailable) <= this.packet_len) // 已读到的+这次发来的 <= 指定要读的数据流长度
			{
				this.socket.readBytes(this.packet_buf, this.packet_buf.length, this.socket.bytesAvailable); // 读全部送来的
			}
			else // 已读到的+这次发来的 > 指定要读的数据流长度
			{
				this.socket.readBytes(this.packet_buf, this.packet_buf.length, (this.packet_len - this.packet_buf.length)); // 还缺多少读多少
			}
		}

		this.onSocketDataEnd();
	}
}

SocketClient.prototype.onSocketDataEnd = function() {
	if (this.packet_buf.length == this.packet_len) // 读成功一个包
	{
		this.onRecvPacket(this.packet_buf);
		this.packet_len = -1;
		this.funcname = 0;
	}
}

/**
 * 处理接受到的数据
 * @param	ByteArray
 */
SocketClient.prototype.onRecvPacket = function(packet/* :ByteArray */) {
	/* packet.uncompress(); */
	var j/* :uint */ = packet.length;
	var s/* :String */ = packet.readUTFBytes(j);
	ServerSocketClass.onClientSocketData(this.clientIdStr, this.funcname, this.packet_len, s);
}

SocketClient.prototype.send = function(f/* :String  */, s/* :String */) {
	return;
	if (this.socket == null)
	{
		this.call("FLASH_ERROR", "SOCKET IS CLOSE");
		return;
	}
	var fncname/* :int */ = parseInt(f);
	if (isNaN(fncname))
	{
		this.call("FLASH_ERROR", "FNAME");
		return;
	}
	var ba/* :ByteArray */ = new air.ByteArray();
	ba.endian = Endian.BIG_ENDIAN;
	ba.writeUTFBytes(s);
	var i/* :uint */ = ba.length;
	ba.compress();
	var j/* :uint */ = ba.length;
	this.socket.writeShort(fncname);
	this.socket.writeInt(ba.length);
	this.socket.writeBytes(ba);
	this.socket.flush();
	this.call("FLASH_SENDING_DATA", [i, j]);
	//trace("fncname: " + fncname.toString() + " ba.length: " + ba.length.toString());
	//trace("flushed");
}
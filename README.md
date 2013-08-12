PJF-Monster-Debugger
====================

***A JSON Trace Tool***<br><br>
*I create this tool for convenient my php development.*<br>
*This air program will start a socket server on your machine.*<br>
*Then you can use any socket client to send json string to the server.*<br>
*The protocol is simple, (16-bit int) + (32-bit int) + (jsonString).*<br>
*(16-bit int) : Right now, I only use number 1 for trace json.*<br>
*(32-bit int) : The length of json string.*<br>
*(jsonString) :*
>{<br>&nbsp;&nbsp;&nbsp;&nbsp;unique\_id : 'some unique id, maybe uid in your game',<br>&nbsp;&nbsp;&nbsp;&nbsp;trace\_thing : 'any thing you want to trace',<br>&nbsp;&nbsp;&nbsp;&nbsp;label : 'label',<br>&nbsp;&nbsp;&nbsp;&nbsp;level : 'trace|debug|info|warn|error',<br>&nbsp;&nbsp;&nbsp;&nbsp;tag : 'your named tag to group the trace, maybe mysql|memcache|etc.'<br>}<br>

*You can look my php client for detail.*
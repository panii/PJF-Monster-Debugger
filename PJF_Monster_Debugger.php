<?php
function trace($unique_id = null, $trace_thing = null, $label = '&nbsp;', $level = 'Trace', $tag = 'All') {
	PJF_Monster_Debugger::trace($unique_id, $trace_thing, $label, $level, $tag);
}

class PJF_Monster_Debugger
{
	public static $config = array(
		// unique id
		'100002845459110' => array(
			array('172.17.1.157', '62538'), // PJF_Monster_Debugger IP And Port
		),
	);

	private static $handles = array();

	public static function trace($unique_id = null, $trace_thing = null, $label = '&nbsp;', $level = 'Trace', $tag = 'All')
	{
		if($unique_id !== null && $trace_thing !== null) {
			if(isset(self::$config[$unique_id])) {
				$olderrorhandler = set_error_handler('PJF_error_handler');

				foreach(self::$config[$unique_id] as $server) {
					self::send_to_server($unique_id, $server, json_encode(array(
													'unique_id' => $unique_id,
													'trace_thing' => $trace_thing,
													'label' => $label,
													'level' => $level,
													'tag' => $tag
					)));
				}
				set_error_handler($olderrorhandler);
			}
		}
	}

	private static function send_to_server($unique_id, $server, $traceStr)
	{
		$handle = self::get_handle($unique_id, $server);
		if($handle !== null)
			fwrite($handle, pack("n", 1) . pack("N", strlen($traceStr)) . $traceStr);
	}

	private static function get_handle($unique_id, $server)
	{
		if(isset(self::$handles[$unique_id][$server[0]])) {
			return self::$handles[$unique_id][$server[0]];
		}
		$timeout = 0.5;
		self::$handles[$unique_id][$server[0]] = @fsockopen($server[0], $server[1] , $errno, $errstr, $timeout);
		if(!is_resource(self::$handles[$unique_id][$server[0]])) {
			self::$handles[$unique_id][$server[0]] = null;
//			echo 'PJF Monster Debugger can not connect!';
			return null;
		}
		stream_set_blocking(self::$handles[$unique_id][$server[0]], 1);
		stream_set_timeout(self::$handles[$unique_id][$server[0]], 3);

		return self::$handles[$unique_id][$server[0]];
	}

	public static function shutdown()
	{
		foreach(self::$handles as &$uniqueS) foreach($uniqueS as &$s) {if($s !== null) {fclose($s); $s = null;}}
	}
}

function PJF_Monster_Debugger_Shutdown() { PJF_Monster_Debugger::shutdown(); }

function PJF_error_handler() {}

register_shutdown_function('PJF_Monster_Debugger_Shutdown');
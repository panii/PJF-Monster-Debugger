<?php

// \trace('abcdefg');
function trace($trace_thing = null, $label = '&nbsp;', $level = 'Trace', $tag = 'All') {
    if(!defined('GLOBAL_USER_ID') && !defined('TRACE_TO_USER_ID')) {
        define('GLOBAL_USER_ID', '000');
    }

    if (defined('TRACE_ENABLE') && TRACE_ENABLE === true) {
        PJF_Monster_Debugger::trace(defined('TRACE_TO_USER_ID') ? TRACE_TO_USER_ID : defined('GLOBAL_USER_ID') ? GLOBAL_USER_ID : '', $trace_thing, $label, $level, $tag);
    }
}

class PJF_Monster_Debugger
{
    const VERSION = '1.0';
    const PERSISTENCE = false;
    const MODE = 'direct_connect'; // proxy:程序在测试机上可以通过中间代理再trace到开发人员机子  local_file:输出的内容append到本地文件    direct_connect:程序在内网可以直接连到开发人员的机子
    const PROXY_IP = '127.0.0.1'; // proxy模式 设置proxy的地址
    const PROXY_PORT = 62538;     // proxy模式 设置proxy的端口
    
    public static $closeTemp = false;
    
    public static $config = array(
        // unique id
		'000' => array( array(self::IP, '62538'),), // PJF_Monster_Debugger IP And Port
//        '10000' => array( array('192.168.31.209', '62538')), // PJF_Monster_Debugger IP And Port
//        'mmtrace' => array( array('192.168.31.209', '62538')), // PJF_Monster_Debugger IP And Port
    );

    const IP = '127.0.0.1'; // mode为proxy或direct_connect时候设置开发人员的ip地址        mode为local_file时候设置文件输出到/tmp/pjf_monster_debugger.log

    private static $handles = array();

    private static $noid_cache = array();

    public static function trace($unique_id = null, $trace_thing, $label = '&nbsp;', $level = 'Trace', $tag = 'All')
    {
        if (self::$closeTemp === true) return;
        
        static $httpId = null;

        if($unique_id !== null) {
            if(isset(self::$config[$unique_id])) {
                if (!$httpId) {
                    $httpId = getmypid();
                }

                if($unique_id == 'xxx') {
                    if(!isset(self::$noid_cache[$httpId])) {
                        self::$noid_cache[$httpId] = array();
                    }
                    self::$noid_cache[$httpId][] = array(
                        'trace_thing' => $trace_thing,
                        'label' => $httpId . ' '.$label,
                        'level' => $level,
                        'tag' => $tag
                    );
                }
                else {
                    if(isset(self::$noid_cache[$httpId])) {
                        if(count(self::$noid_cache[$httpId]) > 0) {
                            foreach(self::$noid_cache[$httpId] as $a) {
                                foreach(self::$config[$unique_id] as $server) {
                                    $a['unique_id'] = $unique_id;
                                    self::send_to_server($unique_id, $server, json_encode($a));
                                }
                            }
                            unset(self::$noid_cache[$httpId]);
                        }
                    }
                }

                foreach(self::$config[$unique_id] as $server) {
                    if(is_object($trace_thing)) {
                        if($trace_thing instanceof \Redis) {
                            $trace_thing = 'Object';
                        }
                    }
                    elseif(is_resource($trace_thing)) {
                        $trace_thing = 'Resource';
                    }
                    self::send_to_server($unique_id, $server, json_encode(array(
                                                                              'unique_id' => $unique_id,
                                                                              'trace_thing' => $trace_thing,
                                                                              'label' => $httpId . ' '.$label,
                                                                              'level' => $level,
                                                                              'tag' => $tag
                                                                          )));
                }
            }
        }
    }

    private static function send_to_server($unique_id, $server, $traceStr)
    {
        $handle = self::get_handle($unique_id, $server);
        $monster_protocal = 1; // trace
        if($handle !== null) self::fwrite($handle, pack("n", $monster_protocal) . pack("N", strlen($traceStr)) . $traceStr);
    }

    private static function get_handle($unique_id, $server)
    {
        $ip = $server[0];

        if(isset(self::$handles[$unique_id][$ip])) {
            if (self::MODE == 'proxy' && count(self::$config[$unique_id]) > 1) {
                self::handler_change_remote_ip(self::$handles[$unique_id][$ip], $server[0], $server[1]);
            }
            return self::$handles[$unique_id][$ip];
        }

        if (self::MODE == 'direct_connect' || self::MODE == 'proxy') {
            $timeout = 0.5;

            if (self::PERSISTENCE === true) {
                self::$handles[$unique_id][$ip] = @pfsockopen((self::MODE == 'proxy' ? self::PROXY_IP : $ip), (self::MODE == 'proxy' ? self::PROXY_PORT : $server[1]) , $errno, $errstr, $timeout);
            } else {
                self::$handles[$unique_id][$ip] = @fsockopen((self::MODE == 'proxy' ? self::PROXY_IP : $ip), (self::MODE == 'proxy' ? self::PROXY_PORT : $server[1]) , $errno, $errstr, $timeout);
            }
            if (self::$handles[$unique_id][$ip] != null) {
                stream_set_blocking(self::$handles[$unique_id][$ip], 1);
                stream_set_timeout(self::$handles[$unique_id][$ip], 1);

                if (self::MODE == 'proxy') {
                    self::handler_change_remote_ip(self::$handles[$unique_id][$ip], $server[0], $server[1]);
                }
            }
        } elseif (self::MODE == 'local_file') {
            self::$handles[$unique_id][$ip] = @fopen($ip, 'ab');
        }
        if(!is_resource(self::$handles[$unique_id][$ip])) {
            self::$handles[$unique_id][$ip] = null;
            //			echo 'PJF Monster Debugger can not connect!';
            return null;
        }

        return self::$handles[$unique_id][$ip];
    }

    private static function fwrite($handle, $buffer)
    {
        if (self::MODE == 'direct_connect' || self::MODE == 'local_file') {
            fwrite($handle, $buffer);
        } elseif (self::MODE == 'proxy') {
            $type = 3; // sender trace data
            $buffer2 = pack('C', $type) . $buffer;
            $total_length = 4 + strlen($buffer2);
            fwrite($handle, pack('N', $total_length) . $buffer2);
        }
    }

    private static function handler_change_remote_ip($handler, $ip, $port)
    {
        $type = 1; // sender set remote ip
        $buffer2 = pack('C', $type) . pack('C', strlen($ip)) . $ip . pack('n', intval($port));
        $total_length = 4 + strlen($buffer2);
        fwrite($handler, pack('N', $total_length) . $buffer2);
    }

    public static function shutdown()
    {
        foreach(self::$handles as &$uniqueS) foreach($uniqueS as &$s) {if($s !== null) {fclose($s); $s = null;}}
    }
}

// \Pjf_Timer::start('timer_1', 'db 1');
// \Pjf_Timer::stop('timer_1');
// \Pjf_Timer::trace('timer_1', false);
class PJF_Timer
{
    private static $startArray = array();
    private static $endArray = array();
    private static $messageArray = array();

    public static function emppty()
    {
        self::$startArray = [];
        self::$endArray = [];
        self::$messageArray = [];
    }

    public static function start($timerID , $message) {
        list($usec, $sec) = explode(' ', microtime());
        self::$startArray[$timerID] = ((float)$usec + (float)$sec);
        self::$messageArray[$timerID] = $message;
    }


    public static function stop($timerID, $trace=null, $appendMes=null) {
        list($usec, $sec) = explode(' ', microtime());
        self::$endArray[$timerID] = ((float)$usec + (float)$sec);
        if($trace===true){
            self::traceAll();
        }
        if ($appendMes!==null) {
            self::$messageArray[$timerID] .= $appendMes;
        }
    }

    public static function trace($timerID ,$echo = true) {
        if (!(isset(self::$messageArray[$timerID]) && isset(self::$endArray[$timerID]) && isset(self::$startArray[$timerID]))) {
            if ($echo) {
                echo($timerID . ' error');
            }
            return 9999;
        }
//        $output = ' ' . self::$messageArray[$timerID].': '.sprintf('%2.6f' , (self::$endArray[$timerID] - self::$startArray[$timerID]))."s";
        $output = ' ' . self::$messageArray[$timerID].': '. round((self::$endArray[$timerID] - self::$startArray[$timerID]) * 1000, 5)."ms";
        if ($echo) {
            echo($output);
        }
        return $output;
    }


    public static function traceAll($timerIDs = null , $label = null , $echo = true) {
        $keys = $timerIDs == null ? array_keys(self::$endArray) : array_keys($timerIDs) ;
        $output = '<div style="border-style:dotted;border-width:1px;padding:10px"><fieldset style="padding:10px"><legend><strong>';
        $output .= ($label===null)?'xxxxxxxxx':$label;
        $output .= '</strong></legend><br /><pre>';
        foreach($keys as $k=>$v)
            $output .= self::trace($v,false) . "\r\n";
        $output .= '</pre><br /></fieldset></div>';
        if ($echo===true) {
            echo($output);
        }
        return $output;
    }
}
<?php
// php server_listener.php start      // 以debug（调试）方式启动
// php server_listener.php start -d   // 以daemon（守护进程）方式启动
// php server_listener.php stop       // 停止
// php server_listener.php restart    // 重启
// php server_listener.php reload     // 平滑重启
// php server_listener.php status     // 查看状态
if (!(php_sapi_name() === 'cli')) exit;
const VERSION = '1.0';  //

$port = '62538';
if ($argv[$argc - 1] != 'start' && $argv[$argc - 1] != 'stop' && $argv[$argc - 1] != 'status' && $argv[$argc - 1] != '-d') {
    $port = array_pop($argv);
    if (intval($port) <= 0) exit;
}

const RECEIVER = 2; // 开发人员接收app发来的数据
const SENDER = 1;   // app通过PJF_Monster_Debugger客户端发来数据

require_once './Workerman-for-linux/Autoloader.php';
use Workerman\Worker;
$worker = new Worker('frame://0.0.0.0:' . $port);

$worker->count = 1;

global $remote_connections;

$worker->onWorkerStart = function($worker)
{
    global $remote_connections;
    $remote_connections = array();
};

/* @var Workerman\Connection\ConnectionInterface $connection */
$worker->onConnect = function($connection)
{
    $connection->uniqid = uniqid();
    //global $remote_connections;
    //if ($connection->getRemoteIp() != '127.0.0.1') {
        //$remote_connections[$connection->getRemoteIp() . ':' . $connection->getRemotePort()] = $connection;
    //    echo '$remote_onConnect: ' . json_encode(array_keys($remote_connections)) . "\r\n";
    //} else {
//        /* @var Workerman\Connection\ConnectionInterface $remote */
//        foreach ($remote_connections as $remote) {
//            $remote->send('need connect');
//        }
    //    echo '$local_onConnect: ' . json_encode(array_keys($remote_connections)) . "\r\n";
    //}
};
/* @var Workerman\Connection\ConnectionInterface $connection */
$worker->onClose = function($connection)
{
    global $remote_connections;

    if (isset($connection->type)) {
        if ($connection->type == RECEIVER) {
            unset($remote_connections[$connection->str_ip_port][$connection->uniqid]);
            if (empty($remote_connections[$connection->str_ip_port])) {
                unset($remote_connections[$connection->str_ip_port]);
            }
            echo '$remote_onClose: ' . json_encode(array_keys($remote_connections)) . "\r\n";
        } elseif ($connection->type == SENDER) {
            $type = 1; // tell remote close
            if (!empty($remote_connections[$connection->str_ip_port])) {
                foreach ($remote_connections[$connection->str_ip_port] as $remote) {
                    $remote->send(pack('C', $type) . pack('C', strlen($connection->uniqid)) . $connection->uniqid);
                }
            }
            echo "{$connection->uniqid}: close \n";
        }
    }
};
/* @var Workerman\Connection\ConnectionInterface $connection */
$worker->onMessage = function($connection, $buffer)
{
    global $remote_connections;

    if (!isset($connection->type)) {
        $unpack_data = unpack('Ctype', substr($buffer, 0, 1));
        $type = $unpack_data['type']; // 1:sender set remote ip  2:receiver  3:sender trace data
        $unpack_data = unpack('Cip_length', substr($buffer, 1, 2));
        $ip_length = $unpack_data['ip_length'];
        $ip = substr($buffer, 2, $ip_length);
        $unpack_data = unpack('nport', substr($buffer, 1 + 1 + $ip_length, 2));
        $port = $unpack_data['port'];
        $connection->type = $type;
        $connection->str_ip_port = "$ip-$port";

        if ($connection->type === RECEIVER) {
            if (!isset($remote_connections[$connection->str_ip_port])) {
                $remote_connections[$connection->str_ip_port] = array();
            }
            $remote_connections[$connection->str_ip_port][$connection->uniqid] = $connection;
        }
        echo "{$connection->uniqid}: init success\n";
        echo '$connection->type: ' . $connection->type . "\n";
        echo '$connection->str_ip_port: ' . $connection->str_ip_port . "\n";
    } else {
        if ($connection->type === SENDER) {
            $unpack_data = unpack('Ctype', substr($buffer, 0, 1));
            $type = $unpack_data['type']; // 1:sender set remote ip  2:receiver  3:sender trace data
            if ($type == 1) {
                $unpack_data = unpack('Cip_length', substr($buffer, 1, 2));
                $ip_length = $unpack_data['ip_length'];
                $ip = substr($buffer, 2, $ip_length);
                $unpack_data = unpack('nport', substr($buffer, 1 + 1 + $ip_length, 2));
                $port = $unpack_data['port'];
                $connection->str_ip_port = "$ip-$port";
                echo 'change $connection->str_ip_port: ' . $connection->str_ip_port . "\n";
                return;
            }
            if ($type == 3) {
                if (!empty($remote_connections[$connection->str_ip_port])) {
                    foreach ($remote_connections[$connection->str_ip_port] as $remote) {
                        $type = 2; // tell remote this is msg to send to monster
                        $remote->send(pack('C', $type) . pack('C', strlen($connection->uniqid)) . $connection->uniqid. substr($buffer, 1));
                    }
                }
                $unpack_data = unpack('NtraceStrLength', substr($buffer, 3, 4));
                $traceStrLength = $unpack_data['traceStrLength'];
                echo "{$connection->uniqid}: message: " . substr($buffer, 7, $traceStrLength) . "\n";
            }
        }
    }
};
Worker::runAll();
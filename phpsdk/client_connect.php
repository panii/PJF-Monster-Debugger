<?php
// php client_connect.php start      // 以debug（调试）方式启动
// php client_connect.php start -d   // 以daemon（守护进程）方式启动
// php client_connect.php stop       // 停止
// php client_connect.php restart    // 重启
// php client_connect.php reload     // 平滑重启
// php client_connect.php status     // 查看状态
if (!(php_sapi_name() === 'cli')) exit;
const VERSION = '1.0';


//if (strpos(strtolower(php_uname()), 'windows') !== false) {
//    $command = "ipconfig";
//} else {
//    $command = "ifconfig";
//}
//exec($command, $output, $return_var);
//var_dump($output);
//$output = join('', $output);
//if (($pos = strpos($return_var, '192')) === false) {
//    $pos = strpos($return_var, '172');
//}
//var_dump(strpos($return_var, '192'));
//
//
//
//
//exit;

require_once './Workerman-for-win/Autoloader.php';
use \Workerman\Worker;
use \Workerman\Connection\AsyncTcpConnection;
use \Workerman\Lib\Timer;


global $ipPort;
$ipPort = 'web_sms_dev_pjf.leesrobots.com:62538';

echo "Please enter 'IP:PORT' to connect to server. Default '$ipPort', type 'exit' to exit" . "\r\n\r\n";
$ipport = getStdIn("Enter IP:PORT   ");
echo "\r\n\r\n";
if ($ipport != '') {
    $ipPort = $ipport;
}
if ($ipport === 'exit') {
    exit;
}


global $ipPort3;
$ipPort3 = '';

echo "Please enter 'IP:PORT' your monster listening. Type 'exit' to exit" . "\r\n\r\n";
$ipport = getStdIn("Enter IP:PORT   ");
echo "\r\n\r\n";
if ($ipport != '') {
    $ipPort3 = $ipport;
}
if ($ipport === 'exit') {
    exit;
}
list($ip, $port) = explode(':', $ipPort3);
if (!$ip || !$port) {
    die('IP:PORT type error!');
}


//global $ipPort2;
//$ipPort2 = '127.0.0.1:62538';
//
//echo "Please enter 'IP:PORT' to connect to monster. Default '$ipPort2', type 'exit' to exit" . "\r\n\r\n";
//$ipport = getStdIn("Enter IP:PORT   ");
//echo "\r\n\r\n";
//if ($ipport != '') {
//    $ipPort2 = $ipport;
//}
//if ($ipport === 'exit') {
//    exit;
//}


function getStdIn($message)
{
    echo $message;
    $stdin = fopen('php://stdin','r');
    $some = trim(fgets($stdin,100));
    fclose($stdin);
    return $some;
}

$worker = new Worker();

$worker->count = 1;

global $replay;
global $replayTimer;

$worker->onWorkerStart = function($worker)
{
    global $ipPort;
    $connection_to_server = new AsyncTcpConnection('frame://' . $ipPort);

    // 初始化
    global $replay;
    global $replayTimer;
    $replay = array();
    $replayTimer = array();

    /* @var Workerman\Connection\AsyncTcpConnection $connection_to_server */
    $connection_to_server->onConnect = function($connection_to_server)
    {
        echo "server connect success\n";
        // 每10秒执行一次 ping
        $time_interval = 10;
        $connect_time = time();
        $connection_to_server->timer_id = Timer::add($time_interval, function() use($connection_to_server, $connect_time)
        {
            $connection_to_server->send(time());
        });

        $connection_to_server->uniqid = uniqid();

        global $ipPort3;
        list($ip, $port) = explode(':', $ipPort3);
        $type = 2; // receiver
        $connection_to_server->send(pack('C', $type) . pack('C', strlen($ip)) . $ip . pack('n', intval($port)));
    };
    /* @var Workerman\Connection\AsyncTcpConnection $connection_to_server */
    $connection_to_server->onMessage = function($connection_to_server, $buffer)
    {
//        echo '$buffer from server: ' . $buffer . "\r\n";
        $unpack_data = unpack('Ctype', substr($buffer, 0, 1));
        $type = $unpack_data['type']; // 1:close  2:msg

        $unpack_data = unpack('CSenderUniqIDLength', substr($buffer, 1, 1));
        $SenderUniqIDLength = $unpack_data['SenderUniqIDLength'];

        $SenderUniqID = substr($buffer, 1 + 1, $SenderUniqIDLength);

        global $replay;
        if (!isset($replay[$SenderUniqID])) {
            $replay[$SenderUniqID] = [];
            new SendToMonster($SenderUniqID);
            echo "new SendToMonster($SenderUniqID)" . "\n";
//            echo '$replays: ' . json_encode(array_keys($replay)) . "\n";
        }

        if ($type == 1) { // close
            $replay[$SenderUniqID][] = ['close'];
        } elseif ($type == 2) { // msg
            $replay[$SenderUniqID][] = ['msg', substr($buffer, 1 + 1 + $SenderUniqIDLength)];
        }
    };
    /* @var Workerman\Connection\AsyncTcpConnection $connection_to_server */
    $connection_to_server->onClose = function($connection_to_server)
    {
        echo "server connection closed\n";
        $connection_to_server->reConnect();
    };
    $connection_to_server->onError = function($connection_to_server, $code, $msg)
    {
        echo "server Error code:$code msg:$msg\n";
        exit;
    };
    $connection_to_server->connect();
};

class SendToMonster
{
    /* @var Workerman\Connection\AsyncTcpConnection $connection_to_monster */
    private $connection_to_monster;
    private $uniqid;
    private $connectsuccess = false;

    public function __construct($uniqid)
    {
        global $ipPort3;
        $connection_to_monster = new AsyncTcpConnection('tcp://' . $ipPort3);
        $this->connection_to_monster = $connection_to_monster;
        $this->uniqid = $uniqid;

        /* @var Workerman\Connection\AsyncTcpConnection $connection_to_monster */
        $connection_to_monster->onConnect = function($connection_to_monster) use($uniqid)
        {
            global $replayTimer;
//            echo "$uniqid monster connect success\n";
            $this->connectsuccess = true;
            $replayTimer[$uniqid] = $this->startTimer($connection_to_monster, $uniqid);
        };
        /* @var Workerman\Connection\AsyncTcpConnection $connection_to_monster */
        $connection_to_monster->onMessage = function($connection_to_monster, $buffer)
        {
//            echo 'monster $buffer from monster: ' . $buffer . "\r\n";
        };
        /* @var Workerman\Connection\AsyncTcpConnection $connection_to_monster */
        $connection_to_monster->onClose = function($connection_to_monster)
        {
            echo "monster connection closed\n";
            if ($this->connectsuccess == false) {
                return false;
            }
            
            global $replayTimer;
            // 删除定时器
            $uniqid = $this->uniqid;
            global $replay;
            Timer::del($replayTimer[$uniqid]);
            unset($replay[$uniqid]);
            unset($replayTimer[$uniqid]);
            echo '$replays: ' . json_encode(array_keys($replay)) . "\n";
            $connection_to_monster = null;
            $this->connection_to_monster = null;
        };
        $connection_to_monster->onError = function($connection_to_monster, $code, $msg)
        {
            echo "monster Error code:$code msg:$msg\n";
        };

        $connection_to_monster->connect();
    }

    public function startTimer($connection_to_monster = null, $uniqid = null)
    {
        if ($connection_to_monster === null) {
            $connection_to_monster = $this->connection_to_monster;
        }
        if ($uniqid === null) {
            $uniqid = $this->uniqid;
        }
        return Timer::add(0.1, function() use($connection_to_monster, $uniqid)
        {
            global $replay;
//            echo "Timer Tick..\n";
            $reply = array_shift($replay[$uniqid]);
            if (is_array($reply)) {
                if ($reply[0] === 'msg') {
                    $connection_to_monster->send($reply[1]);
                    return;
                } elseif ($reply[0] === 'close') {
                    $connection_to_monster->close();
                }
            }
        });
    }
}

Worker::runAll();
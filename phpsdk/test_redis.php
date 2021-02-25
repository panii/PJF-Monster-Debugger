<?php
use Workerman\Worker;
use Workerman\WebServer;
use Workerman\Autoloader;
use PHPSocketIO\SocketIO;
use Clue\React\Redis\Factory;
use Clue\React\Redis\Client;

if (!(php_sapi_name() === 'cli')) exit;
const VERSION = '0.1';

require_once './Workerman-for-linux/Lib/phpsocket.io/autoload.php';
require_once './Workerman-for-linux/Autoloader.php';
require_once './AsyncRedis-for-linux/vendor/autoload.php';

if (true) {
$web = new WebServer('http://0.0.0.0:2022');
$web->addRoot('localhost', __DIR__ . '/Workerman-for-linux/Lib/phpsocket.io/examples/chat/public');
    $web->onMessage = function($connection, $data)
    {
        // 向客户端发送hello $data
        $connection->send('hello ' . $data);
    };
$io = new SocketIO(2020);
$io->on('workerStart', function() use ($io) {
    global $factory;
    $loop    = Worker::getEventLoop();
    $factory = new Factory($loop);

    $factory->createClient('127.0.0.1:6379')->then(function (Client $redis) use ($io) {
        $redis->subscribe('web16testchannel');

        $redis->on('message', function ($channel, $payload) use ($io) {
            // pubsub message received on given $channel
            if ($channel == 'web16testchannel') {
                $io->emit('new message', array(
                    'username'=> 'test1',
                    'message'=> 'aaa' . $payload
                ));
            }
        });
    });
});

$io->on('connection', function($socket){
    $socket->addedUser = false;

    // when the client emits 'new message', this listens and executes
    $socket->on('new message', function ($data)use($socket){
        // we tell the client to execute 'new message'
        $socket->broadcast->emit('new message', array(
            'username'=> $socket->username,
            'message'=> $data
        ));
    });

    // when the client emits 'add user', this listens and executes
    $socket->on('add user', function ($username) use($socket){
        global $usernames, $numUsers;
        // we store the username in the socket session for this client
        $socket->username = $username;
        // add the client's username to the global list
        $usernames[$username] = $username;
        ++$numUsers;
        $socket->addedUser = true;
        $socket->emit('login', array(
            'numUsers' => $numUsers
        ));
        // echo globally (all clients) that a person has connected
        $socket->broadcast->emit('user joined', array(
            'username' => $socket->username,
            'numUsers' => $numUsers
        ));
    });

    // when the client emits 'typing', we broadcast it to others
    $socket->on('typing', function () use($socket) {
        $socket->broadcast->emit('typing', array(
            'username' => $socket->username
        ));
    });

    // when the client emits 'stop typing', we broadcast it to others
    $socket->on('stop typing', function () use($socket) {
        $socket->broadcast->emit('stop typing', array(
            'username' => $socket->username
        ));
    });

    // when the user disconnects.. perform this
    $socket->on('disconnect', function () use($socket) {
        global $usernames, $numUsers;
        // remove the username from global usernames list
        if($socket->addedUser) {
            unset($usernames[$socket->username]);
            --$numUsers;

            // echo globally that this client has left
            $socket->broadcast->emit('user left', array(
                'username' => $socket->username,
                'numUsers' => $numUsers
            ));
        }
    });
});
}
$worker = new Worker('http://0.0.0.0:2023');

// 进程启动时
$worker->onWorkerStart = function() {
    global $factory;
    $loop    = Worker::getEventLoop();
    $factory = new Factory($loop);

//    $factory->createClient('127.0.0.1:6379')->then(function (Client $redis) {
//        $redis->subscribe('web16testchannel');
//    });
};
//$worker->count = 4;

$worker->onMessage = function($connection, $data) {
//    global $factory;
//    $factory->createClient('127.0.0.1:6379')->then(function (Client $client) use ($connection) {
//        $client->set('greeting', 'Hello world');
//        $client->append('greeting', '!');

//        $client->get('greeting')->then(function ($greeting) use ($connection){
//            // Hello world!
//            echo $greeting . PHP_EOL;
//            $connection->send($greeting);
//        });

//        $client->incr('invocation')->then(function ($n) use ($connection){
//            echo 'This is invocation #' . $n . PHP_EOL;
//            //$connection->send($n);
//        });

//    });
    $s = '|';
//    if (isset($_SERVER['REQUEST_URI'])) {
//        $s .= $_SERVER['REQUEST_URI'];
//    }
    $connection->send($s . $data['server']['REQUEST_URI']);
};

Worker::runAll();

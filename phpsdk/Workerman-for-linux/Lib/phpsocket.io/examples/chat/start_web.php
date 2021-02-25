<?php
use Workerman\Worker;
use Workerman\WebServer;
use Workerman\Autoloader;
use PHPSocketIO\SocketIO;

// composer autoload
include_once __DIR__ . '/../../autoload.php';
include_once __DIR__ . '/../../../../Autoloader.php';

$web = new WebServer('http://0.0.0.0:2022');
$web->addRoot('localhost', __DIR__ . '/public');

if (!defined('GLOBAL_START')) {
    Worker::runAll();
}

var express = require('express'),
    app = express(),
    __dirname = './public';

app.use(express.static(__dirname));
console.info('Server started!');

app.listen(8080);


//=================================WebSockets!!!!!=================

var WebSocketServer = new require('ws');

// подключенные клиенты
var clients = {};

// WebSocket-сервер на порту 8081
var webSocketServer = new WebSocketServer.Server({
	port: 8081
});
webSocketServer.on('connection', function (ws) {

	var id = Math.random();
	clients[id] = ws;
	console.log("новое соединение " + id);

	ws.on('message', function (message) {
		console.log('получено сообщение ' + message);

        sendOutWS(message);
	});

	ws.on('close', function () {
		console.log('соединение закрыто ' + id);
		delete clients[id];
	});

});

function sendOutWS(message) {
    for (var key in clients) {
        clients[key].send(message);
    }
}

function sendOutCOMET(message) {
    for (var id in subscribers) {
        console.log("отсылаю сообщение " + id);
        var res = subscribers[id];
        res.end(message);
    }
}

//======================== COMET===================
var http = require('http');
var url = require('url');
var querystring = require('querystring');
//var static = require('node-static');

//var fileServer = new static.Server('.');

var subscribers = {};

function onSubscribe(req, res) {
	var id = Math.random();

	res.setHeader('Content-Type', 'text/plain;charset=utf-8');
	res.setHeader("Cache-Control", "no-cache, must-revalidate");

	subscribers[id] = res;
	console.log("новый клиент " + id + ", клиентов:" + Object.keys(subscribers).length);

	req.on('close', function () {
		delete subscribers[id];
		console.log("клиент "+id+" отсоединился, клиентов:" + Object.keys(subscribers).length);
	});

}

function publish(message) {

	console.log("есть сообщение, клиентов:" + Object.keys(subscribers).length);

    sendOutCOMET(message);

	subscribers = {};
}

function accept(req, res) {
	var urlParsed = url.parse(req.url, true);

	// новый клиент хочет получать сообщения
	//if (urlParsed.pathname == '/publishsubscribe/') {
		if (urlParsed.pathname == '/subscribe') {
		onSubscribe(req, res); // собственно, подписка
		return;
	}

	console.log('XHR: '+req);
	console.log('XHR urlParsed.pathname '+urlParsed.pathname);

	// отправка сообщения
	//if (urlParsed.pathname == '/publishpublish/' && req.method == 'POST') {
		if (urlParsed.pathname == '/publish' && req.method == 'POST') {
		// принять POST-запрос
		req.setEncoding('utf8');
		var message = '';
		req.on('data', function (chunk) {
			message += chunk;
		}).on('end', function () {
			publish(message); // собственно, отправка
			res.end("ok");
		});

		return;
	}

	// всё остальное -- статика
	//fileServer.serve(req, res);

}


// -----------------------------------

if (!module.parent) {
	http.createServer(accept).listen(8082);
	console.log('Сервер запущен на порту 8082');
} else {
	exports.accept = accept;
}
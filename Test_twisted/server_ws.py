# coding: utf-8


import sys
from twisted.web.static import File
from twisted.python import log
from twisted.web.server import Site
from twisted.internet import reactor
from autobahn.twisted.websocket import WebSocketServerProtocol
import json
from preprocessing import *


class MyServerProtocol(WebSocketServerProtocol):
    def onConnect(self, request):
        print("Client connecting: {}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        if isBinary:
            print("Binary message received: {} bytes".format(len(payload)))
        else:
            msg = handle_msg(payload)
            if msg:
                self.sendMessage(msg.encode('utf8'), False)


    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {}".format(reason))


def handle_msg(msg):
    request = json.loads(msg.decode('utf8'))
    print("Text message received")
    print("Request : " + request['task'])
    print("Request emitted by client at " + str(request['date']))
    if request['task'] == "preprocess":
        return json.dumps({'idReq': request['idReq'],
                           'data': preprocess(request['data']),
                           'date': request['date'],
                           'task': request['task']})
    elif request['task'] == "sayHello":
        return json.dumps({'idReq': request['idReq'],
                           'data': "Hello",
                           'date': request['date'],
                           'task': request['task']})


def preprocess(data):
    df = create_df2(data)
    print("Columns in the original data :")
    print(df.columns.values)
    df = remove_categorical_var2(df)
    print("Columns in the returned data :")
    print(df.columns.values)
    return create_dict(df)


if __name__ == '__main__':
    import sys

    # static file server seving index_old.html as root
    root = File(".")

    from twisted.python import log
    from twisted.internet import reactor

    log.startLogging(sys.stdout)

    from autobahn.twisted.websocket import WebSocketServerFactory

    factory = WebSocketServerFactory()
    factory.protocol = MyServerProtocol

    reactor.listenTCP(9000, factory)
    site = Site(root)
    reactor.listenTCP(8080, site)
    reactor.run()

# coding: utf-8


import sys
from twisted.web.static import File
from twisted.python import log
from twisted.web.server import Site
from twisted.internet import reactor
from autobahn.twisted.websocket import WebSocketServerProtocol
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
            print("Text message received: {}".format(payload.decode('utf8')))

        df = create_df(payload.decode('utf8'))
        df = remove_categorical_var(df)
        self.sendMessage(create_json(df).encode('utf8'), isBinary)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {}".format(reason))


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

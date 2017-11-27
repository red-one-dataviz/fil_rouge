# # coding: utf-8
# import sys
# import random
#
# from twisted.web.static import File
# from twisted.python import log
# from twisted.web.server import Site
# from twisted.internet import reactor
#
# from autobahn.twisted.websocket import WebSocketServerFactory, \
#     WebSocketServerProtocol
#
# from autobahn.twisted.resource import WebSocketResource
#
#
# class PFRServerProtocol(WebSocketServerProtocol):
#     def onOpen(self):
#         """
#                Connection from client is opened. Fires after opening
#                websockets handshake has been completed and we can send
#                and receive messages.
#                """
#         print("Connexion !")
#         self.factory.register(self)
#
#     def connectionLost(self, reason):
#         """
#                Client lost connection, either disconnected or some error.
#                Remove client from list of tracked connections.
#                """
#         print("Client déconnecté :(")
#         self.factory.unregister(self)
#
#     def onMessage(self, payload, isBinary):
#         """
#                Message sent from client, communicate this message to its conversation partner,
#                """
#         print("Message reçu du client !", payload, isBinary)
#         self.factory.communicate(self, payload, isBinary)
#
#
# class PFRFactory(WebSocketServerFactory):
#     def __init__(self, *args, **kwargs):
#         super(PFRFactory, self).__init__(*args, **kwargs)
#         self.clients = {}
#
#     def register(self, client):
#         """
#                Add client to list of managed connections.
#                """
#         self.clients[client.peer] = {"object": client, "data": None}
#
#     def unregister(self, client):
#         """
#                Remove client from list of managed connections.
#                """
#         self.clients.pop(client.peer)
#
#     def communicate(self, client, payload, isBinary):
#         c = self.clients[client.peer]
#         print(c + " essaye de communiquer !")
#
#
# if __name__ == "__main__":
#     log.startLogging(sys.stdout)
#
#     root = File(".")
#
#     # factory = PFRFactory(u"ws://127.0.0.1:8080", debug=True)
#     factory = PFRFactory(u"ws://127.0.0.1:8080")
#     factory.protocol = PFRServerProtocol
#     resource = WebSocketResource(factory)
#     # websockets resource on "/ws" path
#     root.putChild(u"ws", resource)
#
#     site = Site(root)
#     reactor.listenTCP(8080, site)
#     reactor.run()





# import sys
# from twisted.web.static import File
# from twisted.python import log
# from twisted.web.server import Site
# from twisted.internet import reactor
#
# from autobahn.twisted.websocket import WebSocketServerFactory, \
#     WebSocketServerProtocol
#
# from autobahn.twisted.resource import WebSocketResource
#
#
# class SomeServerProtocol(WebSocketServerProtocol):
#     def onConnect(self, request):
#         print("some request connected {}".format(request))
#
#     def onMessage(self, payload, isBinary):
#         self.sendMessage("message received")
#
#
# if __name__ == "__main__":
#     log.startLogging(sys.stdout)
#
#     # static file server seving index.html as root
#     root = File(".")
#
#     factory = WebSocketServerFactory(u"ws://127.0.0.1:8080")
#     factory.protocol = SomeServerProtocol
#     resource = WebSocketResource(factory)
#     # websockets resource on "/ws" path
#     root.putChild(u"ws", resource)
#
#     site = Site(root)
#     reactor.listenTCP(8080, site)
#     reactor.run()



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

        df = remove_categorical_var(get_df(payload.decode('utf8')))
        ret = df.to_json(orient='records')
        self.sendMessage(ret.encode('utf8'), isBinary)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {}".format(reason))

if __name__ == '__main__':

    import sys
    # static file server seving index.html as root
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

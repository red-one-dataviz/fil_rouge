from twisted.web.static import File
from twisted.internet import reactor
from twisted.web.resource import Resource
from twisted.web.server import Site
import json
import time

resource = File(r'html')
factory = Site(resource)
print(resource)
print(factory)
reactor.listenTCP(9000, factory)


class ClientCountResource:
    def __init__(self):
        print("inited")

    def render_GET(self, request):
        # Need to return as a callback.
        callback = request.args['callback'][0]
        return_payload = {'time': time.ctime(),
                          'client_count': 2}
        return "%s(%s)" % (callback, json.dumps(return_payload))


root = Resource()
root.putChild("get_client_count", ClientCountResource())
factory = Site(root)
reactor.listenTCP(9001, factory)

reactor.run()

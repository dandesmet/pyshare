import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.template
import os, uuid
from collections import deque
 
__UPLOADS__ = os.path.join(os.getcwd(), 'uploads')
open_sockets = []
message_queue = deque([], 10)
file_queue = deque([], 10)

def get_upload_path(filename):
    return os.path.relpath(os.path.join(__UPLOADS__, filename))
 
class Upload(tornado.web.RequestHandler):
    def post(self):
        fileinfo = self.request.files['fileUpload'][0]
        #print "fileinfo is", fileinfo
        fname = fileinfo['filename']
        path = get_upload_path(fname)
        print 'PATH: ' + path
        fh = open(path, 'w')
        fh.write(fileinfo['body'])

        # file is saved; now notify other clients
        for socket in open_sockets:
            # This is a terrible way to do this, but it will work, so whatever
            socket.write_message('#[!FILE:' + str(path))
            print '#[!FILE:' + str(path)

        # add the file to the queue for future clients if they want
        file_queue.append(path)

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        loader = tornado.template.Loader(".")
        self.write(loader.load("index.html").generate())

class WSHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        print 'connection opened...'
        open_sockets.append(self)
        print "Current clients: " + str(len(open_sockets))
        for message in message_queue:
            self.write_message(message)

        for path in file_queue:
            self.write_message('#[!FILE:' + str(path))
        #self.write_message("Connection accepted.")

    def on_message(self, message):
        message_queue.append(message)
        for socket in open_sockets:
            socket.write_message(message)
        print 'received:', message

    def on_close(self):
        print 'connection closed...'
        open_sockets.remove(self)
        print "Current clients: " + str(len(open_sockets))

application = tornado.web.Application([
    (r'/ws', WSHandler),
    (r'/upload', Upload),
    (r'/', MainHandler),
    (r"/(.*)", tornado.web.StaticFileHandler, {"path": os.curdir}),
])

if __name__ == "__main__":
    # create the uploads directory if necessary
    if not os.path.exists(__UPLOADS__):
        os.makedirs(__UPLOADS__)
    application.listen(9090)
    tornado.ioloop.IOLoop.instance().start()
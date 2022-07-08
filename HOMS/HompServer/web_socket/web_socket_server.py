# 
# The MIT License
# 
# Copyright (c) 2022 ETRI
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
# 

import threading
from simple_websocket_server import WebSocketServer

from config import WEB_SOCKET_CONFIG
from data.factory import Factory
from web_socket.web_socket_handler import WebSocketHandler
from web_socket.web_socket_manager import WebSocketManager


class Hp2pWebSocketServer:
    def __init__(self):
        self.host = WEB_SOCKET_CONFIG['HOST']
        self.port = WEB_SOCKET_CONFIG['PORT']

    def start(self):
        t = threading.Thread(target=self.run_web_socket_server, daemon=True)
        t.start()

    def run_web_socket_server(self):
        print('[SERVER] Start Web Socket Server...')
        manager = WebSocketManager()
        Factory.get().set_web_socket_manager(manager)

        server = WebSocketServer(self.host, self.port, WebSocketHandler)
        server.serve_forever()

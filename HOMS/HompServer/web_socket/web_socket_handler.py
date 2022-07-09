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

import json
from simple_websocket_server import WebSocket

from config import LOG_CONFIG
from data.factory import Factory


class WebSocketHandler(WebSocket):
    def handle(self):
        if LOG_CONFIG['PRINT_WEB_SOCKET_LOG']:
            print('[WebSocketHandler]', self.address, 'message', self.data)
        try:
            json_data = json.loads(self.data)
            if 'server' in json_data:
                overlay_id = json_data.get('overlay_id')
                if json_data.get('action') == 'hello':
                    Factory.get().get_web_socket_manager().append_client(self)
                elif json_data.get('action') == 'get' and overlay_id is not None:
                    overlay = Factory.get().get_overlay(overlay_id)
                    if overlay is not None:
                        message = Factory.get().get_web_socket_manager().create_overlay_cost_map_message(overlay)
                        self.send_message(json.dumps(message))
            else:
                if 'peer-id' in json_data:
                    peer_id = json_data.get('peer-id')
                    if json_data.get('action') == 'hello':
                        Factory.get().get_web_socket_manager().add_peer_web_socket(peer_id, self)
                    elif json_data.get('action') == 'bye':
                        Factory.get().get_web_socket_manager().delete_peer_web_socket(self)
                elif 'toid' in json_data:
                    to_id = json_data.get('toid')
                    Factory.get().get_web_socket_manager().send_message_to_peer(to_id, json_data)
                else:
                    if LOG_CONFIG['PRINT_WEB_SOCKET_LOG']:
                        print('[WebSocketHandler] Handle Error...')
        except Exception as err_handle:
            if LOG_CONFIG['PRINT_WEB_SOCKET_LOG']:
                print(err_handle)
            pass

    def connected(self):
        if LOG_CONFIG['PRINT_WEB_SOCKET_LOG']:
            print('[WebSocketHandler]', self.address, 'connected')

    def handle_close(self):
        if LOG_CONFIG['PRINT_WEB_SOCKET_LOG']:
            print('[WebSocketHandler]', self.address, 'closed')
        Factory.get().get_web_socket_manager().remove_client(self)
        Factory.get().get_web_socket_manager().delete_peer_web_socket(self)

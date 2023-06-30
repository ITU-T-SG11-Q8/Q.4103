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

from config import LOG_CONFIG
from classes.overlay import Overlay
from classes.peer import Peer


class WebSocketManager:
    def __init__(self):
        self._peer_web_socket_dict = {}
        self._client_list = []


    def add_peer_web_socket(self, peer_id, client):
        if client not in self._peer_web_socket_dict:
            print('[WebSocketManager] Add Peer =>', peer_id)
            self._peer_web_socket_dict[peer_id] = client

    def delete_peer_web_socket(self, client):
        remove_peer_id = None
        for peer_id in self._peer_web_socket_dict.keys():
            connection = self._peer_web_socket_dict[peer_id]
            if connection == client:
                remove_peer_id = peer_id
                break

        if remove_peer_id is not None:
            print('[WebSocketManager] Delete Peer =>', remove_peer_id)
            del self._peer_web_socket_dict[remove_peer_id]

    def send_message_to_peer(self, peer_id, message):
        if peer_id in self._peer_web_socket_dict:
            connection = self._peer_web_socket_dict[peer_id]
            connection.send_message(json.dumps(message))
            return True
        else:
            return False

    def append_client(self, client):
        print(self)
        if client not in self._client_list:
            print('[WebSocketManager] Append Client =>', client.address)
            self._client_list.append(client)
            print('afterappend', self._client_list)

    def remove_client(self, client):
        if client in self._client_list:
            print('[WebSocketManager] Remove Client =>', client.address)
            self._client_list.remove(client)

    def send_message_to_client(self, message):
        print(self)
        for client in self._client_list:
            client.send_message(json.dumps(message))

    def send_create_overlay_message(self, overlay_id):
        self.send_message_to_client({'overlay_id': overlay_id, 'type': 'overlay', 'action': 'create'})

    def send_remove_overlay_message(self, overlay_id):
        self.send_message_to_client({'overlay_id': overlay_id, 'type': 'overlay', 'action': 'remove'})

    def send_add_peer_message(self, overlay_id, peer_id, ticket_id):
        self.send_message_to_client(self.create_add_node_message(overlay_id, peer_id, ticket_id))

    def send_delete_peer_message(self, overlay_id, peer_id):
        self.send_message_to_client(self.create_delete_node_message(overlay_id, peer_id))

    def send_update_peer_message(self, overlay_id, peer_id, costmap):
        message = self.create_update_link_message(overlay_id, peer_id, costmap)
        if message is not None:
            self.send_message_to_client(message)

    def send_log_message(self, overlay_id, peer_id, message):
        if LOG_CONFIG['PRINT_WEB_SOCKET_LOG']:
            self.send_message_to_client(self.create_log_message(overlay_id, peer_id, message))

    @classmethod
    def create_overlay_cost_map_message(cls, overlay: Overlay):
        get_peer_dic = overlay.get_peer_dict()
        nodes = []
        links = []

        for p_item in get_peer_dic.values():
            peer: Peer = p_item
            node = {'id': peer.peer_id, 'ticket_id': peer.ticket_id}
            if peer.ticket_id == 1:
                node['seeder'] = True
            nodes.append(node)
            costmap = peer.costmap

            if costmap is not None and costmap.get('primary') is not None and costmap.get(
                    'outgoing_candidate') is not None:
                for primary_peer_id in peer.costmap.get('primary'):
                    link = {'source': peer.peer_id, 'target': primary_peer_id, 'primary': True}
                    reverse_link = {'source': primary_peer_id, 'target': peer.peer_id, 'primary': True}

                    if link not in links and reverse_link not in links:
                        links.append(link)

                for candidate_peer_id in peer.costmap.get('outgoing_candidate'):
                    links.append({'source': peer.peer_id, 'target': candidate_peer_id, 'primary': False})

        return {
            'overlay_id': overlay.overlay_id,
            'type': 'peer',
            'action': 'current_cost_map',
            'data': {
                'graph': [],
                'nodes': nodes,
                'links': links,
                'directed': False,
                'multigraph': True
            }
        }

    @classmethod
    def create_add_node_message(cls, overlay_id, peer_id, ticket_id):
        return {
            'overlay_id': overlay_id,
            'type': 'peer',
            'action': 'add_peer',
            'node': {
                'id': peer_id,
                'ticket_id': ticket_id
            }
        }

    @classmethod
    def create_delete_node_message(cls, overlay_id, peer_id):
        return {
            'overlay_id': overlay_id,
            'peer_id': peer_id,
            'type': 'peer',
            'action': 'delete_peer'
        }

    @classmethod
    def create_update_link_message(cls, overlay_id, peer_id, costmap):
        #peer_id = costmap.get('peer_id')
        #costmap_dict = costmap.get('costmap')
        costmap_dict = costmap

        links = []

        if costmap_dict is not None and costmap_dict.get('primary') is not None and costmap_dict.get(
                'outgoing_candidate') is not None:
            for primary_peer_id in costmap_dict.get('primary'):
                links.append({'source': peer_id, 'target': primary_peer_id, 'primary': True})

            for candidate_peer_id in costmap_dict.get('outgoing_candidate'):
                links.append({'source': peer_id, 'target': candidate_peer_id, 'primary': False})

        if len(links) < 1:
            return None
        else:
            return {
                'overlay_id': overlay_id,
                'peer_id': peer_id,
                'type': 'peer',
                'action': 'update_connection',
                'links': links
            }

    @classmethod
    def create_log_message(cls, overlay_id, peer_id, message):
        return {
            'overlay_id': overlay_id,
            'peer_id': peer_id,
            'type': 'log',
            'message': message
        }

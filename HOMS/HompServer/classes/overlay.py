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

class Overlay:
    def __init__(self):
        self.overlay_id = None
        self.expires = 0
        self.heartbeat_interval = 0
        self.heartbeat_timeout = 0
        self.update_time = None
        self._peer_dic = {}
        self._current_ticket_id = 0

    def has_peer(self, pid, iid):
        return pid + str(iid) in self._peer_dic.keys()

    def get_peer(self, pid, iid):
        key = pid + str(iid)
        return self._peer_dic[key] if key in self._peer_dic else None

    def add_peer(self, pid, iid, peer):
        key = pid + str(iid)
        self._peer_dic[key] = peer

    def delete_peer(self, pid, iid):
        key = pid + str(iid)
        del self._peer_dic[key]

    def get_peer_dict(self):
        return self._peer_dic

    def get_current_ticket_id(self):
        self._current_ticket_id += 1
        return self._current_ticket_id

    def set_current_ticket_id(self, ticket_id):
        self._current_ticket_id = ticket_id

    def is_empty_overlay(self):
        return len(self._peer_dic) < 1

    def activation_peer_count(self):
        count = 0
        for peer in self._peer_dic.values():
            if peer.num_primary > 0:
                count += 1
        return count

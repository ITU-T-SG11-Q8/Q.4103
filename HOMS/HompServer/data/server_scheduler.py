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

import time
import threading
import schedule
from datetime import datetime

from config import HOMS_CONFIG
from classes.overlay import Overlay
from classes.peer import Peer
from data.factory import Factory
from database.db_connector import DBConnector
import database.db_query as query


class ServerScheduler:
    def __init__(self):
        self._interval = 0
        self._sleep_interval = 1
        self.fmt = '%Y-%m-%d %H:%M:%S.%f'
        self._is_run_scheduler = True
        self._is_delete_empty_overlay = HOMS_CONFIG['DELETE_EMPTY_OVERLAY']
        self._show_log = True

    def start(self, interval):
        self._interval = interval
        self.print_log('Start.')
        t = threading.Thread(target=self.run_pending, daemon=True)
        t.start()

    def stop(self):
        schedule.clear()
        self._interval = 0
        self._is_run_scheduler = False

    def run_pending(self):
        if self._interval > 0:
            schedule.every(self._interval).seconds.do(self.check_alive_peer)
        else:
            self.print_log('Stop.')
            return

        while self._is_run_scheduler:
            schedule.run_pending()
            time.sleep(self._sleep_interval)

    def delete_peer_and_empty_overlay(self, overlay_id, peer_id):
        db_connector = DBConnector()
        try:
            db_connector.delete(query.DELETE_HP2P_PEER, (peer_id, overlay_id))
            overlay = Factory.get().get_overlay(overlay_id)
            overlay.delete_peer(peer_id)

            peerKey = peer_id

            Factory.get().get_web_socket_manager().send_log_message(overlay_id, peerKey, 'Overlay Leave.')
            self.print_log('Leave Peer Overlay: {0}, Peer ID : {1}'.format(overlay_id, peerKey))

            if self._is_delete_empty_overlay and overlay.is_empty_overlay():
                db_connector.delete_hp2p_data(overlay_id)

                Factory.get().delete_overlay(overlay_id)
                Factory.get().get_web_socket_manager().send_remove_overlay_message(overlay_id)
                Factory.get().get_web_socket_manager().send_log_message(overlay_id, peerKey, 'Overlay Removal(Empty).')
                self.print_log('Removal Overlay(Empty). {0} / {1}'.format(overlay_id, peerKey))
            else:
                Factory.get().get_web_socket_manager().send_delete_peer_message(overlay_id, peerKey)

            db_connector.commit()
        except Exception as err_delete:
            db_connector.rollback()
            self.print_log(err_delete)

    def check_alive_peer(self):
        try:
            overlay_dic = Factory.get().get_overlay_dict()
            delete_peer_list = []

            for o_item in overlay_dic.values():
                overlay: Overlay = o_item
                peer_dict = overlay.get_peer_dict()

                for p_item in peer_dict.values():
                    peer: Peer = p_item
                    update_time = datetime.strptime(str(peer.update_time), self.fmt)
                    now_time = datetime.strptime(str(datetime.now()), self.fmt)
                    delta_time = now_time - update_time
                    if delta_time.seconds > peer.expires:
                        delete_peer_list.append((overlay.overlay_id, peer.peer_id))

            if len(delete_peer_list) > 0:
                for overlay_id, peer_id in delete_peer_list:
                    self.delete_peer_and_empty_overlay(overlay_id, peer_id)

        except Exception as err_check_peer:
            self.print_log(err_check_peer)

    def print_log(self, message):
        if self._show_log:
            print('[ServerScheduler] {0}'.format(message))

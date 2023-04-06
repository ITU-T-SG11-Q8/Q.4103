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

import pymysql
import json
from datetime import datetime

from config import DATABASE_CONFIG
from classes.overlay import Overlay
from classes.peer import Peer
from data.factory import Factory
import database.db_query as query


class DBManager:
    def __init__(self):
        self.database_name = DATABASE_CONFIG['DB_DATABASE']
        self.connect = pymysql.connect(host=DATABASE_CONFIG['DB_HOST'], port=DATABASE_CONFIG['DB_PORT'],
                                       user=DATABASE_CONFIG['DB_USER'], password=DATABASE_CONFIG['DB_PASS'],
                                       charset='utf8', cursorclass=pymysql.cursors.DictCursor)
        self.cursor = self.connect.cursor()
        self._show_log = True

    def __del__(self):
        self.connect.close()

    # DB Check & Create
    def initialize(self):
        try:
            self.cursor.execute(query.SHOW_DATABASES, (self.database_name,))
            database = self.cursor.fetchone()
            if database is None:
                self.cursor.execute(query.CREATE_DATABASE.format(self.database_name))
                self.print_log('[DBManager] CREATE DATABASE {0}'.format(self.database_name))

            self.cursor.execute(query.USE_DATABASES.format(self.database_name))
            self.cursor.execute(query.SHOW_HP2P_OVERLAY)
            hp2p_overlay = self.cursor.fetchone()
            if hp2p_overlay is None:
                self.cursor.execute(query.CREATE_HP2P_OVERLAY)
                self.print_log('[DBManager] CREATE TABLE hp2p_overlay')

            self.cursor.execute(query.SHOW_HP2P_PEER)
            hp2p_peer = self.cursor.fetchone()
            if hp2p_peer is None:
                self.cursor.execute(query.CREATE_HP2P_PEER)
                self.print_log('[DBManager] CREATE TABLE hp2p_peer')

            self.cursor.execute(query.SHOW_HP2P_AUTH_PEER)
            hp2p_auth_peer = self.cursor.fetchone()
            if hp2p_auth_peer is None:
                self.cursor.execute(query.CREATE_HP2P_AUTH_PEER)
                self.print_log('[DBManager] CREATE TABLE hp2p_auth_peer')

            self.connect.commit()
        except Exception as err_init:
            self.connect.rollback()
            self.print_log(err_init)
            return False

        return True

    # DB Data Clear
    def clear_database(self):
        self.print_log('[DBManager] CLEAR_DATABASE')
        try:
            self.cursor.execute(query.DELETE_ALL_HP2P_AUTH_PEER)
            self.cursor.execute(query.DELETE_ALL_HP2P_PEER)
            self.cursor.execute(query.DELETE_ALL_HP2P_OVERLAY)
            self.connect.commit()
        except Exception as err_clear:
            self.connect.rollback()
            self.print_log(err_clear)

    # DB Select & Create Overlay Map
    def create_overlay_map(self):
        self.print_log('CREATE_OVERLAY_MAP')
        self.cursor.execute(query.SELECT_HP2P_OVERLAY)
        select_overlay_list = self.cursor.fetchall()

        for select_overlay in select_overlay_list:
            overlay_id = select_overlay.get('overlay_id')
            overlay = Overlay()
            overlay.overlay_id = overlay_id
            #overlay.expires = select_overlay.get('expires')
            overlay.heartbeat_interval = select_overlay.get('heartbeat_interval')
            overlay.heartbeat_timeout = select_overlay.get('heartbeat_timeout')

            self.cursor.execute(query.SELECT_HP2P_PEER_BY_OVERLAY_ID, (overlay_id,))
            select_peer_list = self.cursor.fetchall()

            max_ticket_id = 0
            for select_peer in select_peer_list:
                ticket_id = select_peer.get('ticket_id')
                peer_id = select_peer.get('peer_id')
                instance_id = select_peer.get('instance_id')
                max_ticket_id = max(max_ticket_id, ticket_id)
                peer = Peer()
                peer.overlay_id = overlay_id
                peer.expires = select_peer.get('expires')
                peer.peer_id = peer_id
                peer.instance_id = instance_id
                peer.ticket_id = ticket_id
                peer.update_time = datetime.now()
                if select_peer.get('costmap') is not None:
                    peer.costmap = json.loads(select_peer.get('costmap'))
                overlay.add_peer(peer_id, instance_id, peer)

            overlay.set_current_ticket_id(max_ticket_id)
            Factory.get().add_overlay(overlay_id, overlay)

    def print_log(self, message):
        if self._show_log:
            print('[DBManager] {0}'.format(message))

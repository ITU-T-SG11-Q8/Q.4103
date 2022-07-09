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
import math
from datetime import datetime
from flask import request
from flask_restful import Resource

from config import HOMS_CONFIG, LOG_CONFIG
from classes.overlay import Overlay
from classes.peer import Peer
from data.factory import Factory
from database.db_connector import DBConnector
import database.db_query as query
from handler.message import HompOverlayPeer


class HybridPeer(Resource):
    def post(self):
        if LOG_CONFIG['PRINT_PROTOCOL_LOG']:
            print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))
        db_connector = DBConnector()
        try:
            request_json = request.get_json()
            overlay_peer = HompOverlayPeer(request_json)
            if not overlay_peer.is_valid(HompOverlayPeer.JOIN):
                raise ValueError
            if overlay_peer.expires is None:
                overlay_peer.expires = HOMS_CONFIG['PEER_EXPIRES']

            select_overlay = db_connector.select_one(query.SELECT_HP2P_OVERLAY_BY_OVERLAY_ID,
                                                     (overlay_peer.overlay_id,))
            if select_overlay is None:
                raise ValueError
            overlay_peer.set_overlay_data(select_overlay)

            if select_overlay.get('auth_type') == 'closed':
                select_auth_peer = db_connector.select_one(query.SELECT_AUTH_PEER_ID,
                                                           (overlay_peer.overlay_id, overlay_peer.peer.peer_id))
                is_auth_peer = select_auth_peer is not None or select_overlay.get(
                    'auth_access_key') == overlay_peer.auth.access_key
                if not is_auth_peer:
                    return overlay_peer.to_json(HompOverlayPeer.BASE), 407

            current_overlay: Overlay = Factory.get().get_overlay(overlay_peer.overlay_id)
            if current_overlay is None:
                raise ValueError

            peer_list_count = HOMS_CONFIG['PEER_INFO_LIST_COUNT'] if 'PEER_INFO_LIST_COUNT' in HOMS_CONFIG else 3
            activation_peer_count = current_overlay.activation_peer_count()

            if overlay_peer.recovery:
                select_peer = db_connector.select_one(query.SELECT_HP2P_PEER_PASSWORD, (
                    overlay_peer.peer.peer_id, overlay_peer.overlay_id, overlay_peer.peer.auth.password))
                if select_peer is None:
                    raise ValueError
                if overlay_peer.ticket_id is None or current_overlay.has_peer(overlay_peer.peer.peer_id) is None:
                    raise ValueError
                pos = HOMS_CONFIG['RECOVERY_ENTRY_POINT_POS'] if 'RECOVERY_ENTRY_POINT_POS' in HOMS_CONFIG else 20
                rank_pos = max(math.floor(activation_peer_count * (pos / 100)), 1)
                peer_info_list = db_connector.select(query.SELECT_RECOVERY_PEER_LIST, (
                    overlay_peer.overlay_id, rank_pos, overlay_peer.ticket_id, peer_list_count))
            else:
                pos_dict = HOMS_CONFIG['INITIAL_ENTRY_POINT_POS']
                find_key = 0
                for pos_key in sorted(pos_dict.keys()):
                    if find_key == 0:
                        find_key = pos_key

                    if activation_peer_count >= pos_key:
                        find_key = pos_key
                    else:
                        break

                peer_info_list = db_connector.select(query.SELECT_PEER_LIST,
                                                     (overlay_peer.overlay_id,
                                                      math.floor(activation_peer_count * (pos_dict[find_key] / 100)),
                                                      peer_list_count))

                overlay_peer.ticket_id = current_overlay.get_current_ticket_id()
                db_connector.insert(query.INSERT_HP2P_PEER,
                                    (overlay_peer.peer.peer_id, overlay_peer.overlay_id, overlay_peer.ticket_id,
                                     overlay_peer.type, overlay_peer.sub_type, overlay_peer.expires,
                                     overlay_peer.peer.address, overlay_peer.peer.auth.password))
                new_peer = Peer()
                new_peer.overlay_id = overlay_peer.overlay_id
                new_peer.expires = overlay_peer.expires
                new_peer.peer_id = overlay_peer.peer.peer_id
                new_peer.ticket_id = overlay_peer.ticket_id
                new_peer.update_time = datetime.now()
                current_overlay.add_peer(new_peer.peer_id, new_peer)

            if len(peer_info_list) < 1:
                peer_info_list = db_connector.select(query.SELECT_TOP_PEER, (overlay_peer.overlay_id,))

            status_peer_info_list = []
            for peer_info in peer_info_list:
                status_peer_info_list.append({'peer-id': peer_info.get('peer_id'), 'address': peer_info.get('address')})

            #  app_data 사용 안함.
            # if overlay_peer.has_app_data:
            #     print(overlay_peer.app_data)

            if not overlay_peer.recovery:
                Factory.get().get_web_socket_manager().send_add_peer_message(overlay_peer.overlay_id,
                                                                             overlay_peer.peer.peer_id,
                                                                             overlay_peer.ticket_id)
                Factory.get().get_web_socket_manager().send_log_message(overlay_peer.overlay_id,
                                                                        overlay_peer.peer.peer_id, 'Overlay Join.')
            else:
                Factory.get().get_web_socket_manager().send_log_message(overlay_peer.overlay_id,
                                                                        overlay_peer.peer.peer_id, 'Overlay Recovery.')

            db_connector.commit()
            return overlay_peer.to_json(HompOverlayPeer.JOIN, status_peer_info_list), overlay_peer.status_code
        except ValueError:
            db_connector.rollback()
            return 'BAD REQUEST', 400
        except Exception as exception:
            db_connector.rollback()
            return str(exception), 500

    def put(self):
        if LOG_CONFIG['PRINT_PROTOCOL_LOG']:
            print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))
        db_connector = DBConnector()
        try:
            request_json = request.get_json()
            overlay_peer = HompOverlayPeer(request_json)
            if not overlay_peer.is_valid(HompOverlayPeer.REFRESH):
                raise ValueError

            select_peer = db_connector.select_one(query.SELECT_HP2P_PEER_PASSWORD,
                                                  (overlay_peer.peer.peer_id, overlay_peer.overlay_id,
                                                   overlay_peer.peer.auth.password))
            if select_peer is None:
                raise ValueError

            current_overlay: Overlay = Factory.get().get_overlay(overlay_peer.overlay_id)
            if current_overlay is None:
                raise ValueError
            current_peer: Peer = current_overlay.get_peer(overlay_peer.peer.peer_id)
            if current_peer is None:
                raise ValueError
            current_peer.update_time = datetime.now()
            if overlay_peer.expires is None:
                overlay_peer.expires = select_peer.get('expires')

            select_overlay = db_connector.select_one(query.SELECT_HP2P_OVERLAY_BY_OVERLAY_ID,
                                                     (overlay_peer.overlay_id,))
            if select_overlay is None:
                raise ValueError
            if select_overlay.get('auth_type') == 'closed':
                select_auth_peer = db_connector.select_one(query.SELECT_AUTH_PEER_ID,
                                                           (overlay_peer.overlay_id, overlay_peer.peer.peer_id))
                is_auth_peer = select_auth_peer is not None or select_overlay.get(
                    'auth_access_key') == overlay_peer.auth.access_key
                if not is_auth_peer:
                    return overlay_peer.to_json(HompOverlayPeer.BASE), 407

            db_connector.update(query.UPDATE_HP2P_PEER,
                                (overlay_peer.expires, overlay_peer.overlay_id, overlay_peer.peer.peer_id))

            # app_data 사용안함.
            # if overlay_peer.has_app_data:
            #     print(overlay_peer.app_data)

            db_connector.commit()
            return overlay_peer.to_json(HompOverlayPeer.REFRESH), 200
        except ValueError:
            db_connector.rollback()
            return 'BAD REQUEST', 400
        except Exception as exception:
            db_connector.rollback()
            return str(exception), 500

    def delete(self):
        if LOG_CONFIG['PRINT_PROTOCOL_LOG']:
            print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))
        db_connector = DBConnector()
        try:
            request_json = request.get_json()
            print(request_json)
            overlay_peer = HompOverlayPeer(request_json)

            if not overlay_peer.is_valid(HompOverlayPeer.LEAVE):
                raise ValueError

            select_overlay = db_connector.select_one(query.SELECT_HP2P_OVERLAY_BY_OVERLAY_ID,
                                                     (overlay_peer.overlay_id,))
            if select_overlay is None:
                raise ValueError
            select_peer = db_connector.select_one(query.SELECT_HP2P_PEER_PASSWORD,
                                                  (overlay_peer.peer.peer_id, overlay_peer.overlay_id,
                                                   overlay_peer.peer.auth.password))
            if select_peer is None:
                raise ValueError

            db_connector.delete(query.DELETE_HP2P_PEER, (overlay_peer.peer.peer_id, overlay_peer.overlay_id))

            current_overlay: Overlay = Factory.get().get_overlay(overlay_peer.overlay_id)
            if current_overlay is None:
                raise ValueError
            current_peer: Peer = current_overlay.get_peer(overlay_peer.peer.peer_id)
            if current_peer is None:
                raise ValueError

            current_overlay.delete_peer(overlay_peer.peer.peer_id)
            Factory.get().get_web_socket_manager().send_log_message(overlay_peer.overlay_id, overlay_peer.peer.peer_id,
                                                                    'Overlay Leave.')

            if current_overlay.is_empty_overlay():
                db_connector.delete_hp2p_data(overlay_peer.overlay_id)

                Factory.get().delete_overlay(overlay_peer.overlay_id)
                Factory.get().get_web_socket_manager().send_remove_overlay_message(overlay_peer.overlay_id)
                Factory.get().get_web_socket_manager().send_log_message(overlay_peer.overlay_id,
                                                                        overlay_peer.peer.peer_id, 'Overlay Removal.')
            else:
                Factory.get().get_web_socket_manager().send_delete_peer_message(overlay_peer.overlay_id,
                                                                                overlay_peer.peer.peer_id)

            db_connector.commit()
            return overlay_peer.to_json(HompOverlayPeer.BASE), 200
        except ValueError:
            db_connector.rollback()
            return 'BAD REQUEST', 400
        except Exception as exception:
            db_connector.rollback()
            return str(exception), 500


class HybridPeerReport(Resource):
    def post(self):
        if LOG_CONFIG['PRINT_PROTOCOL_LOG']:
            print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))
        db_connector = DBConnector()
        try:
            request_json = request.get_json()
            overlay_peer = HompOverlayPeer(request_json)

            if not overlay_peer.is_valid(HompOverlayPeer.REPORT):
                raise ValueError

            select_overlay = db_connector.select_one(query.SELECT_HP2P_OVERLAY_BY_OVERLAY_ID,
                                                     (overlay_peer.overlay_id,))
            if select_overlay is None:
                raise ValueError

            select_peer = db_connector.select_one(query.SELECT_HP2P_PEER_PASSWORD,
                                                  (overlay_peer.peer.peer_id, overlay_peer.overlay_id,
                                                   overlay_peer.peer.auth.password))
            if select_peer is None:
                raise ValueError

            current_overlay: Overlay = Factory.get().get_overlay(overlay_peer.overlay_id)
            if current_overlay is None:
                raise ValueError

            current_peer: Peer = current_overlay.get_peer(overlay_peer.peer.peer_id)
            if current_peer is None:
                raise ValueError

            if current_peer.costmap != overlay_peer.status.costmap:
                current_peer.num_primary = overlay_peer.status.num_primary
                current_peer.num_in_candidate = overlay_peer.status.num_in_candidate
                current_peer.num_out_candidate = overlay_peer.status.num_out_candidate
                current_peer.costmap = overlay_peer.status.costmap
                current_peer.update_time = datetime.now()

                Factory.get().get_web_socket_manager().send_update_peer_message(overlay_peer.overlay_id,
                                                                                overlay_peer.status.costmap)

                parameters = (overlay_peer.status.num_primary, overlay_peer.status.num_out_candidate,
                              overlay_peer.status.num_in_candidate, json.dumps(overlay_peer.status.costmap),
                              overlay_peer.overlay_id, overlay_peer.peer.peer_id)
                db_connector.update(query.UPDATE_HP2P_PEER_COST_MAP, parameters)

            Factory.get().get_web_socket_manager().send_log_message(overlay_peer.overlay_id, overlay_peer.peer.peer_id,
                                                                    'Overlay Report. ' + json.dumps(
                                                                        overlay_peer.status.costmap))

            db_connector.commit()
            return overlay_peer.to_json(HompOverlayPeer.BASE), 200
        except ValueError:
            db_connector.rollback()
            return 'BAD REQUEST', 400
        except Exception as exception:
            db_connector.rollback()
            return str(exception), 500

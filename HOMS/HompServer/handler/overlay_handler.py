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

from datetime import datetime
from flask import request
from flask_restful import Resource

from config import WEB_SOCKET_CONFIG, LOG_CONFIG
from classes.overlay import Overlay
from handler.message import HompOverlay, HompOverlayOwnership
from data.factory import Factory
from database.db_connector import DBConnector
import database.db_query as query


class HybridOverlay(Resource):
    def post(self):
        if LOG_CONFIG['PRINT_PROTOCOL_LOG']:
            print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))

        db_connector = DBConnector()
        try:
            request_data = request.get_json()
            print(request_data)
            request_overlay = HompOverlay(request_data.get('overlay'))

            if not request_overlay.is_valid(HompOverlay.CREATION):
                raise ValueError

            overlay_parameters = (
                request_overlay.overlay_id, request_overlay.title, request_overlay.type, request_overlay.sub_type,
                request_overlay.owner_id, request_overlay.expires, request_overlay.status, request_overlay.description,
                request_overlay.heartbeat_interval, request_overlay.heartbeat_timeout, request_overlay.auth.keyword,
                request_overlay.auth.type, request_overlay.auth.admin_key, request_overlay.auth.access_key,
                request_overlay.app_id, request_overlay.cr_policy.mN_Cache, request_overlay.cr_policy.mD_Cache,
                request_overlay.cr_policy.recovery_by)
            db_connector.insert(query.INSERT_HP2P_OVERLAY, overlay_parameters)

            if request_overlay.auth.has_peer_list:
                auth_peer_parameters = []
                for peer_id in request_overlay.auth.peer_list:
                    auth_peer_parameters.append((request_overlay.overlay_id, peer_id))
                db_connector.insert_all(query.INSERT_HP2P_AUTH_PEER, auth_peer_parameters)

            overlay = Overlay()
            overlay.overlay_id = request_overlay.overlay_id
            overlay.expires = request_overlay.expires
            overlay.heartbeat_interval = request_overlay.heartbeat_interval
            overlay.heartbeat_timeout = request_overlay.heartbeat_timeout

            if request_overlay.expires > 0:
                overlay.update_time = datetime.now()

            Factory.get().add_overlay(overlay.overlay_id, overlay)
            Factory.get().get_web_socket_manager().send_create_overlay_message(request_overlay.overlay_id)
            Factory.get().get_web_socket_manager().send_log_message(request_overlay.overlay_id,
                                                                    request_overlay.owner_id,
                                                                    'Overlay Creation.')

            db_connector.commit()
            return request_overlay.to_json(HompOverlay.CREATION), 200
        except ValueError:
            db_connector.rollback()
            return 'BAD REQUEST', 400
        except Exception as exception:
            db_connector.rollback()
            return str(exception), 500

    def get(self):
        if LOG_CONFIG['PRINT_PROTOCOL_LOG']:
            print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))
        db_connector = DBConnector()
        try:
            result = []
            app_data_mode = 'app-id' in request.args and 'peer-id' in request.args

            if app_data_mode:
                print('TBD... app-id, peer-id, profile-id')

            where = ''
            parameters = None

            if len(request.args) > 0:
                if 'overlay-id' in request.args:
                    where = query.WHERE_OVERLAY_ID
                    parameters = request.args.get('overlay-id')
                elif 'title' in request.args:
                    where = query.WHERE_TITLE
                    parameters = ('%%%s%%' % request.args.get('title'))
                elif 'description' in request.args:
                    where = query.WHERE_DESCRIPTION
                    parameters = ('%%%s%%' % request.args.get('description'))

            select_overlay_list = db_connector.select(query.SELECT_HP2P_OVERLAY + where + query.ORDER_BY_CREATED_AT,
                                                      (parameters,) if parameters is not None else None)

            if len(select_overlay_list) > 0:
                for select_overlay in select_overlay_list:
                    overlay_id = select_overlay.get('overlay_id')

                    select_num_peers = db_connector.select_one(query.SELECT_NUM_PEERS, (overlay_id,))
                    num_peers = select_num_peers.get('num_peers') if select_num_peers is not None else 0

                    overlay = {
                        'overlay-id': overlay_id,
                        'title': select_overlay.get('title'),
                        'type': select_overlay.get('overlay_type'),
                        'sub-type': select_overlay.get('sub_type'),
                        'owner-id': select_overlay.get('owner_id'),
                        'expires': select_overlay.get('expires'),
                        'status': {
                            'num_peers': num_peers,
                            'status': select_overlay.get('overlay_status')
                        },
                        'description': select_overlay.get('description'),
                        'auth': {
                            'type': select_overlay.get('auth_type')
                        }
                    }

                    if select_overlay.get('app_id') is not None:
                        overlay['app-id'] = select_overlay.get('app_id')

                    if select_overlay.get('recovery_by') is not None:
                        overlay['cr-policy'] = {
                            'mN_Cache': select_overlay.get('mn_cache'),
                            'mD_Cache': select_overlay.get('md_cache'),
                            'recovery-by': select_overlay.get('recovery_by')
                        }

                    result.append({'overlay': overlay})

            return result, 200
        except Exception as exception:
            db_connector.rollback()
            return str(exception), 500

    def put(self):
        if LOG_CONFIG['PRINT_PROTOCOL_LOG']:
            print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))
        db_connector = DBConnector()
        try:
            request_data = request.get_json()
            request_overlay = HompOverlay(request_data.get('overlay'))

            if not request_overlay.is_valid(HompOverlay.BASE):
                raise ValueError

            select_overlay = db_connector.select_one(query.SELECT_HP2P_OVERLAY_BY_ADMIN_KEY, (
                request_overlay.overlay_id, request_overlay.owner_id, request_overlay.auth.admin_key))

            if select_overlay is None:
                raise ValueError

            ownership = request_data.get('ownership')
            request_ownership = None

            if ownership is not None:
                request_ownership = HompOverlayOwnership(ownership)
                if not request_ownership.is_valid():
                    raise ValueError            

            set_query = ''
            parameters = []
            if request_overlay.title is not None:
                set_query += query.SET_TITLE
                parameters.append(request_overlay.title)
            if request_overlay.expires is not None:
                set_query += query.SET_EXPIRES
                parameters.append(request_overlay.expires)
            if request_overlay.description is not None:
                set_query += query.SET_DESCRIPTION
                parameters.append(request_overlay.description)
            if request_ownership is not None:
                if request_ownership.owner_id is not None:
                    set_query += query.SET_OWNER_ID
                    parameters.append(request_ownership.owner_id)
                    request_overlay.owner_id = request_ownership.owner_id
                if request_ownership.admin_key is not None:
                    set_query += query.SET_ADMIN_KEY
                    parameters.append(request_ownership.admin_key)
                    request_overlay.auth.admin_key = request_ownership.admin_key

            parameters.append(request_overlay.overlay_id)
            update_query = query.UPDATE_HP2P_OVERLAY + set_query + query.WHERE_OVERLAY_ID
            db_connector.update(update_query, parameters)

            if request_overlay.is_valid(HompOverlay.AUTH):
                db_connector.delete(query.DELETE_HP2P_AUTH_PEER_BY_OVERLAY_ID, (request_overlay.overlay_id,))
                db_connector.update(query.UPDATE_HP2P_OVERLAY_SET_ACCESS_KEY,
                                    (request_overlay.auth.access_key, request_overlay.overlay_id))

                if request_overlay.auth.access_key is None:
                    auth_peer_list_parameters = []
                    for peer_id in request_overlay.auth.peer_list:
                        auth_peer_list_parameters.append((request_overlay.overlay_id, peer_id))

                    db_connector.insert_all(query.INSERT_HP2P_AUTH_PEER, auth_peer_list_parameters)

            overlay: Overlay = Factory.get().get_overlay(request_overlay.overlay_id)
            if request_overlay.expires is not None:
                overlay.expires = request_overlay.expires

            if overlay.expires > 0:
                overlay.update_time = datetime.now()

            Factory.get().get_web_socket_manager().send_log_message(request_overlay.overlay_id,
                                                                    request_overlay.owner_id, 'Overlay Modification.')
            db_connector.commit()
            return request_overlay.to_json(HompOverlay.MODIFICATION), 200
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
            request_data = request.get_json()
            request_overlay = HompOverlay(request_data.get('overlay'))

            if not request_overlay.is_valid(HompOverlay.BASE):
                raise ValueError

            select_overlay = db_connector.select_one(query.SELECT_HP2P_OVERLAY_BY_ADMIN_KEY, (
                request_overlay.overlay_id, request_overlay.owner_id, request_overlay.auth.admin_key))

            if select_overlay is None:
                raise ValueError

            db_connector.delete_hp2p_data(request_overlay.overlay_id)

            Factory.get().delete_overlay(request_overlay.overlay_id)
            Factory.get().get_web_socket_manager().send_remove_overlay_message(request_overlay.overlay_id)
            Factory.get().get_web_socket_manager().send_log_message(request_overlay.overlay_id,
                                                                    request_overlay.owner_id, 'Overlay Removal.')

            db_connector.commit()
            return request_overlay.to_json(HompOverlay.REMOVAL), 200
        except ValueError:
            db_connector.rollback()
            return 'BAD REQUEST', 400
        except Exception as exception:
            db_connector.rollback()
            return str(exception), 500


class ApiHybridOverlayRemoval(Resource):
    def post(self):
        print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))
        db_connector = DBConnector()
        try:
            request_data = request.get_json()
            overlay_id = request_data.get('overlay-id')

            if overlay_id is None:
                raise ValueError

            select_overlay = db_connector.select_one(query.SELECT_HP2P_OVERLAY_BY_OVERLAY_ID, (overlay_id,))
            if select_overlay is None:
                raise ValueError

            db_connector.delete_hp2p_data(overlay_id)

            Factory.get().delete_overlay(overlay_id)
            Factory.get().get_web_socket_manager().send_remove_overlay_message(overlay_id)
            Factory.get().get_web_socket_manager().send_log_message(overlay_id, 'Administrator', 'Overlay Removal.')

            db_connector.commit()
            return {'overlay-id': overlay_id}, 200
        except ValueError:
            db_connector.rollback()
            return 'BAD REQUEST', 400
        except Exception as exception:
            db_connector.rollback()
            return str(exception), 500


class GetInitData(Resource):
    def get(self):
        print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))
        return {'WEB_SOCKET_PORT': WEB_SOCKET_CONFIG['PORT']}, 200


class GetOverlayCostMap(Resource):
    def get(self):
        print('[SERVER] {0} / {1}'.format(self.methods, self.endpoint))
        if len(request.args) > 0 and 'overlay_id' in request.args:
            overlay = Factory.get().get_overlay(request.args.get('overlay_id'))
            message = Factory.get().get_web_socket_manager().create_overlay_cost_map_message(overlay)
            return message, 200
        else:
            return None, 404

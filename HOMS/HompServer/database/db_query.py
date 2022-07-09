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

SHOW_DATABASES = "SHOW DATABASES LIKE %s"

CREATE_DATABASE = "CREATE DATABASE IF NOT EXISTS {0}"

USE_DATABASES = "USE {0}"

SHOW_HP2P_OVERLAY = "SHOW TABLES LIKE 'hp2p_overlay'"

CREATE_HP2P_OVERLAY = "CREATE TABLE IF NOT EXISTS hp2p_overlay ( " \
                      "overlay_id varchar(50) COLLATE utf8_unicode_ci NOT NULL, " \
                      "title varchar(100) COLLATE utf8_unicode_ci NOT NULL, " \
                      "overlay_type varchar(50) COLLATE utf8_unicode_ci NOT NULL, " \
                      "sub_type varchar(50) COLLATE utf8_unicode_ci NOT NULL, " \
                      "owner_id varchar(50) COLLATE utf8_unicode_ci NOT NULL, " \
                      "expires int(11) NOT NULL DEFAULT 0, " \
                      "overlay_status varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                      "description varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                      "heartbeat_interval int(11) NOT NULL DEFAULT 0,  " \
                      "heartbeat_timeout int(11) NOT NULL DEFAULT 0, " \
                      "auth_keyword varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                      "auth_type varchar(50) COLLATE utf8_unicode_ci NOT NULL,  " \
                      "auth_admin_key varchar(50) COLLATE utf8_unicode_ci NOT NULL,  " \
                      "auth_access_key varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                      "app_id varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                      "mn_cache INT(11) NULL DEFAULT NULL, " \
                      "md_cache INT(11) NULL DEFAULT NULL, " \
                      "recovery_by VARCHAR(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                      "rate_control_quantity INT(11) DEFAULT NULL, " \
                      "rate_control_bitrate INT(11) DEFAULT NULL, " \
                      "transmission_control VARCHAR(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                      "trans_policy_auth_list VARCHAR(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                      "created_at datetime NOT NULL, " \
                      "updated_at datetime NOT NULL,  " \
                      " PRIMARY KEY (`overlay_id`))"

SHOW_HP2P_PEER = "SHOW TABLES LIKE 'hp2p_peer'"

CREATE_HP2P_PEER = "CREATE TABLE IF NOT EXISTS hp2p_peer ( " \
                   "peer_id varchar(50) COLLATE utf8_unicode_ci NOT NULL, " \
                   "overlay_id varchar(50) COLLATE utf8_unicode_ci NOT NULL,  " \
                   "ticket_id int(11) DEFAULT NULL,  " \
                   "overlay_type varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                   "sub_type varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                   "expires int(11) DEFAULT NULL,  " \
                   "address varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL, " \
                   "auth_password varchar(50) COLLATE utf8_unicode_ci NOT NULL,  " \
                   "num_primary int(11) NOT NULL DEFAULT 0,  " \
                   "num_out_candidate int(11) NOT NULL DEFAULT 0, " \
                   "num_in_candidate int(11) NOT NULL DEFAULT 0, " \
                   "costmap longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,  " \
                   "created_at datetime DEFAULT NULL, " \
                   "updated_at datetime DEFAULT NULL, " \
                   "report_time datetime DEFAULT NULL, " \
                   " PRIMARY KEY (peer_id, overlay_id))"

SHOW_HP2P_AUTH_PEER = "SHOW TABLES LIKE 'hp2p_auth_peer'"

CREATE_HP2P_AUTH_PEER = "CREATE TABLE IF NOT EXISTS hp2p_auth_peer ( " \
                        "overlay_id varchar(50) COLLATE utf8_unicode_ci NOT NULL, " \
                        "peer_id varchar(50) COLLATE utf8_unicode_ci NOT NULL, " \
                        "updated_at datetime DEFAULT NULL, " \
                        "PRIMARY KEY (overlay_id, peer_id))"

SHOW_HP2P_OVERLAY_TRANS_POLICY_AUTH_PEER = "SHOW TABLES LIKE 'hp2p_overlay_trans_policy_auth_peer'"

CREATE_HP2P_OVERLAY_TRANS_POLICY_AUTH_PEER = "CREATE TABLE IF NOT EXISTS hp2p_overlay_trans_policy_auth_peer ( " \
                                             "overlay_id varchar(50) COLLATE utf8_unicode_ci NOT NULL, " \
                                             "peer_id varchar(50) COLLATE utf8_unicode_ci NOT NULL, " \
                                             "updated_at datetime DEFAULT NULL, " \
                                             "PRIMARY KEY (overlay_id, peer_id))"

DELETE_ALL_HP2P_AUTH_PEER = "DELETE FROM hp2p_auth_peer"

DELETE_ALL_HP2P_PEER = "DELETE FROM hp2p_peer"

DELETE_ALL_HP2P_OVERLAY = "DELETE FROM hp2p_overlay"

SELECT_HP2P_OVERLAY = "SELECT * FROM hp2p_overlay"
# SELECT_HP2P_OVERLAY = "SELECT " \
#                       "overlay_id, title, overlay_type, sub_type, owner_id, expires, overlay_status, auth_type " \
#                       "FROM hp2p_overlay"

SELECT_HP2P_OVERLAY_BY_OVERLAY_ID = "SELECT * FROM hp2p_overlay WHERE overlay_id = %s"

SELECT_HP2P_PEER_BY_OVERLAY_ID = "SELECT * FROM hp2p_peer WHERE overlay_id = %s ORDER BY ticket_id"

DELETE_HP2P_PEER = "DELETE FROM hp2p_peer WHERE peer_id = %s AND overlay_id = %s"

DELETE_HP2P_PEER_BY_OVERLAY_ID = "DELETE FROM hp2p_peer WHERE overlay_id = %s"

DELETE_HP2P_OVERLAY_BY_OVERLAY_ID = "DELETE FROM hp2p_overlay WHERE overlay_id = %s"

DELETE_HP2P_AUTH_PEER_BY_OVERLAY_ID = "DELETE FROM hp2p_auth_peer WHERE overlay_id = %s"

DELETE_HP2P_OVERLAY_TRANS_POLICY_AUTH_PEER_BY_OVERLAY_ID = "DELETE FROM hp2p_overlay_trans_policy_auth_peer " \
                                                           "WHERE overlay_id = %s"

INSERT_HP2P_OVERLAY = "INSERT INTO hp2p_overlay " \
                      "(overlay_id, title, overlay_type, sub_type, owner_id, expires, overlay_status," \
                      "description, heartbeat_interval, heartbeat_timeout, auth_keyword, auth_type, " \
                      "auth_admin_key, auth_access_key, app_id, mn_cache, md_cache, recovery_by," \
                      " rate_control_quantity, rate_control_bitrate, transmission_control, created_at, updated_at) " \
                      "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, " \
                      "NOW(), NOW())"

INSERT_HP2P_AUTH_PEER = "INSERT INTO hp2p_auth_peer (overlay_id, peer_id, updated_at) VALUES (%s, %s, now())"

INSERT_HP2P_OVERLAY_TRANS_POLICY_AUTH_PEER = "INSERT INTO hp2p_overlay_trans_policy_auth_peer " \
                                             "(overlay_id, peer_id, updated_at) VALUES (%s, %s, now())"

ORDER_BY_CREATED_AT = " ORDER BY created_at"

WHERE_OVERLAY_ID = " WHERE overlay_id = %s"

WHERE_TITLE = " WHERE title LIKE %s"

WHERE_DESCRIPTION = " WHERE description LIKE %s"

SELECT_NUM_PEERS = "SELECT COUNT(*) AS num_peers FROM hp2p_peer WHERE overlay_id = %s"

SELECT_HP2P_OVERLAY_BY_ADMIN_KEY = "SELECT overlay_id, auth_access_key FROM hp2p_overlay " \
                                   "WHERE overlay_id = %s AND owner_id = %s AND auth_admin_key = %s"

UPDATE_HP2P_OVERLAY = "UPDATE hp2p_overlay SET updated_at = now()"

SET_TITLE = ", title = %s"

SET_EXPIRES = ", expires = %s"

SET_DESCRIPTION = ", description = %s"

UPDATE_HP2P_OVERLAY_SET_ACCESS_KEY = "UPDATE hp2p_overlay SET auth_access_key = %s WHERE overlay_id = %s"

SELECT_AUTH_PEER_ID_LIST = "SELECT peer_id FROM hp2p_auth_peer WHERE overlay_id = %s"

SELECT_OVERLAY_ACCESS_KEY = "SELECT auth_access_key FROM hp2p_overlay WHERE overlay_id = %s"

SELECT_AUTH_PEER_ID = "SELECT peer_id FROM hp2p_auth_peer WHERE overlay_id = %s AND peer_id = %s"

SELECT_HP2P_PEER_PASSWORD = "SELECT * FROM hp2p_peer WHERE peer_id = %s AND overlay_id = %s AND auth_password = %s"

SELECT_RECOVERY_PEER_LIST = "SELECT v_p_t.peer_id, v_p_t.address FROM " \
                            " (SELECT p_t.*,@rownum := @rownum + 1 AS rank1 FROM " \
                            " (SELECT * FROM hp2p_peer WHERE " \
                            " overlay_id = %s AND num_primary > 0) p_t," \
                            " (SELECT @rownum := 0) r " \
                            " ORDER BY p_t.ticket_id) v_p_t " \
                            "WHERE v_p_t.rank1 <= %s AND v_p_t.ticket_id < %s " \
                            "ORDER BY v_p_t.rank1 DESC LIMIT %s"

SELECT_PEER_LIST = "SELECT v_p_t.peer_id, v_p_t.address FROM " \
                   " (SELECT p_t.*,@rownum := @rownum + 1 AS rank1 FROM " \
                   " (SELECT * FROM hp2p_peer WHERE " \
                   " overlay_id = %s AND num_primary > 0) p_t," \
                   " (SELECT @rownum := 0) r " \
                   " ORDER BY p_t.ticket_id) v_p_t " \
                   "WHERE v_p_t.rank1 >= %s LIMIT %s"

INSERT_HP2P_PEER = "INSERT INTO hp2p_peer " \
                   "(peer_id, overlay_id, ticket_id ,overlay_type, sub_type, expires, address, " \
                   "auth_password, created_at, updated_at) " \
                   "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())"

SELECT_TOP_PEER = "SELECT peer_id, address FROM hp2p_peer WHERE overlay_id = %s ORDER BY ticket_id LIMIT 1"

UPDATE_HP2P_PEER = "UPDATE hp2p_peer SET updated_at = NOW(), expires = %s WHERE overlay_id = %s AND peer_id = %s"

SELECT_HP2P_PEER = "SELECT * FROM hp2p_peer WHERE overlay_id = %s AND peer_id = %s"

UPDATE_HP2P_PEER_COST_MAP = "UPDATE hp2p_peer SET " \
                            "num_primary = %s, num_out_candidate = %s, " \
                            "num_in_candidate = %s, costmap = %s, report_time = NOW() " \
                            "WHERE overlay_id = %s AND peer_id = %s"

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

from config import DATABASE_CONFIG
import database.db_query as hp2p_query


class DBConnector:
    def __init__(self):
        self.connect = pymysql.connect(host=DATABASE_CONFIG['DB_HOST'], port=DATABASE_CONFIG['DB_PORT'],
                                       db=DATABASE_CONFIG['DB_DATABASE'],
                                       user=DATABASE_CONFIG['DB_USER'], password=DATABASE_CONFIG['DB_PASS'],
                                       charset='utf8', cursorclass=pymysql.cursors.DictCursor)
        self.cursor = self.connect.cursor()

    def __del__(self):
        self.connect.close()

    def close(self):
        self.connect.close()

    def commit(self):
        self.connect.commit()

    def rollback(self):
        self.connect.rollback()

    def execute(self, query, args):
        self.cursor.execute(query, args)

    def execute_many(self, query, args):
        self.cursor.executemany(query, args)

    def select_one(self, query, args=None):
        self.cursor.execute(query, args)
        return self.cursor.fetchone()

    def select(self, query, args=None):
        self.cursor.execute(query, args)
        return self.cursor.fetchall()

    def insert(self, query, args):
        self.execute(query, args)

    def insert_all(self, query, args):
        self.execute_many(query, args)

    def update(self, query, args):
        self.execute(query, args)

    def delete(self, query, args):
        self.execute(query, args)

    def delete_hp2p_data(self, overlay_id):
        self.delete(hp2p_query.DELETE_HP2P_OVERLAY_TRANS_POLICY_AUTH_PEER_BY_OVERLAY_ID, (overlay_id,))
        self.delete(hp2p_query.DELETE_HP2P_AUTH_PEER_BY_OVERLAY_ID, (overlay_id,))
        self.delete(hp2p_query.DELETE_HP2P_PEER_BY_OVERLAY_ID, (overlay_id,))
        self.delete(hp2p_query.DELETE_HP2P_OVERLAY_BY_OVERLAY_ID, (overlay_id,))

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

# ?���? ?���? ?��?��
SERVER_CONFIG = {
    'HOST': '0.0.0.0',  # ?���? IP
    'PORT': 8081,  # ?���? Port
    'DEBUG': False,
    'WEB_ROOT': 'static',
    'CLEAR_DATABASE': False,  # ?���? ?��?��?�� Database 초기?�� ?���?
    'RECOVERY_DATABASE': True,  # ?���? ?��?��?�� Database ?��?��?�� 복구 ?���?
    'USING_EXPIRES_SCHEDULER': True,  # ?���? Expires 체크 ?���?
    'EXPIRES_SCHEDULER_INTERVAL': 30  # ?���? Expires 체크 주기(�?)
}
# ?��?���? ?���? ?���? ?��?��
WEB_SOCKET_CONFIG = {
    'HOST': '0.0.0.0',  # ?��?���? ?���? IP
    'PORT': 8082  # ?��?���? ?���? Port
}
# DB ?���? ?��?��
DATABASE_CONFIG = {
    'DB_HOST': 'localhost',  # DB ?��?�� Host
    'DB_PORT': 3306,  # DB ?��?�� Port (4306, 3386)
    'DB_USER': 'prep',  # DB ?��?��?��
    'DB_PASS': 'prep',  # DB 비�??번호
    'DB_DATABASE': 'hp2p_2020'  # DB ?���?
}
# ?��로토�? ?���? ?��?��
HOMS_CONFIG = {
    'INITIAL_ENTRY_POINT_POS': {  # (?��?�� ?��) ?��버에?�� ?��공하?�� Peer 기�???��, ?��?�� N% �? ?���?
        5: 30,
        10: 40,
        20: 60,
        30: 80
    },
    'RECOVERY_ENTRY_POINT_POS': 100,  # (복구 ?��) ?��버에?�� ?��공하?�� Peer 기�???��, ?��?�� N% �? ?���?
    'PEER_INFO_LIST_COUNT': 3,  # ?��버에?�� ?��공하?�� 목록?�� Peer ?��
    'OVERLAY_EXPIRES': 0,  # Overlay Expires �?(�?)
    'PEER_EXPIRES': 3600,  # Peer Expires �?(�?)
    'DELETE_EMPTY_OVERLAY': True
}
# LOG 출력 ?���? ?��?��
LOG_CONFIG = {
    'PRINT_PROTOCOL_LOG': True,  # Protocol Log 메시�? 출력 ?���?
    'PRINT_WEB_SOCKET_LOG': True  # Web Socket Log 메시�? 출력 ?���?
}

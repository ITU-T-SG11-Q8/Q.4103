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

class SingletonInstance:
    _instance = None

    @classmethod
    def _get_instance(cls):
        return cls._instance

    @classmethod
    def get(cls, *args, **kargs):
        cls._instance = cls(*args, **kargs)
        cls.get = cls._get_instance
        return cls._instance


class Factory(SingletonInstance):
    def __init__(self):
        self._overlay_dict = {}
        self._web_socket_manager = None

    def get_overlay(self, key: str):
        return self._overlay_dict[key] if key in self._overlay_dict else None

    def add_overlay(self, key: str, item):
        self._overlay_dict[key] = item

    def delete_overlay(self, key: str):
        del self._overlay_dict[key]

    def get_overlay_dict(self):
        return self._overlay_dict

    def get_web_socket_manager(self):
        return self._web_socket_manager

    def set_web_socket_manager(self, handler):
        self._web_socket_manager = handler

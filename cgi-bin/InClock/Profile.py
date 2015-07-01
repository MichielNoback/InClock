#!/usr/bin/env python3

"""
 Name:      Profile.py (InClock package)
 Date:      6/2015
 Desc:      Communications handlers for dealing with JavaScript
 Author:    J. Vuopionpera
 
    Copyright (C) 2015  J. Vuopionpera

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
"""

__version__ = "0.1a"
__author__ = "J. Vuopionpera"

import cgi
import cgitb
import json
import base64
from Crypto.Cipher import AES
from Crypto import Random
import datetime

cgitb.enable()  # For development only


class UserData:
    """ All data retrieval and storage methods """
    
    def __init__(self, data):
        self.data = data

    def aes_encrypt(self, key):
        """
        Desc:   AES-256 encrypt JSON data and return as Base64
        Input:  key -> [32-byte binary string] :: AES encryption key
        Output: None :: sets internal variable
        """
        self.data = str.encode(str(self.data))
        iv = Random.new().read(AES.block_size)
        cipher = AES.new(key, AES.MODE_CFB, iv)  # 256-bit
        self.data = base64.b64encode(iv + cipher.encrypt(self.data))

    def aes_decrypt(self, key):
        """
        Desc:   Decrypt Base64 formatted AES-256 JSON data
        Input:  key -> [32-byte binary string] :: AES encryption key
        Output: None :: sets internal variable
        """
        self.data = base64.b64decode(self.data)
        iv = self.data[:AES.block_size]
        cipher = AES.new(key, AES.MODE_CFB, iv)  # 256-bit
        self.data = cipher.decrypt(self.data)[AES.block_size:]

    def get_from_local(self, file_blob):
        pass
    
    def get_from_test(self, filename):
        """
        Desc:   Test function
        """
        test_AES_key = b'V\xcf"K$-\xbbO\x10\xc6\x98\x0e\xf0q\x99\x8c\xeb/\xa6-\x1e\t`n%D\xb1\xa2\xc2(\xf2\xc6'
        test_SHA256_ref = "c94075d7dcc9e06ca6eedc89dc143231268493efd21ab91c3cd81304c07d70a4"
        with open(filename, 'rb') as user_file:
            self.data = user_file.read()
        self.aes_decrypt(test_AES_key)

        self.data = bytes.decode(self.data).replace("'", '"')
        self.data = json.loads(self.data)

        self.update_file_timestamps()
    
    def get_from_db(self, username):
        pass

    def save_to_test(self, filename, data):
        """
        Desc:     Save data to test JSON file
        Input:    filename -> [str] path to server file
                  data -> [str] JSON formatted string
        """
        test_AES_key = b'V\xcf"K$-\xbbO\x10\xc6\x98\x0e\xf0q\x99\x8c\xeb/\xa6-\x1e\t`n%D\xb1\xa2\xc2(\xf2\xc6'
        self.data = json.loads(data)
        self.update_file_timestamps()
        self.aes_encrypt(test_AES_key)
        with open(filename, 'wb') as user_file:
            user_file.write(self.data)

    def update_file_timestamps(self):
        """
        Desc:   Iterate JSON data and calculate new time differences
        Output: None :: sets internal variable
        """
        data = self.data
        json_keys = [key for key in data.keys() if key != 'user']
        # Iterate through relevant json dicts and update timestamps
        for template in json_keys:
            for point_id, point_data in data[template].items():
                unix_timestamp = int(point_data['unixTimeStamp'])
                # Adjust for JavaScript format
                unix_timestamp /= 1000.0
                unix_timestamp += int(data['user']['timeZoneOffset']) * 60**2
                # Make datetime and subtract from current time
                unix_timestamp = datetime.datetime.utcfromtimestamp(unix_timestamp)
                unix_diff = datetime.datetime.now() - unix_timestamp
                human_format = "".join([str(unix_diff.days if unix_diff.days > 0 else 0), 'd:',
                                        str(unix_diff.seconds//3600), 'h:', str((unix_diff.seconds//60) % 60), 'm'])
                data[template][point_id]['localTimeStamp'] = human_format
                if data[template][point_id]['daysSinceLastInjection'] != 'n':
                    data[template][point_id]['daysSinceLastInjection'] = unix_diff.days if unix_diff.days > 0 else 0

    def parse(self, active=True):
        """
        Desc:   Parse JSON data back to client
        Input:  active -> [boolean] :: ** optional
        Output: Prints application/json header and JSON data
        """
        header = "Content-Type: application/json\n\n"
        content = json.dumps(self.data) if active else ' '
        print(header, content)

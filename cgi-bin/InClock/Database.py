#!/usr/bin/env python3

"""
 Name:      Database.py (InClock package)
 Date:      7/2015
 Desc:      Database communication protocols for InClock
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

__version__ = (0.1, 'alpha')
__author__ = "J. Vuopionpera"

import os
import json
import base64
import random
import mysql.connector as pymysql
import hashlib
from InClock import conf
from InClock import Error
from Crypto.Cipher import AES
from Crypto import Random


def aes_encrypt(key, data):
    """
    Desc:   AES-256 encrypt JSON data and return as Base64
    Input:  key -> [32-byte binary string] :: AES encryption key
    Output: binary string
    """
    data = str.encode(json.dumps(data))
    iv = Random.new().read(AES.block_size)
    cipher = AES.new(bytes(key), AES.MODE_CFB, iv)  # 256-bit
    data = base64.b64encode(iv + cipher.encrypt(data))
    return data


def aes_decrypt(key, data):
    """
    Desc:   Decrypt Base64 AES-256
    Input:  key -> [32-byte binary string] :: AES encryption key
    Output: string
    """
    data = base64.b64decode(data)
    iv = data[:AES.block_size]
    cipher = AES.new(bytes(key), AES.MODE_CFB, iv)  # 256-bit
    data = cipher.decrypt(bytes(data))[AES.block_size:]
    return data


class DatabaseHandler:
    """ Provide a simple inheritable MySQL-client """

    def __init__(self):
        filename = conf.MYSQL_CONF_FILE
        self.conf_file = ''.join([os.path.expanduser('~'), '/', filename])
        self.table_names = conf.TABLE_NAMES
        self.cursor, self.connection = None, None

    def __enter__(self):
        """
        Desc:   Attempt to connect to database
        Output: self
        """
        try:
            database = pymysql.connect(option_files=self.conf_file)
            cursor = database.cursor()
        except Exception as e:
            Error.log(e)
            return e  # Development only!
        else:
            self.cursor, self.connection = cursor, database
            return self

    def test(self):
        """
        Test the MySQL connection
        :return: Boolean
        """
        sql = "SELECT version()"
        try:
            self.cursor.execute(sql)
        except Exception as e:
            Error.log(e)
            return False
        else:
            return True

    def query(self, sql, args):
        """
        Desc:   Execute SQL query
        Input:  sql -> [string] :: valid SQL query
                args -> [tuple] :: arguments required in query
        Output: Boolean
        """
        try:
            self.cursor.execute(sql, args)
        except Exception as e:
            Error.log(e)
            return False
        else:
            return True

    def __exit__(self, *args, **kwargs):
        """
        Desc:   Close cursor and database connections
        Input:  args -> [*args] :: redundant data
                kwargs -> [**kwargs] :: redundant data
        """
        try:
            self.cursor.close()
            self.connection.close()
        except Exception as e:
            Error.log(e)


class DatabasePut(DatabaseHandler):
    """ Add/Change data to/in MySQL database """

    def register_new_user(self, username, user_pwd, user_type, user_data, checksum, user_mail=None):
        """
        Desc:   Register a new user
        Input:  username -> [string] :: new username
                user_pwd -> [string] :: user password
                user_type -> [int] :: define user creation mode
                user_mail -> [str] :: e-mail address for recovery
        """
        # Create new hash from password
        new_salt = os.urandom(16)
        user_pwd = str.encode(user_pwd) + new_salt
        user_hash = hashlib.sha512(user_pwd).hexdigest().upper()
        # Create new user reference
        with DatabaseGet() as db:
            new_reference = "".join([chr(random.randint(65, 90)) for _ in range(10)])
            while db.check_if_user_reference_exists(new_reference):
                new_reference = "".join([chr(random.randint(65, 90)) for _ in range(10)])
        # Register a new 32-byte AES key
        key = self.create_user_key(new_reference)
        # Types:    [1]: auto-generated user
        #           [2]: registered user
        #           [3]: local-storage user
        sql, args = None, None
        if user_type in (1, 3):
            sql = "INSERT INTO `{}` (`uid`, `uhs`, `usl`, `uref`, `utype`, `checksum`) VALUES (%s, %s, %s, %s, %s, %s)"\
                  .format(self.table_names['users'])
            args = (username, user_hash, new_salt, new_reference, user_type, checksum,)
            self.create_user_data_space(key, new_reference, user_data)

        if user_type == 2:
            sql = "INSERT INTO `{}` (`uid`, `uhs`, `usl`, `uref`, `urec`, `utype`, `checksum`) VALUES (%s, %s, %s, %s, \
                   %s, %s, %s)".format(self.table_names['users'])
            args = (username, user_hash, new_salt, new_reference, user_mail, user_type, checksum,)
            self.create_user_data_space(key, new_reference, user_data)

        if sql is not None and args is not None:
            if self.query(sql, args):
                self.connection.commit()

    def create_user_data_space(self, key, user_reference, user_data):
        """
        Desc:   Create dedicated database entry for user data
        Input:  user_reference -> [string] :: user identifier
        """
        sql = "INSERT INTO `{}` (`uref`, `udata`) VALUES (%s, %s)".format(self.table_names['data'])
        args = (user_reference, aes_encrypt(key, user_data),)
        if self.query(sql, args):
            self.connection.commit()

    def create_user_key(self, user_reference):
        """
        Desc:   Create dedicated database entry for user AES key
        Input:  user_reference -> [string] :: user identifier
        """
        new_AES_key = os.urandom(32)
        sql = "INSERT INTO `{}` (`uref`, `ukey`) VALUES (%s, %s)".format(self.table_names['keys'])
        args = (user_reference, new_AES_key)
        if self.query(sql, args):
            self.connection.commit()
        return new_AES_key

    def update_user_data(self, new_data, user_ref):
        """
        Update user profile data in database
        :param new_data: [bytes] byte string of profile data
        :param user_ref: [string] user reference
        :return: None
        """
        sql = "UPDATE `{}` SET `udata`=%s WHERE `uref`=%s".format(self.table_names['data'])
        args = (new_data, user_ref,)
        if self.query(sql, args):
            self.connection.commit()

    def activate_user_code(self, code):
        """
        Desc:   Flip status for activation code to 1
        Input:  code -> [string] :: code e.g. ABCDEF
        """
        #sql = "UPDATE `{}` SET `status`=1 WHERE `code`=%s".format(self.table_names['codes'])
        #args = (code,)
        #if self.query(sql, args):
            #self.connection.commit()
        return True

    def register_new_session(self, user_ref):
        """
        Desc:   Register a new user session
        Input:  user_ref -> [string] :: user reference
        Output: session_id -> [string] :: session identifier
                session_key -> [string] :: session key SHA-256
        """
        session_id = hashlib.sha256(os.urandom(10)).hexdigest().upper()
        session_key = hashlib.sha256(os.urandom(32)).hexdigest().upper()
        sql = "INSERT INTO `{}` (`uref`, `sid`, `skey`) VALUES (%s, %s, %s)".format(self.table_names['session'])
        args = (user_ref, session_id, session_key,)
        if self.query(sql, args):
            self.connection.commit()
            return session_id, session_key


class DatabaseGet(DatabaseHandler):
    """ Request data from MySQL database """

    def check_if_user_exists(self, username):
        """
        Check username against know registered names
        :param username: [string] username
        :return: boolean
        """
        sql = "SELECT EXISTS(SELECT 1 FROM `{}` WHERE `uid`=%s)".format(self.table_names['users'])
        args = (username,)
        if self.query(sql, args):
            is_user = self.cursor.fetchone()[0]
            return True if is_user == 1 else False

    def check_if_code_is_valid(self, code):
        """
        Check if provided code is valid
        :param code: [string] access code e.g. QWERTY
        :return: boolean
        """
        sql = "SELECT 1 FROM `{}` WHERE `code`=%s AND `status`='0'".format(self.table_names['codes'])
        args = (code,)
        if self.query(sql, args):
            is_user = self.cursor.fetchone()[0]
            return True if is_user == 1 else False

    def check_if_user_reference_exists(self, reference):
        """
        Check user reference against know references
        :param reference: [string] user reference
        :return: boolean
        """
        sql = "SELECT EXISTS(SELECT 1 FROM `{}` WHERE `uref`=%s)".format(self.table_names['users'])
        args = (reference,)
        if self.query(sql, args):
            is_reference = self.cursor.fetchone()[0]
            return is_reference is True

    def validate_user_password(self, username, pwd):
        """
        Check if user password matches database hash
        :param username: [string] username
        :param pwd: [string] password
        :return: boolean
        """
        # Fetch password data
        sql = "SELECT `usl`, `uhs` FROM `{}` WHERE `uid`=%s".format(self.table_names['users'])
        args = (username,)
        if self.query(sql, args):
            salt, old_hash = self.cursor.fetchone()
            # Generate password hash
            pwd = str.encode(pwd) + salt
            new_hash = hashlib.sha512(pwd).hexdigest().upper()
            if old_hash == new_hash:
                return True
            else:
                return False

    def retrieve_user_reference(self, username):
        """
        Get user reference for username
        :param username: [string] username
        :return: [string] username
        """
        sql = "SELECT `uref` FROM `{}` WHERE `uid`=%s".format(self.table_names['users'])
        args = (username,)
        if self.query(sql, args):
            return self.cursor.fetchone()[0]

    def validate_session(self, session_id, session_key):
        """
        Check if session parameters match database
        :param session_id: [string] session identifier
        :param session_key: [string] session checksum
        :return: [string] user reference | boolean
        """
        sql = "SELECT `uref` FROM `{}` WHERE `sid`=%s AND `skey`=%s".format(self.table_names['session'])
        args = (session_id, session_key,)
        if self.query(sql, args):
            user_reference = self.cursor.fetchone()
            if user_reference is not None:
                return user_reference[0]
        return False

    def retrieve_user_data(self, user_ref):
        """
        Get user data from database
        :param user_ref: [string] user reference
        :return: [bytes] data blob | boolean
        """
        sql = "SELECT `udata` FROM `{}` WHERE `uref`=%s".format(self.table_names['data'])
        args = (user_ref,)
        if self.query(sql, args):
            data = self.cursor.fetchone()
            return data[0]
        return False

    def retrieve_user_key(self, user_ref):
        """
        Get encryption key from database
        :param user_ref: [string] user reference
        :return: [bytes] encryption key | boolean
        """
        sql = "SELECT `ukey` FROM `{}` WHERE `uref`=%s".format(self.table_names['keys'])
        args = (user_ref,)
        if self.query(sql, args):
            enc_key = self.cursor.fetchone()[0]
            return enc_key
        return False


class DatabaseDrop(DatabaseHandler):
    """ Remove data from MySQL database """

    def delete_session(self, session_id):
        """
        Drop session from database
        :param session_id: [string] session identifier
        :return: None
        """
        sql = "DELETE FROM `{}` WHERE `sid`=%s".format(self.table_names['session'])
        args = (session_id,)
        if self.query(sql, args):
            self.connection.commit()

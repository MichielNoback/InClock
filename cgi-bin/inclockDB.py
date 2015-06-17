#!/usr/bin/env python3

"""
 Name:      inclockDB.py (part of InClock)
 Date:      6/2015
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

import os
import random
import pymysql
import hashlib
import inclockError


class DatabaseHandler:
    """ Provide a simple inheritable MySQL-client """

    def __init__(self):
        self.database_host = "localhost"
        self.database_name = "inclock"
        self.database_user = "root"
        self.user_password = ""
        self.table_names = {'users': 'inclock_users', 'keys': 'inclock_ukeys', 'data': 'inclock_udata'}
        self.cursor, self.connection = None, None

    def __enter__(self):
        """
        Desc:   Attempt to connect to database
        Output: self
        """
        try:
            database = pymysql.connect(host=self.database_host, user=self.database_user,
                                       passwd=self.user_password, db=self.database_name)
            cursor = database.cursor()
        except Exception as e:
            inclockError.log(e)
        else:
            self.cursor, self.connection = cursor, database
            return self

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
            inclockError.log(e)
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
            inclockError.log(e)


class DatabasePut(DatabaseHandler):
    """ Commit changes to MySQL database """

    def register_new_user(self, username, user_pwd, user_type, user_mail=None):
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
        # Types:    [1]: auto-generated user
        #           [2]: registered user
        #           [3]: local-storage user
        sql, args = None, None
        if user_type in (1, 3):
            sql = "INSERT INTO `{}` (`uid`, `uhs`, `usl`, `uref`, `utype`) VALUES (%s, %s, %s, %s, %s)"\
                  .format(self.table_names['users'])
            args = (username, user_hash, new_salt, new_reference, user_type,)
            self.create_user_data_space(new_reference)

        if user_type == 2:
            sql = "INSERT INTO `{}` (`uid`, `uhs`, `usl`, `uref`, `urec`, `utype`) VALUES (%s, %s, %s, %s, %s, %s)"\
                  .format(self.table_names['users'])
            args = (username, user_hash, new_salt, new_reference, user_mail, user_type,)
            self.create_user_data_space(new_reference)

        if sql is not None and args is not None:
            if self.query(sql, args):
                self.connection.commit()
        # Register a new 32-byte AES key
        self.create_user_key(new_reference)

    def create_user_data_space(self, user_reference):
        """
        Desc:   Create dedicated database entry for user data
        Input:  user_reference -> [string] :: user identifier
        """
        sql = "INSERT INTO `{}` (`uref`) VALUES (%s)".format(self.table_names['data'])
        args = (user_reference,)
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

    def update_user_data(self, new_data):
        pass


class DatabaseGet(DatabaseHandler):
    """ Request data from MySQL database """

    def check_if_user_exists(self, username):
        """
        Desc:   Check username against know registered names
        Input:  username -> [string] :: username
        Output: Boolean
        """
        sql = "SELECT EXISTS(SELECT 1 FROM `{}` WHERE `uid`=%s)".format(self.table_names['users'])
        args = (username,)
        if self.query(sql, args):
            is_user = self.cursor.fetchone()[0]
            return is_user is True

    def check_if_user_reference_exists(self, reference):
        """
        Desc:   Check user reference against know references
        Input:  references -> [string] :: user reference
        Output: Boolean
        """
        sql = "SELECT EXISTS(SELECT 1 FROM `{}` WHERE `uref`=%s)".format(self.table_names['users'])
        args = (reference,)
        if self.query(sql, args):
            is_reference = self.cursor.fetchone()[0]
            return is_reference is True

    def retrieve_user_data(self, username):
        pass

    def retrieve_user_key(self, userref):
        pass

#!/usr/bin/env python3

"""
 Name:      Comms.py (InClock package)
 Date:      7/2015
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

import os
import sys
import json
import base64
import hashlib
import datetime
from InClock import Database
from InClock import Error

ACCESS_RESTRICTION = False


def standard_login(username, pwd):
    """
    Validate login information and parse JSON status back
    :param username: [string] username
    :param pwd: [string] password
    :return: None
    """
    print("Content-Type: application/json\n\n")
    with Database.DatabaseGet() as db:
        if db.check_if_user_exists(username):
            if db.validate_user_password(username, pwd):
                # Register a new session
                with Database.DatabasePut() as db, Database.DatabaseGet() as db2:
                    session_id, session_key = db.register_new_session(db2.retrieve_user_reference(username))
                # Return OK + session data
                print(json.dumps({'status': 'OK', 'sid': session_id, 'skey': session_key}))
            else:
                print(json.dumps({'status': 'BAD'}))
        else:
            print(json.dumps({'status': 'BAD'}))


def secure_upload(data, password):
    """
    Decrypt AES an encrypted file stream
    :param data: [MiniFieldStorage] file stream
    :param password: [string] password
    :return: JSON formatted string
    """
    password = hashlib.sha256(str.encode(password)).digest()  # Calculate SHA-256
    data = bytes.decode(data.file.read()).strip()
    data = bytes.decode(Database.aes_decrypt(password, data)).replace("'", '"')
    try:
        data = json.loads(data)
    except Exception:
        Error.load_error_page('Your file has been corrupted or is invalid.')
        sys.exit()
    else:
        return json.dumps(data)


def plain_upload(data):
    """
    Decode non-encrypted file stream
    :param data: [MiniFieldStorage] file stream
    :return: JSON formatted string
    """
    try:
        data = bytes.decode(data.file.read()).strip()
        data = bytes.decode(base64.b64decode(str.encode(data))).replace("'", '"')
        data = json.loads(data)
    except Exception:
        Error.load_error_page('Your file has been corrupted or is invalid.')
        sys.exit()
    else:
        return json.dumps(data)


def repackage_file(data, **kwargs):
    """
    Encode / Encrypt file data
    :param data: [string] JavaScript JSON response
    :param kwargs: [**] optional parameters
    :return: None
    """
    if kwargs.get('pwd', False):
        password = hashlib.sha256(base64.b64decode(str.encode(kwargs['pwd']))).digest()
        data = bytes.decode(Database.aes_encrypt(password, data))
    else:
        data = bytes.decode(base64.b64encode(str.encode(data)))
    deliver_payload(data, kwargs['cookieId'])


def access_session(session_id, session_key, is_save=False, **kwargs):
    """
    Retrieve user data from database based on session data
    :param session_id: [string] session identifier
    :param session_key: [string] session checksum
    :param is_save: [boolean] save/read mode
    :param kwargs: [**] optional parameters
    :return: JSON string, session identifier, session checksum | None
    """
    with Database.DatabaseGet() as db:
        user_ref = db.validate_session(session_id, session_key)
    if user_ref and not is_save:
        with Database.DatabaseGet() as db:
            data = db.retrieve_user_data(user_ref)
            enc_key = db.retrieve_user_key(user_ref)  # Get AES key
        with Database.DatabaseDrop() as db:
            db.delete_session(session_id)  # Delete login session
        with Database.DatabasePut() as db:
            session_id, session_key = db.register_new_session(user_ref)
        # Decrypt data
        data = bytes.decode(Database.aes_decrypt(enc_key, data)).replace("'", '"')
        data = json.loads(data)
        return json.dumps(data), session_id, session_key
    elif user_ref and is_save:
        with Database.DatabaseDrop() as db:
            db.delete_session(session_id)
        with Database.DatabaseGet() as db:
            enc_key = db.retrieve_user_key(user_ref)
        with Database.DatabasePut() as db:
            db.update_user_data(Database.aes_encrypt(enc_key, kwargs['data']), user_ref)
        kwargs['callback'].load_home()
    else:
        Error.load_error_page('Your session expired or is invalid. {} {} {}'.format(user_ref, session_id, session_key))
        sys.exit()


def kill_session_no_save(session_id):
    """
    Remove session from database when user ignores save
    :param session_id: [string] session identifier
    :return: None
    """
    with Database.DatabaseDrop() as db:
        db.delete_session(session_id)


def create_new_user(post_data):
    """
    Register a new user and generate the necessary MySQL entries
    :param post_data: [FieldStorage] all POST data
    :return: None
    """
    username = post_data.getvalue('username')
    password = post_data.getvalue('userpwd')
    user_type = post_data.getvalue('utype')
    user_code = post_data.getvalue('code') if 'code' in post_data else None
    if ACCESS_RESTRICTION is True and validate_user_code(user_code, False) is False:
        print("Content-Type: application/json\n\n")
        print(json.dumps({"status": "BAD CODE"}))
        sys.exit()
    if int(user_type) == 2:
        mail = post_data.getvalue('mail')
    user_data = post_data.getvalue('data')
    # Generate SHA-256 checksum
    checksum = hashlib.sha256(os.urandom(32)).hexdigest().upper()
    user_data = json.loads(user_data)
    user_data['user']['dataCorruptionHash'] = checksum
    # Check user against database
    with Database.DatabaseGet() as db:
        if db.check_if_user_exists(username):
            print("Content-Type: application/json\n\n")
            print(json.dumps({"status": "BAD NAME"}))
            sys.exit()
    with Database.DatabasePut() as db:
        if int(user_type) == 2:  # Non-anonymous user
            db.register_new_user(username, password, int(user_type), user_data, checksum, mail)
        else:  # Anonymous user
            db.register_new_user(username, password, int(user_type), user_data, checksum)
    if ACCESS_RESTRICTION:
        with Database.DatabasePut() as db:
            db.activate_user_code(user_code)
    print("Content-Type: application/json\n\n")
    print(json.dumps({"status": "OK"}))
    sys.exit()


def create_new_file(data, **kwargs):
    """
    Generate a new user file, encrypted or not
    :param data: [JSON object] all user profile data
    :param kwargs: [**] optional parameters
    :return: None
    """
    if kwargs.get('encrypted', False):
        password = kwargs['pwd']
        password = hashlib.sha256(str.encode(password)).digest()
        data = bytes.decode(Database.aes_encrypt(password, data))
    else:
        data = bytes.decode(base64.b64encode(str.encode(json.dumps(data))))
    if ACCESS_RESTRICTION:
        with Database.DatabasePut() as db:
            db.activate_user_code(kwargs['additional'].getvalue('code'))
    deliver_payload(data, kwargs['cookieId'])


def deliver_payload(data, cookieId):
    """
    Push generated file to user by setting proper headers
    :param data: [string] base64 encoded data
    :param cookieId: [string] file identifier for JavaScript
    :return: None
    """
    filename = 'profile.inclock'
    # Configure header for download
    print("Content-Type: application/x-download")
    # Create cookie timestamp for 10s
    expire = datetime.datetime.utcnow() + datetime.timedelta(seconds=10)
    expire = expire.strftime("%a, %d-%b-%Y %H:%M:%S GMT")
    cookie = json.dumps({'fileId': cookieId})
    print("Set-Cookie: {}; expires={}".format(cookie, expire))
    print("Content-Disposition: attachment; filename='{}'\n".format(filename))
    print(data)


def check_username(username):
    """
    Check username against database and return JSON status
    :param username: [string] username
    :return: None
    """
    print("Content-Type: application/json\n\n")
    with Database.DatabaseGet() as db:
        if not db.check_if_user_exists(username):
            print(json.dumps({'status': 'OK'}))
        else:
            print(json.dumps({'status': 'BAD'}))


def validate_user_code(code, is_external=True):
    """
    Check access code against database
    :param code: [string] access code e.g. QWERTY
    :param is_external: [boolean] client/server call
    :return: boolean | None
    """
    print("Content-Type: application/json\n\n") if is_external else None
    with Database.DatabaseGet() as db:
        if not db.check_if_code_is_valid(code):
            if is_external:
                print(json.dumps({'status': 'BAD CODE'}))
            else:
                return False
        else:
            if is_external:
                print(json.dumps({'status': 'OK'}))
            else:
                return True
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
import cgi
import cgitb
import base64
import json
import traceback
from InClock import Comms
from InClock import Error

ACCESS_RESTRICTION = True
Comms.ACCESS_RESTRICTION = ACCESS_RESTRICTION


class Page:
    @staticmethod
    def load_home():
        """
        Load the homepage
        :return: None
        """
        index_location = 'http://localhost/InClock/'
        print("Location: {}\n\n".format(index_location))

    @staticmethod
    def load_config(activation_code=None):
        """
        Generate the configuration page HTML
        :param activation_code: [string | None] access code when using access restrictions
        :return: None
        """
        status = Comms.validate_user_code(activation_code, False) if ACCESS_RESTRICTION else None
        if status in (True, None):
            with open('../html/config.html', 'r') as html:
                print("Content-Type: text/html\n\n")
                print(html.read()) if activation_code is None else print(html.read().format(activation_code))
        else:
            Page.load_home()

    @staticmethod
    def load_profile(session_id, session_key, **kwargs):
        """
        Generate the user dashboard and output the HTML
        :param session_id: [string] session identifier
        :param session_key: [string] session checksum
        :param kwargs: [**] optional parameters
        :return: None
        """
        user_config = {}
        if kwargs.get('local', False) is True:  # Profile is upload
            if kwargs.get('encrypted', False) is True:  # Profile has AES encryption
                data = Comms.secure_upload(kwargs['data'], kwargs['pwd'])
                user_config['type'] = 3
                user_config['key'] = bytes.decode(base64.b64encode(str.encode(kwargs['pwd'])))
            else:
                data = Comms.plain_upload(kwargs['data'])
                user_config['type'] = 4
        else:
            data, session_id, session_key = Comms.access_session(session_id, session_key)  # Request user data
            user_config['type'] = 1
            user_config['sid'] = session_id
            user_config['skey'] = session_key
        # Configure JSON for JavaScript format
        user_config = '"' + json.dumps(user_config).replace('"', r'\"') + '"'
        if r'\"' not in data:
            data = '"' + data.replace('"', r'\"') + '"'
        # Construct HTML output
        with open('../html/dashboard.html', 'r') as html:
            print("Content-Type: text/html\n\n")
            print(html.read().format(pythonJSONhook=data, pythonConfigHook=user_config))


def main():
    """
    Supervise the POST requests and assign them to the right functions
    :return: None
    """
    cgitb.enable()  # development only!
    if 'CONTENT_TYPE' in os.environ and 'multipart/form-data' in os.environ['CONTENT_TYPE']:
        parameters = cgi.FieldStorage()
    else:
        parameters = cgi.FieldStorage(environ={'REQUEST_METHOD': 'POST'})  # Fix for x-www-form-urlencoded
    protocol = parameters.getvalue('prc')
    # Determine action based on protocol value
    actions = {
        # Check if user name exists
        'checkName': lambda: Comms.check_username(parameters.getvalue('username')),
        # Register a new cloud user, includes anonymous and regular
        'newUser': lambda: Comms.create_new_user(parameters),
        # Generate a new encrypted profile file and parse it back
        'newSecureFile': lambda: Comms.create_new_file(parameters.getvalue('data'), pwd=parameters.getvalue('pwd'),
                                                       encrypted=True, cookieId=parameters.getvalue('cookieId'),
                                                       additional=parameters),
        # Generate a new plain profile file and parse it back
        'newPlainFile': lambda: Comms.create_new_file(parameters.getvalue('data'), additional=parameters,
                                                      cookieId=parameters.getvalue('cookieId')),
        # Check if access code is valid
        'checkCode': lambda: Comms.validate_user_code(parameters.getvalue('code')),
        # Interpret user data and load profile Dashboard HTML; cloud only
        'loadProfile': lambda: Page.load_profile(parameters.getvalue('sid'), parameters.getvalue('skey')),
        # Load the configurator page
        'loadConfig': lambda: Page.load_config(parameters.getvalue('code') if ACCESS_RESTRICTION else None),
        # Validate login credentials and return session key
        'standardLogin': lambda: Comms.standard_login(parameters.getvalue('username'), parameters.getvalue('pwd')),
        # Upload encrypted file and load Dashboard
        'secureUpload': lambda: Page.load_profile(0, 0, local=True, encrypted=True, pwd=parameters.getvalue('pwd'),
                                                  data=parameters['data']),
        # Upload plain file and display in Dashboard
        'plainUpload': lambda: Page.load_profile(None, None, local=True, data=parameters['data']),
        # Re-encrypt user data and parse file back
        'saveSecureFile': lambda: Comms.repackage_file(parameters.getvalue('data'), pwd=parameters.getvalue('pwd'),
                                                       cookieId=parameters.getvalue('cookieId')),
        # Re-encode user data and parse it back
        'savePlainFile': lambda: Comms.repackage_file(parameters.getvalue('data'), cookieId=parameters.getvalue('cookieId')),
        # Save user session data to database
        'saveUser': lambda: Comms.access_session(parameters.getvalue('sid'), parameters.getvalue('skey'),
                                                 is_save=True, data=parameters.getvalue('data'), callback=Page),
        # Delete user session from database when no data is saved
        'noSaveUser': lambda: Comms.kill_session_no_save(parameters.getvalue('sid'))
    }
    try:
        actions[protocol]() if protocol in actions else Page.load_home()
    except Exception as e:
        Error.log(e)
        print("Content-Type: text/html\n\n", traceback.format_exc())  # development only!
        #Page.load_home()

if __name__ == "__main__":
    main()
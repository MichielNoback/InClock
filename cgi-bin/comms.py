#!/usr/bin/env python3

"""
 Name:      comms.py (part of InClock)
 Date:      5/2015
 Desc:      Communications handlers for dealing with JavaScript (comms.js)
 Author:    J. Vuopionpera
"""

import cgi
import json


class UserData:
    """ All data retrieval and storage methods """
    
    def __init__(self):
        self.data = None
    
    def get_from_dropbox(self, filename):
        pass
    
    def get_from_local(self, file_blob):
        pass
    
    def get_from_test(self, filename):
        with open(filename, 'r') as user_file:
            self.data = json.loads(user_file.read())
    
    def get_from_db(self, username, session_key):
        pass

    def save_to_test(self, filename, data):
        """
        Do:  Save data to test JSON file
        In:  filename -> [str] path to server file
             data -> [str] JSON formatted string
        """
        with open(filename, 'w') as user_file:
            json.dump(json.loads(data), user_file, indent=2)

    def parse(self, active=True):
        """
        Do:  Parse JSON data to client-side
        In:  active -> [bool] ** optional
        """
        header = "Content-Type: application/json\n\n"
        content = json.dumps(self.data) if active else ' '
        print(header, content)
    

def main():
    """
    Do:  Determine action based on POST variables
    """
    # Setup the CGI
    parameters = cgi.FieldStorage()
    protocol = parameters.getvalue('prc')
    session_data = UserData()
    active = True  # Default
    if protocol == 'dropbox':
        filename = parameters.getvalue('fn')
        session_data.get_from_dropbox(filename)
    elif protocol == 'test':
        test_file = parameters.getvalue('fn')
        if 'data' in parameters is not None:
            # Save to file
            session_data.save_to_test(test_file, parameters.getvalue('data'))
            active = False
        else:
            # Read from file
            session_data.get_from_test(test_file)
    session_data.parse(active)  # Return response
        

if __name__ == "__main__":
    main()

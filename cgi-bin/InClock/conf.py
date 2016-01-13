#!/usr/bin/env python3
#  Edit custom environment variables
#  Variables refering to domain and MySQL

INDEX_LOCATION = 'http://localhost/InClock/'  # Application root folder

MYSQL_CONF_FILE = '.inclock.cnf'  # Path to login file

TABLE_NAMES = {'users': 'inclock_users', 'keys': 'inclock_ukeys', 'data': 'inclock_udata',
                'codes': 'inclock_codes', 'session': 'inclock_sessions'}

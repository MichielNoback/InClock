#!/usr/bin/env python3

"""
 Name:      Error.py (InClock package)
 Date:      7/2015
 Desc:      Handle errors and write them to a log
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

import datetime

PATH = "error.log"  # Path to error log


def log(error):
    """
    Write error to log file
    :param error: [string] error message
    :return: None
    """
    try:
        with open(PATH, 'a') as f:
            message = "\n".join([">>>" + datetime.datetime.now().isoformat(), str(error), ''])
            f.write(message)
    except IOError:
        pass


def load_error_page(msg):
    """
    Generate the error HTML page
    :param msg: [string] friendly error message
    :return: None
    """
    with open('../html/error.html') as html:
        print("Content-Type: text/html\n\n")
        print(html.read().format(pythonErrorHook=msg))
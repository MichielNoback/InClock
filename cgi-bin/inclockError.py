#!/usr/bin/env python3

"""
 Name:      inclockError.py (part of InClock)
 Date:      6/2015
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

import datetime

PATH = "error.log"


def log(error):
    """
    Desc:   Write error message to a log
    Input:  error -> [Error object]
    """
    try:
        with open(PATH, 'a') as f:
            message = "\n".join([">>>" + datetime.datetime.now().isoformat(), str(error), ''])
            f.write(message)
    except IOError:
        pass
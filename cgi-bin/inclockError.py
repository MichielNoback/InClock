#!/usr/bin/env python3

"""
 Name:      inclockError.py (part of InClock)
 Date:      6/2015
 Desc:      Handle errors and write them to a log
 Author:    J. Vuopionpera
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
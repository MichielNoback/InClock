/***********************************************************************
*   Name:   comms.js (part of InClock)                                         
*   Date:   5/2015
*   Desc:   Contains all methods and classes related too server 
* 	        communications and JSON interpration.
*   Author: J. Vuopionpera
* 
* 	Dependencies: listeners.js, pointer.js
***********************************************************************/

function UserData() {
	
	this.data = null;
	
	this.getFromDropbox = function () {
		// Dropbox API
	};
	
	this.getFromDatabase = function () {
		// Get from database
	};
	
	this.getFromLocal = function () {
		
	};
    
    this.getFromTest =  function () {
        // Test protocol with server file
        var filename = '../resource/user.json';
        var caller = $.ajax({
            url: '../cgi-bin/comms.py',
            data: {prc: 'test', fn: filename},
            dataType: 'json',
            method: 'POST',
            async: true
        });
        return caller;
    };
	
	this.saveToDatabase = function () {
		// Store data in database
	};
	
	this.saveToDropbox = function () {
		// Send data to dropbox
	};
	
	this.saveToLocal = function () {
		// Save data to local
	};
    
    this.saveToTest = function (jsonData) {
        // Save to server test file
        var filename = '../resource/user.json';
        $.ajax({
            url: '../cgi-bin/comms.py',
            data: {prc: 'test', fn: filename, data: JSON.stringify(jsonData)},
            method: 'POST',
            success: function () {
                console.log('File was saved!');    
            }
        });
    };
	
};

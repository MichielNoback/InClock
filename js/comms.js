/***********************************************************************
*   Name:   comms.js (part of InClock)                                         
*   Date:   6/2015
*   Desc:   Contains all methods and classes related too server 
* 	        communications and JSON interpration.
*   Author: J. Vuopionpera
* 
* 	Dependencies: pointer.js
***********************************************************************/

function UserData() {
	
	this.data = null;
	
	this.get_from_dropbox = function () {
		// Dropbox API
	};
	
	this.get_from_database = function () {
		// Get from database
	};
	
	this.get_from_local = function () {
		
	};
	
	this.process_json = function () {
		// Transform JSON into SVG points
	};
	
	this.save_to_database = function () {
		// Store data in database
	};
	
	this.save_to_dropbox = function () {
		// Send data to dropbox
	};
	
	this.save_to_local = function () {
		// Save data to local
	};
	
};

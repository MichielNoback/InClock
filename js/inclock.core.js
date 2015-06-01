/******************************************************************
*   Name:    inclock.core.js 
*   Author:  J. Vuopionpera
*   Date:    6-2015
*   Desc:    Core function for InClock data handling and application
*            constructor. + Inclock initiator
*            Contains: AppConstructor, UserData
******************************************************************/

document.addEventListener("DOMContentLoaded", function () {
    // If page ready
    var app = new AppConstructor();
    app.init();  // Start InClock
});

function AppConstructor() {
     /**************************************************************
    *   Class   >> AppConstructor
    *   Desc    >> Application builder and top-level event listener
    **************************************************************/
    this.dataLink;
    this.language;
    this.colorData;
    this.userTemplates;
    this.currentTemplate;
    this.canvasHandle;
    var self = this;
    
    this.init = function () {
        /*********************************************************
        *   Function    >> AppConstructor.init
        *   Desc        >> Grab data from UserData 
        *********************************************************/
        var userData = new UserData(self);
        userData.getFromTest();
    };
    
    this.loadTemplate = function () {
        /*********************************************************
        *   Function    >> AppConstructor.loadTemplate
        *   Desc        >> Build DashBoard
        *********************************************************/
        // Load HTML
        constructDashboard(self.language, self.userTemplates[self.currentTemplate]);
        document.getElementById('editPanel').style.display = 'none';
        self.loadSVG();
    };
    
    this.loadSVG = function () {
        /*********************************************************
        *   Function    >> AppConstructor.loadSVG
        *   Desc        >> Initiate SVGCanvas for template 
        *********************************************************/
        // Load Canvas
        var svg = new SVGCanvas(self.dataLink, self.userTemplates[self.currentTemplate]);
        self.canvasHandle = svg;
        svg.paintCanvas();    
    };
    
    this.switchTemplate = function () {
        /*********************************************************
        *   Function    >> AppConstructor.switchTemplate
        *   Desc        >> Load next user template
        *********************************************************/
        // Load new Image
        (self.currentTemplate === (self.userTemplates.length - 1)) ? self.currentTemplate-- : self.currentTemplate++;
        document.getElementById("templateIMG").src = getTemplateLocation(self.userTemplates[self.currentTemplate]);
        // Destroy old and initiate new template
        self.canvasHandle.destroyCanvas();
        self.loadSVG();
    };
    
    this.eventMonitor = function () {
        /*********************************************************
        *   Function    >> AppConstructor.eventMonitor
        *   Desc        >> top-level event listeners
        *********************************************************/
        document.getElementById('btnSGOT').addEventListener('click', self.exit);
        document.getElementById('btnSWTP').addEventListener('click', self.switchTemplate);  
    };
    
    this.removeCluster = function (clusterId) {};
    
    this.exit = function () {
        /*********************************************************
        *   Function    >> AppConstructor.exit
        *   Desc        >> Exit class and unbind event listeners 
        *********************************************************/
        document.getElementById('btnSGOT').removeEventListener('click', self.exit);
        document.getElementById('btnSWTP').removeEventListener('click', self.switchTemplate);
    };
}

function UserData(callback) {
    /**************************************************************
    *   Class   >> UserData
    *   Desc    >> Handles all server communications
    *   Input   >> callback function
    **************************************************************/
	this.data = null;
    this.TESTFILE = '../resource/user2.json'
    this.callback = callback;
    var self = this;
	
    this.createXMLHttpObject = function () {
        /*********************************************************
        *   Function    >> UserData.createXMLHttpObject
        *   Desc        >> return a XMLHttpRequest object
        *   Output      >> XMLHttpRequest object
        *********************************************************/
        var xmlhttp;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();    
        } else {
            // No Legacy Support!   
        };
        return xmlhttp;
    };
    
    this.openAjaxChannel = function (args) {
        /*********************************************************
        *   Function    >> UserData.openAjaxChannel
        *   Desc        >> POST to server
        *   Input       >> args :: object with POST parameters
        *********************************************************/
        var serverFile = "../cgi-bin/comms.py";
        var xmlhttp = self.createXMLHttpObject();
        var dataStream = [];
        // Construct the data stream
        for (var arg in args) {
            var parameter = [arg, '=', args[arg]];
            dataStream.push(parameter.join(''));
        };
        dataStream = '?' + dataStream.join('&');
        // Send AJAX request and catch server response
        xmlhttp.open("POST", serverFile + dataStream, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function () {
            // If server responds with "OK"
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                // Setup callback class with data configuration
                self.callback.dataLink = JSON.parse(xmlhttp.responseText);
                self.callback.userTemplates = self.callback.dataLink.user.templatesUsed;
                self.callback.language = self.callback.dataLink.user.language;
                self.callback.colorData = self.callback.dataLink.user.colorScheme;
                self.callback.currentTemplate = 0;
                self.callback.loadTemplate();
                self.callback.eventMonitor();
            } else {
                // Error handling 
            };
        };
    };
	
	this.getFromDatabase = function () {
		// Get from database
	};
	
	this.getFromLocal = function () {
		
	};
    
    this.getFromTest =  function () {
        var data = {prc: 'test', fn: this.TESTFILE};
        self.openAjaxChannel(data);
    };
	
	this.saveToDatabase = function () {
		// Store data in database
	};
	
	this.saveToLocal = function () {
		// Save data to local
	};
    
    this.saveToTest = function (jsonData) {
        // Save to server test file
        
    };
	
};
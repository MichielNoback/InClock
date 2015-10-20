/******************************************************************
*   Name:    inclock.core.js 
*   Author:  J. Vuopionpera
*   Date:    6-2015
*   Desc:    Core function for InClock data handling and application
*            constructor. + Inclock initiator
*            Contains: AppConstructor, UserData

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
******************************************************************/


function dashBoardInit(userData) {
    document.addEventListener("DOMContentLoaded", function () {
        // If page ready
        var app = new AppConstructor();
        app.init(userData);  // Start InClock
    });
};

function paintItRed(element, isjQuery) {
    if (isjQuery === true) {
        element.css('border-color', '#FF3624');
        element.css('background', 'rgba(255, 54, 36, 0.4)');
    } else {
        element.style.borderColor = '#FF3624';
        element.style.background = 'rgba(255, 54, 36, 0.4)';
    };
};

function generateCookieId() {
    return Math.random().toString(36).substr(2, 12);
};

function paintItGreen(element, isjQuery) {
    if (isjQuery === true) {
        element.css('border-color', '#61BF00');
        element.css('background', 'rgba(97, 191, 0, 0.4)');
    } else {
        element.style.borderColor = '#61BF00';
        element.style.background = 'rgba(97, 191, 0, 0.4)';
    };
};

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
    
    this.init = function (data) {
        /*********************************************************
        *   Function    >> AppConstructor.init
        *   Desc        >> Grab data from HTML
        *********************************************************/
        self.dataLink = data;
        self.userTemplates = data.user.templatesUsed;
        self.language = data.user.language;
        self.colorData = data.user.colorScheme;
        self.currentTemplate = 1;
        self.loadTemplate();
        self.eventMonitor();
        self.switchTemplate();
    };
    
    this.loadTemplate = function () {
        /*********************************************************
        *   Function    >> AppConstructor.loadTemplate
        *   Desc        >> Build DashBoard
        *********************************************************/
        // Load HTML
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
        document.getElementById('btnSVPF').addEventListener('click', self.save);
        document.getElementById('btnSWTP').addEventListener('click', self.switchTemplate);
        
        window.onbeforeunload = function (e) {
            if (e.explicitOriginalTarget.parentElement.id === 'btnSVPF' && e.explicitOriginalTarget.id === 'btnSVPF') { 
                if (userConfig.type === 1) {
                    var comm = new Comms(null);
                    comm.noSaveData(userConfig.sid);
                };
            };
        };
        
    };
    
    this.removeCluster = function (clusterId) {};
    
    this.save = function () {
        /*********************************************************
        *   Function    >> AppConstructor.exit
        *   Desc        >> Exit class and unbind event listeners 
        *********************************************************/
        // Remove event listeners
        document.getElementById('btnSVPF').removeEventListener('click', self.save);
        document.getElementById('btnSWTP').removeEventListener('click', self.switchTemplate);
        // Send data to server
        var comm = new Comms(null);
        comm.saveData(self.dataLink, userConfig);
    };
}

function Comms(callback) {
    /**************************************************************
    *   Class   >> UserData
    *   Desc    >> Handles all server communications
    *   Input   >> callback function
    **************************************************************/
	this.data = null;
    this.callback = callback;
    this.STANDARD_IFRAME_NAME = "inclockTarget";
    this.HOMEPAGE = "http://bioinf.nl/~jyvuopionpera/InClock";
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
    
    this.openChannel = function (dataStream, internalCaller, isRedirect, hasTarget) {
        var serverFile = (/cgi-bin/.test(window.location.pathname) === true) ? '../cgi-bin/inclock.py' : 'cgi-bin/inclock.py';
        if (isRedirect === true) {
            var tempForm = document.createElement('form');
            tempForm.method = "POST";
            tempForm.action = serverFile;
            for (var param in dataStream) {
                if (dataStream.hasOwnProperty(param)) {
                    var newInput = document.createElement('input');
                    newInput.setAttribute('name', param);
                    newInput.setAttribute('value', dataStream[param]);
                    tempForm.appendChild(newInput);
                };
            };
            document.body.appendChild(tempForm);
            if (hasTarget === true) {
                self.createHiddenIFrame();
                tempForm.target = self.STANDARD_IFRAME_NAME;
                tempForm.submit();
                
                var checkStatus = function () {
                    var cookie = document.getElementsByName(self.STANDARD_IFRAME_NAME)[0].contentWindow.document.cookie;
                    if (cookie.length > 0) {
                        cookie = JSON.parse(cookie);
                        if (cookie.fileId === dataStream.cookieId) {
                            window.location = self.HOMEPAGE;    
                        };
                    };
                };
                
                setInterval(checkStatus, 10);
            } else {
                tempForm.submit();
            };
        } else {
            var xmlhttp = self.createXMLHttpObject();
            // Construct the dataStream
            properDataStream = [];
            for (var param in dataStream) {
                if (dataStream.hasOwnProperty(param)) {
                    properDataStream.push([param, dataStream[param]].join('='));    
                };
            };
            properDataStream = properDataStream.join('&');
            // Open AJAX channel
            xmlhttp.open("POST", serverFile, true);
            xmlhttp.send(properDataStream);
            // Monitor channel
            xmlhttp.onreadystatechange = function () {
                // If server responds with "OK"
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200 && self.callback !== undefined) {
                    internalCaller(JSON.parse(xmlhttp.responseText));
                } else {
                    // Error handling    
                };
            };
        };
    };
    
    this.createHiddenIFrame = function () {
        var iframe = document.createElement('iframe');
        iframe.innerHTML = "Dummy text";
        iframe.style.display = 'none';
        iframe.name = self.STANDARD_IFRAME_NAME;
        document.body.appendChild(iframe);
    };
    
    this.loadLanguageFile = function (lang) {
        if (lang === undefined || lang.length === 0) {
            var browserLanguage = navigator.language || navigator.userLanguage;
            var langFile = getLanguageFileLocation(browserLanguage.split('-')[0]);
        } else {
            var langFile = getLanguageFileLocation(lang);
        };
        var xmlhttp = self.createXMLHttpObject();
        xmlhttp.open("GET", langFile, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function () {
            // If server responds with "OK"
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200 && self.callback !== undefined) {
                self.callback(JSON.parse(xmlhttp.responseText));
            };
        };
    };
    
    this.checkUsernameAgainstDatabase = function (username) {
        var dataStream = {'prc': 'checkName', 'username': username};  
        var handleResponse = function (response) {
            self.callback(response);    
        }; 
        self.openChannel(dataStream, handleResponse);
    };
    
    this.registerNewUser = function (profile, username, userpwd, type, mail, accessCode) {
        var dataStream = {'prc': 'newUser', 'username': username, 'userpwd': userpwd, 'utype': type,
                          'mail': mail, 'data': JSON.stringify(profile), 'code': accessCode};
        var handleResponse = function (response) {
            self.callback(response);
        };
        self.openChannel(dataStream, handleResponse);
    };
    
    this.checkUserCode = function (code) {
        var dataStream = {'prc': 'checkCode', 'code': code};
        var handleResponse = function (response) {
            self.callback(response);
        };
        self.openChannel(dataStream, handleResponse);   
    };
    
    this.loadConfigurator = function (accessCode) {
        var dataStream = {'prc': 'loadConfig', 'code': (accessCode !== undefined) ? accessCode : ''};
        self.openChannel(dataStream, null, true);
    };
    
    this.loadProfile = function (sid, skey) {
        var dataStream = {'prc': 'loadProfile', 'sid': sid, 'skey': skey};
        self.openChannel(dataStream, null, true);
    };
	
	this.standardLogin = function (username, pwd) {
        var dataStream = {'prc': 'standardLogin', 'username': username, 'pwd': pwd};
        var handleResponse = function (response) {
            if (response.status === 'OK') {
                self.loadProfile(response.sid, response.skey);        
            } else {
                self.callback(response.status);            
            };
        };
        self.openChannel(dataStream, handleResponse);
    };
    
    this.newSecureFile = function (profile, password, accessCode) {
        var cookieId = generateCookieId();
        var dataStream = {'prc': 'newSecureFile', 'data': JSON.stringify(profile), 'pwd': password, 
                          'cookieId': cookieId, 'code': accessCode};
        self.openChannel(dataStream, null, true, true);
    };
    
    this.newPlainFile = function (profile, accessCode) {
        var cookieId = generateCookieId();
        var dataStream = {'prc': 'newPlainFile', 'data': JSON.stringify(profile), 'cookieId': cookieId,
                          'code': accessCode};
        self.openChannel(dataStream, null, true, true);
    };
    
    this.saveData = function (profile, config) {
        if (config.type === 3 || config.type === 4) {
            var cookieId = generateCookieId();
            var dataStream = {'data': JSON.stringify(profile), 'cookieId': cookieId};
            if (config.type === 3) {
                dataStream['prc'] = 'saveSecureFile';
                dataStream['pwd'] = config.key;
            } else {
                dataStream['prc'] = 'savePlainFile';
            };
            self.openChannel(dataStream, null, true, true);       
        } else {
            var dataStream = {'prc': 'saveUser', 'data': JSON.stringify(profile), 
                              'sid': config.sid, 'skey': config.skey};
            //console.log(dataStream);
            self.openChannel(dataStream, null, true);
        };
    };
    
    this.noSaveData = function (sid) {
        var dataStream = {'prc': 'noSaveUser', 'sid': sid};
        self.openChannel(dataStream);
    };
};

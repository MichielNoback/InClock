/******************************************************************
*   Name:    inclock.core.js 
*   Author:  J. Vuopionpera
*   Date:    6-2015
*   Desc:    Core function for InClock data handling and application
*            constructor. + Inclock initiator
*            Contains: AppConstructor, Comms

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
    /*********************************************************
    *   Function    >> dashBoardInit
    *   Desc        >> Construct the dashboard page
    *********************************************************/
    document.addEventListener("DOMContentLoaded", function () {

        var start = function() {
            // If page ready
            var app = new AppConstructor();
            app.init(userData, undefined);  // Start InClock
            app.getTopTenPoints();
            // Bind unload handlers
            window.onbeforeunload = function() {
                return languageDict['dashboard']['warning1'];
            };
            window.onunload = function() {
                var comm = new Comms();
                comm.noSaveData(userConfig['sid']);
                console.log("さようなら");
            };
        };

        determineLanguageAndLoadFile(start);
    });
};

function determineLanguageAndLoadFile(callback){
    /*********************************************************
    *   Function    >> determineLanguageAndLoadFile
    *   Desc        >> Load correct language file
    *********************************************************/
    // Check for language specification in url
    var url = window.location.href;
    lang = url.split('?lang=')[1];
    // Load language data
    var fileLoaded = function (response) {
        window.languageDict = response;
        $('.validation_wrap').hide();
        document.body.onload = replaceVars(callback);
    }
    var loadLanguage = new Comms(fileLoaded);
    loadLanguage.loadLanguageFile(lang);
};

function replaceVars(callback) {
    /*********************************************************
    *   Function    >> replaceVars
    *   Desc        >> Replace HTML placeholders with text
    *********************************************************/
    var pattern = /@([a-z]+.[a-z]+[0-9]+)/ig;
    var matches = document.body.innerHTML.match(pattern);
    // + match for header
    var headerMatches = document.head.innerHTML.match(pattern);

    var customSorter = function (a, b) {
        var pattern = /[0-9]+/g;
        a = parseInt(a.match(pattern));
        b = parseInt(b.match(pattern));
        return a - b;
    };
    matches.sort(customSorter);
    matches.reverse();

    for (var mat in matches) {
        match = matches[mat].slice(1, matches[mat].length);
        var domains = match.split('.');
        var string = window.languageDict[domains[0]][domains[1]];
        if (string !== undefined) {
            var reppat = new RegExp(matches[mat], 'ig')
            document.body.innerHTML = document.body.innerHTML.replace(reppat, string);
        }
    };

    for (var mat in headerMatches) {
        match = headerMatches[mat].slice(1, headerMatches[mat].length);
        var domains = match.split('.');
        var string = window.languageDict[domains[0]][domains[1]];
        if (string !== undefined) {
            var reppat = new RegExp(matches[mat], 'ig')
            document.body.innerHTML = document.body.innerHTML.replace(reppat, string);
        }
    };

    if (callback != null) {callback();};
};

function emptyField(event) {
    // Empty a value field
    event.target.value = '';
};

function resetField(event) {
    // Set default value as value
    var value = event.target.alt;
    // Only reset field when no value is given
    if (event.target.value.length === 0){
        event.target.value = value;
    };
};

function submitField(event, alt) {
    // Submit on ENTER key = 13
    if (event.keyCode === 13 && alt === undefined){
        // Get parent node
        var parent = event.srcElement.parentNode;
        // Get corresponding button node
        var button = parent.nextElementSibling;
        button.click();
    } else if (event.keyCode === 13 && alt === 'config') {
        // Better not alter HTML
        event.srcElement.parentNode.parentNode.lastElementChild.firstElementChild.click()
    };
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

function shuffle(someList) {
    // Fisher-Yates shuffle
    var counter = someList.length;
    var index;
    var temp;

    while (counter > 0) {
        index = Math.floor(Math.random() * counter); // Random index
        counter--;
        temp = someList[counter];
        someList[counter] = someList[index];
        someList[index] = temp;
    };

    return someList;
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
    this.mode;
    var self = this;
    
    this.init = function (data, mode) {
        /*********************************************************
        *   Function    >> AppConstructor.init
        *   Desc        >> Grab data from HTML
        *********************************************************/
        self.mode = mode;
        self.dataLink = data;
        self.userTemplates = data.user.templatesUsed;
        self.language = data.user.language;
        self.colorData = data.user.colorScheme;
        self.currentTemplate = 1;
        self.loadTemplate(self.mode);
        self.eventMonitor(self.mode);
        self.switchTemplate(self.mode);
        if (self.mode !== 'config') {
            self.showStartUpHint();
        };
    };

    this.showStartUpHint = function () {
        document.getElementById("global-messages").innerHTML = languageDict['dashboard']['general1'];
        $("#global-messages").show();
        $("#global-messages").fadeOut(4000);
    };
    
    this.loadTemplate = function () {
        /*********************************************************
        *   Function    >> AppConstructor.loadTemplate
        *   Desc        >> Build DashBoard
        *********************************************************/
        // Load HTML
        if (self.mode === undefined || self.mode === null) {
            document.getElementById('editPanel').style.display = 'none';
        };
        self.loadSVG(self.mode);
    };
    
    this.loadSVG = function () {
        /*********************************************************
        *   Function    >> AppConstructor.loadSVG
        *   Desc        >> Initiate SVGCanvas for template 
        *********************************************************/
        // Load Canvas
        var svg = new SVGCanvas(self.dataLink, self.userTemplates[self.currentTemplate], self.mode);
        self.canvasHandle = svg;
        svg.paintCanvas();
    };
    
    this.switchTemplate = function () {
        /*********************************************************
        *   Function    >> AppConstructor.switchTemplate
        *   Desc        >> Load next user template
        *********************************************************/
        //if (mode === undefined && self.mode !== undefined){mode = self.mode;};
        // Load new Image
        (self.currentTemplate === (self.userTemplates.length - 1)) ? self.currentTemplate-- : self.currentTemplate++;
        document.getElementById("templateIMG").src = getTemplateLocation(self.userTemplates[self.currentTemplate]);
        // Destroy old and initiate new template
        self.canvasHandle.destroyCanvas();
        self.loadSVG(self.mode);
        if (self.mode !== 'config') {
            self.getTopTenPoints();
        };
    };
    
    this.eventMonitor = function () {
        /*********************************************************
        *   Function    >> AppConstructor.eventMonitor
        *   Desc        >> top-level event listeners
        *********************************************************/
        if (self.mode === undefined || self.mode === null) {
            document.getElementById('btnSVPF').addEventListener('click', self.save);
            document.getElementById('btnSWTP').addEventListener('click', self.switchTemplate);
            document.getElementById('btnLGOT').addEventListener('click', function () {
                var comm = new Comms(null);
                window.location = comm.HOMEPAGE;
            });
        } else if (self.mode === 'config') {
            document.getElementById('btnSWTP').addEventListener('click', function () {self.switchTemplate(self.mode)});
        };
    };

    this.getTopTenPoints = function () {
        // Get top ten qualified points in random order
        var references = [];
        for (index in self.dataLink) {
            if (index === self.userTemplates[self.currentTemplate]) {
                for (pid in self.dataLink[index]) {
                    var point = self.dataLink[index][pid];
                    if (point.reactivity < 9) {
                        var timeSince = (point.unixTimeStamp === 0) ? languageDict['dashboard']['other1'] : convertTimestampToHuman(point.unixTimeStamp).time;
                        references.push([pid, timeSince, getClusterName(point.clusterAffiliation), point.unixTimeStamp]);
                    };
                };
            };
        };

        var customSorter = function (a, b) {
            return parseInt(a[3]) - parseInt(b[3]);
        };
        references.sort(customSorter);
        references = references.slice(0, 10);
        references = shuffle(references);
        addSuggestedSitesToHTML(references, self.canvasHandle);
    };
    
    this.save = function () {
        /*********************************************************
        *   Function    >> AppConstructor.exit
        *   Desc        >> Exit class and unbind event listeners 
        *********************************************************/
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
    this.STANDARD_FORM_NAME = "inclockSaveForm";
    this.HOMEPAGE = "http://localhost/InClock";
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
    
    this.openChannel = function (dataStream, internalCaller, isRedirect, hasTarget, sync) {
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
                console.log(tempForm);
                self.createHiddenIFrame();
                tempForm.target = self.STANDARD_IFRAME_NAME;
                tempForm.id = self.STANDARD_FORM_NAME;
                tempForm.submit();
                self.removeHiddenIFrameAndForm();
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
            if (sync === true) {
                xmlhttp.open("POST", serverFile, false);
            } else {
                xmlhttp.open("POST", serverFile, true);
            };
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
        iframe.id = self.STANDARD_IFRAME_NAME;
        document.body.appendChild(iframe);
    };
    
    this.removeHiddenIFrameAndForm = function () {
        document.getElementById(self.STANDARD_IFRAME_NAME).parentNode.removeChild(document.getElementById(self.STANDARD_IFRAME_NAME));
        document.getElementById(self.STANDARD_FORM_NAME).parentNode.removeChild(document.getElementById(self.STANDARD_FORM_NAME));
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
        //window.onbeforeunload = null; // Reset the onbeforeunload
        if (config.type === 3 || config.type === 4) {
            var cookieId = generateCookieId();
            var dataStream = {'data': encodeURI(JSON.stringify(profile)), 'cookieId': cookieId};
            if (config.type === 3) {
                dataStream['prc'] = 'saveSecureFile';
                dataStream['pwd'] = config.key;
            } else {
                dataStream['prc'] = 'savePlainFile';
            };
            self.openChannel(dataStream, null, true, true);       
        } else {
            var dataStream = {'prc': 'saveUser', 'data': encodeURI(JSON.stringify(profile)),
                              'sid': config.sid, 'skey': config.skey};
            var callback = function (msg) {
                if (msg.status === "OK") {
                    document.getElementById("global-messages").innerHTML = languageDict['dashboard']['general2'];
                    $("#global-messages").show();
                    $("#global-messages").fadeOut(1000);
                } else {
                    document.getElementById("global-messages").innerHTML = "Error!";
                    $("#global-messages").show();
                    $("#global-messages").fadeOut(4000);
                }
            };
            self.openChannel(dataStream, callback, false);
        };
    };
    
    this.noSaveData = function (sid) {
        var dataStream = {'prc': 'noSaveUser', 'sid': sid};
        self.openChannel(dataStream, null, false, false, true);
    };
};

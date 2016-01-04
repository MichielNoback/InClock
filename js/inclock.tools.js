/******************************************************************
*   Name:    inclock.tools.js 
*   Author:  J. Vuopionpera
*   Date:    6-2015
*   Desc:    Includes all tool-like classes for InClock
*            Contains: SVGCanvas, ToolTip, PointConfigurator,
                       Point
                       
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

function SVGCanvas(dataLink, templateId, mode) {
    /**************************************************************
    *   Class   >> SVGCanvas
    *   Desc    >> All SVG related methods
    *   Input   >> dataLink :: UserData object
    *              templateId :: template name e.g. BodyFront
    **************************************************************/
    this.dataLink = dataLink;
    this.templateId = templateId;
    this.activePoints = {};
    this.mode = mode;
    var self = this;
    
    this.paintCanvas = function () {
        /*********************************************************
        *   Function    >> SVGCanvas.paintCanvas
        *   Desc        >> Place all relative points on SVG 
        *********************************************************/
        for (var point in self.dataLink[self.templateId]) {
            var newPoint = new Point(self.dataLink, self.dataLink[self.templateId][point], self);
            self.activePoints[point] = newPoint;
            newPoint.init(self.mode);
        };
        if (self.mode === undefined || self.mode === null) {
            document.getElementById('btnADNP').onclick = self.addNewPoint; // Add Point
        };
    };
    
    this.resetPointStates = function () {
        /*********************************************************
        *   Function    >> SVGCanvas.resetPointStates
        *   Desc        >> Call exit functions on all points 
        *********************************************************/
        for (var point in self.activePoints) {
            self.activePoints[point].exit(); 
        };
    };
    
    this.destroyCanvas = function () {
        /*********************************************************
        *   Function    >> SVGCanvas.destroyCanvas
        *   Desc        >> Remove all points from canvas 
        *********************************************************/
        for (var point in self.activePoints) {
            var newData = self.activePoints[point].localData;
            self.dataLink[self.templateId][newData.pointId] = newData;
            self.activePoints[point].destroyInstance();
        };
        document.getElementById('svgFrame').innerHTML = ''; // Empty SVG
    };
    
    this.addNewPoint = function () {
        /*********************************************************
        *   Function    >> SVGCanvas.addNewPoint
        *   Desc        >> Add a new point to the canvas 
        *********************************************************/
        var dropSite = document.getElementById('pointWindow');
        // Change button function
        document.getElementById('btnADNP').onclick = null;
        document.getElementById('btnADNP').className = 'button warning_button';
        document.getElementById('btnADNP').innerHTML = languageDict['dashboard']['button9'];
        // Activate visuals
        dropSite.style.background = 'rgba(245, 245, 245, 0.4)';
        dropSite.style.cursor = 'crosshair';
        // Bind event listener
        dropSite.onclick = function (event) {
            // Reset window
            document.getElementById('btnADNP').click();
            // Make new point
            var newId = self.generateNewId();
            var newPoint = constructJSONPoint(newId, event.layerX, event.layerY);
            self.dataLink[self.templateId][newId] = newPoint;
            console.log(self.templateId);
            newPoint = new Point(self.dataLink, self.dataLink[self.templateId][newId], self);
            self.activePoints[newId] = newPoint;
            newPoint.init();
        };
        document.getElementById('btnADNP').onclick = function () {
            // Reset dropsite
            dropSite.onclick = null;
            dropSite.style.background = 'none';
            dropSite.style.cursor = 'default';
            // Reset event listeners
            document.getElementById('btnADNP').onclick = self.addNewPoint;
            document.getElementById('btnADNP').className = 'button';
            document.getElementById('btnADNP').innerHTML = languageDict['dashboard']['button3'];
        };
    };
    
    this.addSimplePoint = function (x, y, clusterId) {
        var newId = self.generateNewId();
        var newPoint = constructJSONPoint(newId, x, y, clusterId);
        self.dataLink[self.templateId][newId] = newPoint;
        newPoint = new Point(self.dataLink, self.dataLink[self.templateId][newId], self);
        self.activePoints[newId] = newPoint;
        newPoint.init('config');
        return newId;
    };

    this.deleteSimplePoint = function (pointIds) {
        for (index in pointIds) {
            delete self.dataLink[self.templateId][pointIds[index]];
            delete self.activePoints[pointIds[index]];
        };
        self.destroyCanvas();
        self.paintCanvas();
    };

    this.generateNewId = function () {
        /*********************************************************
        *   Function    >> SVGCanvas.generateNewId
        *   Output      >> 5 letter alpha-numeric string
        *   Desc        >> Generate a new sequential id for a 
        *                  new point 
        *********************************************************/
        // Sort all active ids
        var pointIds = [];
        var prefix = getTemplatePrefix(self.templateId); // e.g. BF or BB
        for (var key in self.activePoints) { pointIds.push(key); };
        if (pointIds.length === 0) { return prefix + '0'; }; // If no points exist
        pointIds.sort(function (pointA, pointB) {
            // Custom sort
            pointA = parseInt(pointA.slice(2, pointA.length));
            pointB = parseInt(pointB.slice(2, pointB.length));
            if (pointA < pointB) { return -1; };
            if (pointA > pointB) { return 1; };
            return 0;
        });
        // Construct new ID
        var maxId = pointIds[pointIds.length - 1];
        var number = maxId.slice(2, maxId.length);
        var newId = prefix + (parseInt(number) + 1).toString();
        return newId;
    };
};

function ToolTip(language, colorProfile, localData, pointHandle) {
    /**************************************************************
    *   Class   >> ToolTip
    *   Desc    >> All ToolTip related methods
    *   Input   >> language :: 2 letter string e.g. en, nl
    *              colorProfile :: string e.g. blueToRed, rainbow
    *              localData :: point data Object
    *              pointHandle :: related Point object
    **************************************************************/
    this.standardId = "tooltip";
    this.localData = localData;
    this.language = language;
    this.colorProfile = colorProfile;
    this.pointHandle = pointHandle;
    var self = this;
    
    this.placeOnCanvas = function () {
        /*********************************************************
        *   Function    >> ToolTip.placeOnCanvas
        *   Desc        >> Place tooltip on canvas point
        *********************************************************/
        constructToolTip(self.language, self.determineColor(), self.localData, self.standardId);
        document.getElementById(self.standardId).addEventListener('click', self.pointHandle.exit);
    };
    
    this.removeFromCanvas = function () {
        /*********************************************************
        *   Function    >> ToolTip.removeFromCanvas
        *   Desc        >> Remove tooltip from canvas
        *********************************************************/
        var tool = document.getElementById(self.standardId);
        if (tool !== null) {
            tool.removeEventListener('click', self.pointHandle.exit);
            tool.parentNode.removeChild(tool);
        };
    };
    
    this.determineColor = function () {
        /*********************************************************
        *   Function    >> ToolTip.determineColor
        *   Output      >> Hex-code color
        *   Desc        >> Figure out reactivity color based on
        *                  scale and colorscheme
        *********************************************************/
        var colors = getColorScheme(self.colorProfile);
        return colors[self.localData.reactivity - 1]
    };
};

function PointConfigurator(dataLink, localData, canvasHandle, toolHandle, parent) {
    /**************************************************************
    *   Class   >> PointConfigurator
    *   Desc    >> All Point data manipulation methods
    *   Input   >> dataLink :: UserData object
    *              localData :: point data Object
    *              canvasHandle :: SVGCanvas object
    *              toolHandle :: ToolTip object
    *              parent :: parent Point object
    **************************************************************/
    this.dataLink = dataLink;
    this.localData = localData;
    this.canvasHandle = canvasHandle;
    this.toolHandle = toolHandle;
    this.parent = parent;
    this.panelId = 'editPanel';
    this.notePanelId = 'notePanel';
    this.totalNotes;
    var self = this;
    
    this.init = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.init
        *   Desc        >> Build the manipulation panel and setup
        *                  event listeners
        *********************************************************/
        // HTML constructors
        document.getElementById(self.notePanelId).style.display = 'none';
        self.loadReactivityValue();
        self.loadNoteCount();
        self.slideDown();
        // Bind event listeners
        document.getElementById('btnDLPT').addEventListener('click', self.deletePoint) // Delete point
        document.getElementById('btnADNT').addEventListener('click', self.addNote); // Add note
        document.getElementById('btnCLNT').addEventListener('click', self.cancelNote); // Cancel note
        document.getElementById('btnNGRT').addEventListener('click', self.decreaseReactivityByOne); // +1
        document.getElementById('btnADRT').addEventListener('click', self.increaseReactivityByOne); // -1
        document.getElementById('btnVWHS').onclick = self.showNoteHistory; // Show history
        document.getElementById('btnNWIJ').addEventListener('click', self.addInjection); // Add new injection
    };
    
    this.showNoteHistory = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.showNoteHistory
        *   Desc        >> Build the note history panel and 
        *                  manage the event handling
        *********************************************************/
        if (self.totalNotes === 0) {return false;}; // No notes exist
        if (document.getElementById('noteConfig').innerHTML !== '') {return false;}; // Already active
        document.getElementById('btnVWHS').onlclick = '';
        
        constructNoteWindow(self.localData);
        $('#noteConfig').slideDown();
        $('#noteConfig .header div').get(0).addEventListener('click', self.hideNoteHistory);
        
        var notes = document.getElementById('noteConfig').getElementsByClassName('note_wrap');
        
        var activateNote = function (event) {
            // Stop Bubbling
            (event.stopPropagation) ? event.stopPropagation() : event.cancelBubble = true;
            // Show note contents
            var target = (event.target.className !== 'note_wrap') ? event.target.parentElement : event.target;
            $(target).find('.note').slideDown();
            target.onclick = disableNote;
        };
        
        var disableNote = function (event) {
            // Stop Bubbling
            (event.stopPropagation) ? event.stopPropagation() : event.cancelBubble = true;
            // Hide note contents
            var target = (event.target.className !== 'note_wrap') ? event.target.parentElement : event.target;
            $(target).find('.note').slideUp();
            target.onclick = activateNote;
        };
        
        // Bind event listeners to all notes
        for (var noteIndex = 0; noteIndex < notes.length; noteIndex++) {
            notes[noteIndex].onclick = activateNote;
            notes[noteIndex].children[0].children[0].onclick = self.removeNote; // No bubbling for button
        };
    
    };
    
    this.hideNoteHistory = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.hideNoteHistory
        *   Desc        >> Destroy the note history panel
        *********************************************************/
        $('#noteConfig').slideUp();
        document.getElementById('noteConfig').innerHTML = '';
        document.getElementById('btnVWHS').onlclick = self.showNoteHistory;
    };

    this.slideDown = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.slideDown
        *   Desc        >> Reveal the configurator panel 
        *********************************************************/ 
        $('#' + self.panelId).slideDown() 
    };
    
    this.loadNoteCount = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.loadNoteCount
        *   Desc        >> Count the amount of notes for a point
        *                  and place value on history button 
        *********************************************************/ 
        var noteCount = 0;
        var notes = self.localData.notes;
        for (var key in notes) {
            if (notes.hasOwnProperty(key)) noteCount++;
        };
        self.totalNotes = noteCount;
        noteCount = (noteCount > 10) ? '10+' : noteCount; // More than then notes = 10+
        document.getElementById('txtHSCT').innerHTML = ['<sup>', noteCount, '</sup>'].join('');
    }
    
    this.loadReactivityValue = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.loadReactivityValue
        *   Desc        >> Place reactivity value in value field
        *********************************************************/ 
        document.getElementById('txtRT').innerHTML = self.localData.reactivity;
        self.updatePoint();
    };
    
    this.loadTimeValues = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.loadTimeValues
        *   Desc        >> Place default time values in note field
        *********************************************************/ 
        var dateObject = new Date();
        document.getElementById('vlTDAY').value = dateObject.getDate();
        document.getElementById('vlTMON').value = dateObject.getMonth() + 1;
        document.getElementById('vlTYEA').value = dateObject.getFullYear().toString().slice(2, 4);
        document.getElementById('vlTHOU').value = dateObject.getHours();
        document.getElementById('vlTMIN').value = dateObject.getMinutes();
    };
        
    this.increaseReactivityByOne = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.increaseReactivityByOne
        *   Desc        >> Increase reactivity value by 1
        *********************************************************/ 
        self.localData.reactivity = (self.localData.reactivity < 10) ? self.localData.reactivity + 1 : 10;
        self.loadReactivityValue();
    };
    
    this.decreaseReactivityByOne = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.decreaseReactivityByOne
        *   Desc        >> Decrease reactivity value by 1
        *********************************************************/ 
        self.localData.reactivity = (self.localData.reactivity > 1) ? self.localData.reactivity - 1 : 1;
        self.loadReactivityValue();
    };
    
    this.updatePoint = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.updatePoint
        *   Desc        >> Redraw visual parts of a point to make
        *                  data changes take effect
        *********************************************************/ 
        var pointParts = document.getElementsByClassName(self.localData.pointId);
        var relevantParts = [];
        // Find all point parts without an id attribute
        for (var pid = 0; pid < pointParts.length; pid++) {
            if (!pointParts[pid].hasAttributeNS(null, 'id')) { relevantParts.push(pointParts[pid]) };    
        };
        // Remove found parts from SVG
        for (var point in relevantParts) {
            document.getElementById('svgFrame').removeChild(relevantParts[point]);
        };
        constructPoint(self.localData.pointId, self.localData.x, self.localData.y, 
                       self.parent.determineColor(), self.parent.determineSymbol(), true);
        // Update tooltip
        self.toolHandle.removeFromCanvas();
        self.toolHandle.placeOnCanvas();
    };
    
    this.slideUp = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.slideUp
        *   Desc        >> Hide configurator panel
        *********************************************************/ 
        $('#' + self.panelId).slideUp();
        $('#' + self.notePanelId).slideUp();
    };
    
    this.addNote = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.addNote
        *   Desc        >> Add a new note to history
        *********************************************************/
        if (document.getElementById('noteConfig').innerHTML !== '') {return false;};
        constructNoteWindow(self.localData, true); // isNoteMode = true
        $('#noteConfig').slideDown();

        var cancel = function (event) {
            document.getElementById('btnCNNT2').removeEventListener('click', cancel);
            document.getElementById('btnSVNT2').removeEventListener('click', save);
            $('#noteConfig .header div').get(0).removeEventListener('click', cancel);
            document.getElementById('btnADNT').addEventListener('click', self.addNote);
            self.hideNoteHistory();
        };

        var save = function () {
            var d = new Date();
            var title = [d.getDate(), '/', d.getMonth()+1, '/', d.getYear() + 1900, ' ', d.getHours(), ':', d.getMinutes()].join('');
            var msg = document.getElementById('vlNTXT');

            msg.style.border = (msg.value === '') ? 'solid 2px #FF3624' : 'solid 1px #999';
            if (msg.value === '') {return false;};

            // Create new entry
            self.loadNoteCount();
            var noteId = Math.random().toString(36).substr(2, 5);
            var noteObj = {};
            noteObj.localTimeStamp = title;
            noteObj.note = msg.value;
            noteObj.ranking = self.totalNotes + 1;
            self.localData.notes[noteId] = noteObj;

            // Reset environment
            document.getElementById('btnADNT').addEventListener('click', self.addNote);
            self.loadNoteCount();
            self.updatePoint();
            cancel();
        };

         // Bind event listeners
        document.getElementById('btnADNT').removeEventListener('click', self.addNote);
        document.getElementById('btnCNNT2').addEventListener('click', cancel);
        document.getElementById('btnSVNT2').addEventListener('click', save);
        $('#noteConfig .header div').get(0).addEventListener('click', cancel);

    };
    
    this.removeNote = function (event) {
        /*********************************************************
        *   Function    >> PointConfigurator.removeNote
        *   Desc        >> Remove note from history
        *********************************************************/
        var noteId = event.target.parentElement.parentElement.getAttribute('name');
        delete self.localData.notes[noteId];
        self.loadNoteCount();
        self.hideNoteHistory();
        self.showNoteHistory();
    };
    
    this.cancelNote = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.cancelNote
        *   Desc        >> Hide note panel
        *********************************************************/ 
        $('#' + self.notePanelId).slideUp();
    };
    
    this.deletePoint = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.deletePoint
        *   Desc        >> Remove point from canvas and global
        *                  memory
        *********************************************************/
        var conf = confirm(languageDict['dashboard']['warning2']);
        if (conf === true){
            self.canvasHandle.destroyCanvas();
            delete self.dataLink[self.canvasHandle.templateId][self.localData.pointId];
            delete self.canvasHandle.activePoints[self.localData.pointId];
            self.canvasHandle.paintCanvas();
        };
    };
    
    this.addInjection = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.addInjection
        *   Desc        >> Register a new injection
        *********************************************************/
        self.loadTimeValues();
        $('#' + self.notePanelId).slideDown();

        var saveInjection =  function () {
            document.getElementById('btnSVNT').onclick = '';
            // Grab Data
            var injDays = parseInt(document.getElementById('vlTDAY').value);
            var injMont = parseInt(document.getElementById('vlTMON').value);
            var injYear = parseInt('20' + document.getElementById('vlTYEA').value);
            var injHour = parseInt(document.getElementById('vlTHOU').value);
            var injMinu = parseInt(document.getElementById('vlTMIN').value);
            var injMesg = document.getElementById('vlNMSG').value;
            // Add injection to localData
            var dateObj = new Date(injYear, injMont - 1, injDays, injHour, injMinu);
            var timeStamp = dateObj.getTime()
            self.localData.unixTimeStamp = timeStamp;
            self.localData.localTimeStamp = [injHour, injMinu].join(':');
            if (injMesg !== '') {
                var noteId = Math.random().toString(36).substr(2, 5);
                var noteObj = {};
                noteObj.localTimeStamp = [injDays, '/', injMont, '/', injYear, ' ', injHour, ':', injMinu].join('');
                noteObj.note = injMesg;
                noteObj.ranking = self.totalNotes + 1;
                self.localData.notes[noteId] = noteObj;
                self.localData.localTimeStamp = [injDays, injMont, injYear].join('/');
            };
            self.localData.daysSinceLastInjection = convertTimestampToHuman(timeStamp).days;
            self.cancelNote();
            self.loadNoteCount();
            self.updatePoint();
            document.getElementById('vlNMSG').value = '';
        };
        document.getElementById('btnSVNT').onclick = saveInjection;

    };
    
    this.exit = function () {
        /*********************************************************
        *   Function    >> PointConfigurator.exit
        *   Desc        >> Kill all active point functions and 
        *                  unbind all event listeners
        *********************************************************/ 
        document.getElementById('btnDLPT').removeEventListener('click', self.deletePoint); // Delete point
        document.getElementById('btnNWIJ').removeEventListener('click', self.addNote); // Add note
        document.getElementById('btnCLNT').removeEventListener('click', self.cancelNote); // Cancel note
        document.getElementById('btnNGRT').removeEventListener('click', self.decreaseReactivityByOne); // +1
        document.getElementById('btnADRT').removeEventListener('click', self.increaseReactivityByOne); // -1
        document.getElementById('btnVWHS').onclick = ''; // Show history
        self.cancelNote();
        self.hideNoteHistory();
        self.slideUp();
    };
};

function Point(dataLink, localData, canvasHandle) {
    /**************************************************************
    *   Class   >> Point
    *   Desc    >> All Point tools
    *   Input   >> dataLink :: UserData object
    *              localData :: point data Object
    *              canvasHandle :: SVGCanvas object
    **************************************************************/
    this.dataLink = dataLink;
    this.colorProfile = this.dataLink.user.colorScheme;
    this.userLanguage = this.dataLink.user.language;
    this.localData = localData;
    this.canvasHandle = canvasHandle;
    this.COLOR_STEP_SIZE = 1;
    this.configHandle = null;
    this.toolHandle = null;
    var self = this;
    
    this.init = function (event, mode) {
        /*********************************************************
        *   Function    >> Point.init
        *   Desc        >> Place point on SVG and bind event 
        *                  event listeners
        *********************************************************/ 
        // Place point on SVG
        self.localData.daysSinceLastInjection = convertTimestampToHuman(self.localData.unixTimeStamp).days;
        constructPoint(self.localData.pointId, self.localData.x, self.localData.y, 
                       self.determineColor(), self.determineSymbol());
        if (mode === undefined || mode === null) {
            // Bind event listeners
            document.getElementById(self.localData.pointId).addEventListener('click', self.canvasHandle.resetPointStates);
            document.getElementById(self.localData.pointId).addEventListener('click', self.startConfigurator);
        } else {
            console.log(mode);
        };
    };
    
    this.remoteActivation = function () {
        console.log('active');
        self.canvasHandle.resetPointStates();
        self.startConfigurator();
    };

    this.determineColor = function () {
         /*********************************************************
        *   Function    >> Point.determineColor
        *   Output      >> Hex-code color
        *   Desc        >> Determine halo color based on last 
        *                  injection and colorscheme
        *********************************************************/ 
        // Determine halo color
        var colors = getColorScheme(self.colorProfile);
        var userStatus = self.localData.daysSinceLastInjection;
        if (userStatus !== 'n') {
            userStatus = Math.round(userStatus / self.COLOR_STEP_SIZE);
            if (userStatus > (colors.length - 1)) { 
                userStatus = 0; 
            } else {
                userStatus = colors.length - 1 - userStatus;   
            }
        } else {
            userStatus = 0;
        };
        return colors[userStatus];
    };
    
    this.determineSymbol = function () {
        /*********************************************************
        *   Function    >> Point.determineSymbol
        *   Output      >> Object containing reactivity data
        *   Desc        >> Determine SVG symbol based on reactivity
        *********************************************************/ 
        // Determine symbol size and shape
        var userReactivity = self.localData.reactivity;
        if (userReactivity < 10) {
            return {status: 'normal', value: userReactivity};
        } else {
            return {status: 'extreme', value: "+"};
        };
    };
    
    this.startConfigurator = function () {
        /*********************************************************
        *   Function    >> Point.startConfigurator
        *   Desc        >> Launch PointConfigurator and ToolTip
        *********************************************************/ 
        // Initiate required classes
        var tool = new ToolTip(self.userLanguage, self.colorProfile, self.localData, self);
        self.toolHandle = tool;
        var conf = new PointConfigurator(self.dataLink, self.localData, self.canvasHandle, tool, self);
        self.configHandle = conf;
        // Run
        tool.placeOnCanvas();
        conf.init();
    };
    
    this.exit = function () {
        /*********************************************************
        *   Function    >> Point.exit
        *   Desc        >> Call exit functions on related classes
        *********************************************************/ 
        // Call exit function on related classes
        if (self.configHandle !== null) {
            self.configHandle.exit();   
        };
        if (self.toolHandle !== null) {
            self.toolHandle.removeFromCanvas();
        };
    };
    
    this.destroyInstance = function () {
         /*********************************************************
        *   Function    >> Point.destroyInstance
        *   Desc        >> Call exit and remove event listeners 
        *********************************************************/ 
        self.exit();
        document.getElementById(self.localData.pointId).removeEventListener('click', self.canvasHandle.resetPointStates);
        document.getElementById(self.localData.pointId).removeEventListener('click', self.startConfigurator);    
    };
};

function SettingsConfigurator(dataLink, svgLink) {
    // Future class
};

/******************************************************************
*   Name:    inclock.html.js 
*   Author:  J. Vuopionpera
*   Date:    6-2015
*   Desc:    Includes HTML constructors for InClock
*            Contains: constructPoint, constructJSONPoint,
*                      constructToolTip, constructDashBoard,
*                      constructNoteWindow

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

function constructPoint(id, x, y, color, symbol, isUpdate) {
    /**************************************************************
    *   Function   >> constructPoint
    *   Desc       >> Build SVG point construct
    *   Input      >> id :: string e.g. BF12, BB8
    *                 x :: float
    *                 y :: float
    *                 color :: Hex-code color
    *                 symbol :: simple object
    *                 isUpdate :: boolean
    **************************************************************/
    var collectElements = []; // in case of update
    // Draw new points
    var xmlns = 'http://www.w3.org/2000/svg';
    // Color ring circle
    var new_point = document.createElementNS(xmlns, 'circle');
    new_point.setAttributeNS(null, "class", id);
    new_point.setAttributeNS(null, "cx", x);
    new_point.setAttributeNS(null, "cy", y);
    new_point.setAttributeNS(null, "r", 10);
    new_point.setAttributeNS(null, "stroke", color);
    new_point.setAttributeNS(null, "stroke-width", 5);
    new_point.setAttributeNS(null, "fill", "rgba(0, 0, 0, 0.0)");
    (isUpdate === true) ? collectElements.push(new_point) : document.getElementById("svgFrame").appendChild(new_point);
    // Center indicator
    if (symbol.status == 'normal') {
        // Draw dot
        new_point = document.createElementNS(xmlns, 'circle');
        new_point.setAttributeNS(null, "class", id);
        new_point.setAttributeNS(null, "cx", x);
        new_point.setAttributeNS(null, "cy", y);
        new_point.setAttributeNS(null, "r", symbol.value);
        new_point.setAttributeNS(null, "fill", "#333");
        (isUpdate === true) ? collectElements.push(new_point) : document.getElementById("svgFrame").appendChild(new_point);
    } else if (symbol.status == 'extreme') {
        // Draw negative symbol
        var fontSize = 34;
        new_point = document.createElementNS(xmlns, 'text');
        new_point.setAttributeNS(null, "class", id);
        new_point.setAttributeNS(null, "x", x - 15);
        new_point.setAttributeNS(null, "y", y + 1);
        new_point.setAttributeNS(null, "fill", "#333");
        new_point.setAttributeNS(null, 'font-size', fontSize);
        new_point.setAttributeNS(null, 'rotate', 45);
        new_point.innerHTML = symbol.value;
        (isUpdate === true) ? collectElements.push(new_point) : document.getElementById("svgFrame").appendChild(new_point);  
    };
    if (isUpdate === undefined || isUpdate === false) {
        // Cover circle
        new_point = document.createElementNS(xmlns, 'circle');
        new_point.setAttributeNS(null, "id", id);
        new_point.setAttributeNS(null, "class", "point " + id);
        new_point.setAttributeNS(null, "cx", x);
        new_point.setAttributeNS(null, "cy", y);
        new_point.setAttributeNS(null, "r", 14);
        new_point.setAttributeNS(null, "opacity", 0.0);
        new_point.setAttributeNS(null, "cursor", 'pointer');
        document.getElementById("svgFrame").appendChild(new_point);
    } else {
        var coverElement = document.getElementById(id);
        for (var elem in collectElements) {
            document.getElementById("svgFrame").insertBefore(collectElements[elem], coverElement);    
        };
    };
};

function constructJSONPoint(pointId, x, y, clusterId) {
    /**************************************************************
    *   Function   >> constructJSONPoint
    *   Desc       >> construct JSON point representation
    *   Input      >> pointId :: string e.g. BF12, BB8
    *                 x :: float
    *                 y :: float
    *   Output     >> JSON formatted point template
    **************************************************************/
    if (clusterId === undefined || clusterId === null) {
        clusterId = 0;
    };

    var dateObject = new Date();
    var pointTemplate = 
        {"pointId": pointId,
         "x": x,
         "y": y,
         "reactivity": 5,
         "daysSinceLastInjection": "n",
         "unixTimeStamp": 0,
         "localTimeStamp": "n",
         "clusterAffiliation": clusterId,
         "notes": {}
        };
    return pointTemplate;
};

function constructToolTip(language, color, localData, standardId) {
    /**************************************************************
    *   Function   >> constructToolTip
    *   Desc       >> construct ToolTip HTML and place in document
    *   Input      >> language :: 2 letter code e.g. nl, en
    *                 color :: Hex-code color
    *                 localData :: point data object
    *                 standardId :: id for tooltip DIV
    **************************************************************/
    // Create the tooltip from template
    var data = getLanguageData(language);
    
    var determineText = function (humanTime, unixTime) {
        if (humanTime === 'n') {return data['tooltext1']};
        var times = convertTimestampToHuman(unixTime);
        return times;
    };
    var time = determineText(localData.localTimeStamp, localData.unixTimeStamp);

    var toolTipTemplate = [
        '   <div class="box">',
        '       <div class="pain" title="', data['tooltext4'], '"', 
        '           style="background:', color ,';">',
        '           <div>', localData.reactivity, '</div>',
        '       </div>',
        '       <div class="tminus" title="', data['tooltext5'], '">',
        '           <div>', (time.hasOwnProperty('time')) ? time.time : time , '</div>',
        '       </div>',
        '   </div>',
        '   <div class="triangle" style="border-top:20px solid', 
            color, ';"></div>'].join("");
    var newNode = document.createElement('div');
    newNode.setAttribute('id', standardId);
    newNode.setAttribute('style', ['margin:', (localData.y - 880), 'px 0px 0px ', (localData.x - 25), 'px;">'].join(""));
    newNode.innerHTML = toolTipTemplate;
    document.getElementById('pointWindow').appendChild(newNode);
};

function constructNoteWindow(localData, isNoteMode) {
    /**************************************************************
    *   Function   >> constructNoteWindow
    *   Desc       >> construct HTML for note history window
    *   Input      >> localData >> point data object
    **************************************************************/
    var template = ['<div class="header"><div>x</div></div>'];
    
    var notes = [];
    for (var note in localData.notes) {notes.push([localData.notes[note], note])};
    notes.sort(function (note1, note2) { // Custom sort
        if (note1[0].ranking < note2[0].ranking) { return -1 };
        if (note1[0].ranking > note2[0].ranking) { return 1 };
        return 0;
    });
    
    // Note entry
    if (isNoteMode !== true) {
        for (var noteIndex = 0; noteIndex < notes.length; noteIndex++) {
            var title = ['<div class="title">', notes[noteIndex][0].localTimeStamp, '<div class="button warning_button">Delete</div></div>'].join('');
            var msg = ['<div class="note">', notes[noteIndex][0].note, '</div>'].join('');
            template.push.apply(template, ['<div class="note_wrap" name="', notes[noteIndex][1], '">', title, msg, '</div>']);
        };
    };
    
    // Form
    if (isNoteMode === true) {
        var noteForm = ['<div id="noteFormWrap">', 
                        '<textarea id="vlNTXT" maxlength="300"></textarea>', '<div class="button_wrap">', 
                        '<div id="btnSVNT2" class="button add_button">Save</div>', 
                        '<div id="btnCNNT2" class="button">Cancel</div>', 
                        '</div>', '</div>'].join('');
        template.push(noteForm);
    };

    // Add to document
    document.getElementById('noteConfig').innerHTML += template.join('');
    
};

function addSuggestedSitesToHTML(sites, canvasHandle) {
    var temp = [];
    for (site in sites) {
        var template = ['<div class="suggestion">',
                        '<p>', sites[site][2], '</p>',
                        '<p>', sites[site][1], '</p>',
                        '<div class="button" id="', 'remote', sites[site][0], '">Select</div>',
                        '</div>'];
        document.getElementById('suggestionsPanel').innerHTML += template.join('');
        if (canvasHandle.activePoints.hasOwnProperty(sites[site][0])) {
            document.getElementById('remote' + sites[site][0]).addEventListener('click', canvasHandle.activePoints[sites[site][0]].remoteActivation);
        } else {
            // Implement new sub-routine
        };
    };
};

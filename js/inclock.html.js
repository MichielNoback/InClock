/******************************************************************
*   Name:    inclock.html.js 
*   Author:  J. Vuopionpera
*   Date:    6-2015
*   Desc:    Includes HTML constructors for InClock
*            Contains: constructPoint, constructJSONPoint,
*                      constructToolTip, constructDashBoard,
*                      constructNoteWindow
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

function constructJSONPoint(pointId, x, y) {
    /**************************************************************
    *   Function   >> constructJSONPoint
    *   Desc       >> construct JSON point representation
    *   Input      >> pointId :: string e.g. BF12, BB8
    *                 x :: float
    *                 y :: float
    *   Output     >> JSON formatted point template
    **************************************************************/
    var dateObject = new Date();
    var pointTemplate = 
        {"pointId": pointId,
         "x": x,
         "y": y,
         "reactivity": 5,
         "daysSinceLastInjection": "n",
         "unixTimeStamp": dateObject.getTime(),
         "localTimeStamp": "0d:0h:0m",
         "clusterAffiliation": "userDefined",
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

    var determineText = function (time) {
        if (time === '0') {return data['tooltext2']};
        if (time === 'n') {return data['tooltext1']};
        return time;
    } 

    var toolTipTemplate = [
        '   <div class="box">',
        '       <div class="pain" title="', data['tooltext4'], '"', 
        '           style="background:', color ,';">',
        '           <div>', localData.reactivity, '</div>',
        '       </div>',
        '       <div class="tminus" title="', data['tooltext5'], '">',
        '           <div>', determineText(localData.localTimeStamp), '</div>',
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

function constructNoteWindow(localData) {
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
    
    for (var noteIndex = 0; noteIndex < notes.length; noteIndex++) {
        var title = ['<div class="title">', notes[noteIndex][0].localTimeStamp, '<div class="button warning_button">Delete</div></div>'].join('');
        var msg = ['<div class="note">', notes[noteIndex][0].note, '</div>'].join('');
        template.push.apply(template, ['<div class="note_wrap" name="', notes[noteIndex][1], '">', title, msg, '</div>']);
    };
    
    document.getElementById('noteConfig').innerHTML += template.join('');
    
};

function constructDashboard(language, templateToLoad) {
    /**************************************************************
    *   Function   >> constructDashBoard
    *   Desc       >> construct main page HTML
    *   Input      >> language :: 2 letter code e.g. nl, en
    *                 templateToLoad :: path to template image
    **************************************************************/
    // Write HTML for user dashboard
    var data = getLanguageData(language);
    var dt = new Date();
    var template = [
        '<div id="toolbar">',
        '   <div class="bar">',
        '       <div class="logo"><span>InClock </span><sup>Development</sup></div>',
        '       <div id="btnSGOT" class="button"><div>', data['button1'], '</div></div>',
        '   </div>',
        '</div>',
        '<div id="ui_wrap">',
        '   <div id="ui_panel">',
        '       <div class="window">',
        '           <div class="bottom">',
        '               <img id="templateIMG" src="', getTemplateLocation(templateToLoad), '" />',
        '           </div>',
        '           <div id="pointWindow" class="top">',
        '               <svg id="svgFrame" width="600" height="800"></svg>',
        '           </div>',
        '           <div id="noteConfig" class="config_panel"></div>',
        '       </div>',
        '       <div class="control">',
        '           <div class="tile">',
        '               <div class="title">',
        '                   <div>', data['title1'], '</div>',
        '                   <div></div>',
        '               </div>',
        '               <div class="button_wrap">',
        '                   <div class="button" id="btnSWTP">', data['button2'], '</div>',
        '                   <div class="button" id="btnADNP">', data['button3'], '</div>',
        '               </div>',
        '           </div>',
        '           <div id="editPanel" class="tile">',
        '               <div class="title">',
        '                   <div>', data['title2'], '</div>',
        '                   <div></div>',
        '               </div>',
        '               <div class="button_wrap">',
        '                   <div id="btnVWHS" class="button">Notes <span class="info" id="txtHSCT"></span></div>',
        '                   <div id="btnADNT" class="button add_button"> Add note</div>',
        '               </div>',
        '               <div class="pain_wrap">',
        '                   <div class="subtitle">', data['title4'], '</div>',
        '                   <div>',
        '                       <div id="btnNGRT" class="button">-</div>',
        '                       <div id="txtRT" class="value_field">10</div>',
        '                       <div id="btnADRT" class="button">+</div>',
        '                   </div>',
        '               </div>',
        '               <div class="button_wrap">',
        '                  <div id="btnNWIJ" class="button">', data['button5'], '</div>',
        '                   <div id="btnDLPT" class="button warning_button">', data['button6'], '</div>',
        '               </div>',
        '               <div id="notePanel" class="note_wrap">',
        '                   <div class="time_wrap">',
        '                       <div class="subtitle">', data['title5'], '</div>',
        '                       <div class="value_wrap">',
        '                           <input id="vlTDAY" type="text" />',
        '                           <span>/</span>',
        '                           <input id="vlTMON" type="text" />',
        '                           <span>/</span>',
        '                           <input id="vlTYEA" type="text" />',
        '                           <span></span><span></span>',
        '                           <input id="vlTHOU" type="text" />',
        '                           <span class="hour">:</span>',
        '                           <input id="vlTMIN" type="text" />',
        '                       </div>',
        '                   </div>',
        '                   <div class="time_wrap">',
        '                       <div class="subtitle">Optional note</div>',
        '                       <textarea id="vlNMSG" maxlength="140"></textarea>',
        '                       <div id="btnSVNT" class="button add_button">Save</div>',
        '                       <div id="btnCLNT" class="button warning_button">Cancel</div>',
        '                   </div>',
        '               </div>',
        '           </div>',
        '           <div class="tile">',
        '               <div class="title">',
        '                    <div>', data['title3'],  '</div>',
        '                    <div></div>',
        '                </div>',
        '                <div class="suggestion"></div>',
        '            </div>',
        '        </div>',
        '    </div>',
        '</div>',
        '<div id="footer">',
        '    <div class="divider"></div>',
        '    <div class="info">Inclock ( <span>in Development</span> ) &copy; ', dt.getFullYear(), '</div>',
        '</div>'
    ].join("");
    document.body.innerHTML = template;
}
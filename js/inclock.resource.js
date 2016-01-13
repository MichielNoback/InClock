/******************************************************************
*   Name:    inclock.resource.js 
*   Author:  J. Vuopionpera
*   Date:    6-2015
*   Desc:    Includes all resources for for InClock
*            Contains: getLanguageData, getColorScheme, 
*                      getTemplatePrefix, getTemplateLocation

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

function convertTimestampToHuman(unixTime) {
    var currentTime = new Date();
    var timeDelta = (currentTime.getTime() - parseInt(unixTime)) / 1000;
    var days = Math.floor(timeDelta / 86400);  // 24 * 60 * 60
    timeDelta -= days * 86400;
    var hours = Math.floor(timeDelta / 3600);  // 60 * 60
    timeDelta -= hours * 3600;
    var minutes = Math.floor(timeDelta / 60);
    var newTimestamp = [days, 'd:', hours, 'h:', minutes, 'm'].join('');
    return {'time': newTimestamp, 'days': days};
};

function getColorScheme(scheme) {
    /*********************************************************
    *   Function    >> getColorScheme
    *   Input       >> scheme :: template ID e.g. BodyFront
    *   Output      >> list containing 10 point gradient
    *   Desc        >> Store gradients for different color
    *                  schemes
    *********************************************************/
    var color_schemes = {
        // Original InClock Color Scheme : Blue -> Green -> Yellow -> Orange -> Red
        "rainbow": ["#0BE8FF", "#00A7FF", "#008ED9", "#9BFF24", "#BEF417",
                    "#FFE000", "#FFAF00", "#FF4E7E", "#FF1D58", "#FF3624"],
        // Standard Color Scheme : Green -> Yellow -> Orange -> Red
        "greenToRed": ["#9BFF24", "#BEF417", "#E1E90B", "#F5E304", "#FFE000",
                       "#FFAF00", "#FF8300", "#FF7300", "#FF4B17", "#FF3624"],
        // Protan and Deutran Color Schemes : Blue -> Yellow -> Orange -> Red
        "blueToRed": ["#002A40", "#005C8C", "#008ED9", "#00A7FF", "#0BE8FF",
                      "#FFE000", "#FFA400", "#FF7E00", "#FF7300", "#FF3624"],
        // Tritan Color Scheme : Blue -> Pink -> Red
        "blueToPink": ["#002A40", "#005C8C", "#008ED9", "#00A7FF", "#0BE8FF",
                      "#FFC3D8", "#FF88AB", "#FF4E7E", "#FF1D58", "#FF0042"],
        // Achromatopsia Color Scheme : Light Grey -> Black
        "greyscale": ["#E6E6E6", "#CCCCCC", "#B2B2B2", "#999999", "#808080", 
                      "#666666", "#4D4D4D", "#333333", "#191919", "#000000"]
    };
    return color_schemes[scheme];
};

function getTemplatePrefix(templateName) {
    /*********************************************************
    *   Function    >> getTemplatePrefix
    *   Input       >> templateName :: template ID e.g. BodyBack
    *   Output      >> 2 letter code e.g. BF, BB
    *   Desc        >> Store all template prefixes
    *********************************************************/
    var prefixes = {
        "BodyFront": "BF",
        "BodyBack": "BB",
        "ArmsFront": "AF",
        "ArmsBack": "AB"
    };
    return prefixes[templateName];
};  

function rootPlusPath(path) {
    /*********************************************************
    *   Function    >> rootPlusPath
    *   Input       >> path :: relative path to file
    *   Output      >> Full path to file
    *   Desc        >> Convert relative path to full path
    *********************************************************/
    var root = window.location.origin;
    var appFolder = window.EnvironmentConfig.APP_FOLDER;  // Custom sub-directory
    path = root + '/' + appFolder + '/' + path;
    return path;
};

function getTemplateLocation(templateName) {
    /*********************************************************
    *   Function    >> getTemplateLocation
    *   Input       >> templateName :: template ID e.g. BodyBack
    *   Output      >> path to template image
    *   Desc        >> Store all paths to template images
    *********************************************************/
    var templateLocations = {
        'BodyFront': '../img/front.png', 
        'BodyBack': '../img/back.png',
        'ArmsFront': '../img/arms_front.png', 
        'ArmsBack': '../img/arms_back.png'
    };
    return templateLocations[templateName];
};

function getStandardTemplate() {
    /*********************************************************
    *   Function    >> getStandardTemplate
    *   Output      >> standard JSON object
    *   Desc        >> Return basic JSON profile object
    *********************************************************/
    var profile = {
        "user": {
            "dataCorruptionHash": null,
            "language": null,
            "timeZoneOffset": null,
            "templatesUsed": null,
            "colorScheme": null
        }
    };
    return profile;
};

function justifyElements(parent, yOffset) {
    var parentXdim = parseInt(window.getComputedStyle(parent).width);
    var freeSpace = parentXdim;
    var children = parent.children;
    var realChildren = [];
    // Gather children
    for (var child in children) {
        if (children.hasOwnProperty(child)) {
            realChildren.push(children[child]);
        };
    };
    // Filter real children
    for (var child = 0; child < children.length; child++) {
        freeSpace -= realChildren[child].clientWidth;
    };
    var interSpace = Math.floor(freeSpace / children.length / 2);
    var errorMargin = window.getComputedStyle(parent).marginLeft;
    try {
        errorMargin = parseInt(errorMargin) / 2;
    } catch (e) {
        errorMargin = errorMargin.slice(0, errorMargin.left - 1);
        errorMargin = (parseInt(errorMargin) * parentXdim) / 2;
    };
    // Re-position elements
    for (var child = 0; child < children.length; child++) {
        children[child].style.marginLeft = (child === 0) ? (interSpace * 2) - errorMargin : interSpace;
        if (yOffset !== undefined) {children[child].style.marginTop = yOffset;};
    };
};

function getClusterName(clusterId) {
    clusterId = 'cluster' + clusterId;
    var name = window.languageDict['dashboard'][clusterId];
    if (name !== null && name !== undefined) {
        return name;
    };
};

function getLanguageFileLocation(lang) {
    var files = {
        'nl': rootPlusPath('resource/lang/nl.json'),
        'en': rootPlusPath('resource/lang/en.json'),
        'de': rootPlusPath('resource/lang/de.json')
    };
    if (files.hasOwnProperty(lang)) {
        return files[lang];    
    } else {
        return files['en'];    
    };
};

function getPatternCoordinates(patternId) {
    var coordinates = {
        'bodyFront_arms': [[150, 225], [175, 235], [147, 255], [172, 265], [144, 285], [169, 295],
                           [445, 225], [420, 235], [448, 255], [423, 265], [451, 285], [426, 295]],
        'bodyFront_legs': [[185, 600], [220, 620], [260, 640], [188, 650], [223, 670], [263, 690],
                           [188, 700], [218, 720], [248, 740], [330, 640], [365, 620], [405, 600],
                           [333, 690], [368, 670], [408, 650], [348, 740], [378, 720], [408, 700]],
        'bodyFront_outer': [[390, 400], [382, 436], [360, 466], [327, 485], [290, 489], [255, 477],
                            [227, 452], [211, 418], [211, 381], [227, 347], [254, 322], [290, 310],
                            [327, 314], [360, 333], [382, 363]],
        'bodyFront_inner': [[360, 400], [348, 435], [318, 457], [281, 457], [251, 435], [240, 400],
                            [251, 364], [281, 342], [318, 342], [348, 364]],
        'bodyBack_butt': [[340, 600], [380, 600], [420, 600], [340, 570], [380, 570], [420, 570],
                          [340, 540], [380, 540], [420, 540], [285, 600], [245, 600], [205, 600],
                          [285, 570], [245, 570], [205, 570], [285, 540], [245, 540], [205, 540]],
        'bodyBack_legs': [[345, 670], [410, 670], [350, 700], [408, 700], [355, 730], [405, 730],
                          [275, 670], [200, 670], [270, 700], [203, 700], [265, 730], [206, 730]],
        'armsFront_upper': [[435, 110], [480, 110], [430, 150], [475, 150], [425, 190], [470, 190],
                            [425, 230], [465, 230], [150, 110], [105, 110], [155, 150], [110, 150],
                            [160, 190], [115, 190], [165, 230], [120, 230]],
        'armsFront_lower': [[475, 320], [410, 320], [465, 360], [420, 360], [460, 400], [425, 400],
                            [180, 320], [115, 320], [175, 360], [120, 360], [170, 400], [130, 400]],
        'armsBack_upper': [[410, 140], [455, 140], [415, 180], [455, 180], [415, 220], [455, 220],
                           [170, 140], [125, 140], [130, 180], [170, 180], [135, 220], [170, 220]]
    };
    if (coordinates.hasOwnProperty(patternId)) {
        return coordinates[patternId];
    } else {
        return false;
    };
};

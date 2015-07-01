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

function getLanguageData(country) {
    /*********************************************************
    *   Function    >> getLanguageData
    *   Input       >> country :: 2 letter string e.g. nl, en
    *   Output      >> Object containing language data
    *   Desc        >> Store all language specific data
    *********************************************************/
    var language_dict = {
        "nl": {"title1": "Controls",
               "title2": "Injectie punt eigenschappen",
               "title3": "Potenti&euml;le Injectie opties",
               "title4": "Verander de reactiviteit",
               "title5": "Injectie Datum &amp; Tijd",
               "button1": "Opslaan",
               "button2": "Omdraaien",
               "button3": "Punt toevoegen",
               "button4": "Save",
               "button5": "Nieuwe injectie",
               "button6": "Delete punt",
               "button7": "Instellingen",
               "button8": "Cancel",
               "tooltext1": "Nooit",
               "tooltext2": "Vandaag",
               "tooltext3": "Gisteren",
               "tooltext4": "Reactiviteit",
               "tooltext5": "Tijd sinds laatste injectie"},

        "en": {"title1": "Controls",
               "title2": "Injection site properties",
               "title3": "Potential injection sites",
               "title4": "Change the reactivity",
               "title5": "Injection Date &amp; Time",
               "button1": "Save",
               "button2": "Turn around",
               "button3": "Add point",
               "button4": "Save",
               "button5": "New injection",
               "button6": "Delete point",
               "button7": "Settings",
               "button8": "Cancel",
               "tooltext1": "Never",
               "tooltext2": "Today",
               "tooltext3": "Yesterday",
               "tooltext4": "Reactivity",
               "tooltext5": "Time since last injection"}
    };
    return language_dict[country];
};

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

function getLanguageFileLocation(lang) {
    var files = {
        'nl': '../../resource/lang/nl.json',
        'en': '../../resource/lang/en.json',
        'de': '../../resource/lang/de.json'
    };
    if (files.hasOwnProperty(lang)) {
        return files[lang];    
    } else {
        return files['en'];    
    };
};
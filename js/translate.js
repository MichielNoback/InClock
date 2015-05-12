/***********************************************************************
*   Name:   translate.js (part of InClock)                                         
*   Date:   5/2015
*   Desc:   Repository for all language dependend data
*   Author: J. Vuopionpera
***********************************************************************/

function getLanguageData(country) {
    var language_dict = {
        "nl": {"title1": "Controls",
               "title2": "Injectie punt aanpassen",
               "title3": "Potenti&euml;le Injectie opties",
               "button1": "Uitloggen",
               "button2": "Omdraaien",
               "button3": "Punt toevoegen",
               "button4": "Save",
               "button5": "Nieuwe injectie",
               "button6": "Delete punt",
               "tooltext1": "Nooit",
               "tooltext2": "Vandaag",
               "tooltext3": "Gisteren",
               "tooltext4": "Pijn graad",
               "tooltext5": "Laatste injectie"},

        "en": {"title1": "Controls",
               "title2": "Adjust injection site",
               "title3": "Potential injection sites",
               "button1": "Sign Out",
               "button2": "Turn around",
               "button3": "Add point",
               "button4": "Save",
               "button5": "New injection",
               "button6": "Delete point",
               "tooltext1": "Never",
               "tooltext2": "Today",
               "tooltext3": "Yesterday",
               "tooltext4": "Pain grade",
               "tooltext5": "Last injection"}
    };
    return language_dict[country];
}
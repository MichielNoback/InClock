/******************************************************************
*   Name:    inclock.landing.js 
*   Author:  J. Vuopionpera
*   Date:    6-2015
*   Desc:    Handle login and dynamic feedback

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

function HomePageInit() {
    // Check for language specification in url
    var url = window.location.href;
    lang = url.split('?lang=')[1];
    // Load language data
    var fileLoaded = function (response) {
        window.languageDict = response;
        $('.validation_wrap').hide();
        //console.log(window.languageDict);
        replaceVars();
    }
    var loadLanguage = new Comms(fileLoaded);
    loadLanguage.loadLanguageFile(lang);
};

function standardLogin() {
    var username = $("#formType1 input[name='username']").val();
    var userpwd = $("#formType1 input[name='userpwd']").val();
    if (username.length === 0) {
        paintItRed($("#formType1 input[name='username']"), true);
        return;
    };
    if (userpwd.length === 0) {
        paintItRed($("#formType1 input[name='userpwd']"), true);
        return;
    };
    var callBackHandler = function (response) {
        if (response === 'BAD') {
            paintItRed($("#formType1 input[name='userpwd']"), true);   
        };
    };
    var comm = new Comms(callBackHandler);
    comm.standardLogin(username, userpwd);
};

function secureUpload() {
    var filename = $("#formType2 input[name='data']").val();
    var userpwd = $("#formType2 input[name='pwd']").val();
    if (filename.length === 0) {
        paintItRed($("#formType2 input[name='data']"), true);
        return;
    };
    if (userpwd.length === 0) {
        paintItRed($("#formType2 input[name='pwd']"), true);
        return;
    };
    document.getElementById('formType2').submit();
};

function plainUpload() {
    var filename = $("#formType3 input[name='data']").val();
    if (filename.length === 0) {
        paintItRed($("#formType3 input[name='data']"), true);
        return;
    };
    document.getElementById('formType3').submit();
};

function validateUserCode() {
    var userCode = document.getElementById('fldUserCode').value;
        
    var processResult = function (response) {
        if (response.status === 'OK') {
            var comm = new Comms(null);
            comm.loadConfigurator(userCode);
        } else {
            paintItRed(document.getElementById('fldUserCode'), false);
            document.getElementById('fldUserCode').value = 'Invalid Code';
        };
    };
        
    var comm = new Comms(processResult);
    comm.checkUserCode(userCode)
        
};
    
function cancelCode() {
    $('.validation_wrap').slideUp();    
};

function showCodeWindow() {
    $('.validation_wrap').slideDown();
};

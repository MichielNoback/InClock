/******************************************************************
*   Name:    inclock.config.js 
*   Author:  J. Vuopionpera
*   Date:    6-2015
*   Desc:    HTML side validation and dynamic feedback

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

function ProfileConfigInit() {
    /*********************************************************
    *   Function    >> ProfileConfigInit
    *   Desc        >> Construct the profile config page
    *********************************************************/
    document.addEventListener("DOMContentLoaded", function () {

        var start = function() {
            var profile = new ProfileConfigurator();
            profile.init();
        };

        loadConfig(determineLanguageAndLoadFile, start);
    });
};

function snitchPos(event) {
    console.log(event.layerX + ', ' + event.layerY);
};

function addPattern(event, patternId, tempId, clusterId) {
    var currentTemplate = document.getElementById('templateIMG').src.split('/');
    var requiredTemplate = getTemplateLocation(window.templates[tempId - 1]).split('/');
    if (currentTemplate[currentTemplate.length - 1] !== requiredTemplate[requiredTemplate.length - 1]) {
        document.getElementById('btnSWTP').click();
    };
    // Place pattern
    var groupIds = [];
    var coordinates = getPatternCoordinates(patternId);
    if (coordinates !== false) {
        for (index in coordinates) {
            var c = coordinates[index];
            var nid = window.appHandle.canvasHandle.addSimplePoint(c[0], c[1], clusterId);
            groupIds.push(nid);
        };
    };
    event.target.className = 'button';
    event.target.innerHTML = '-';
    event.target.onclick = function(event) {deletePattern(event, groupIds, patternId, tempId)};
};

function deletePattern(event, groupIds, patternId, tempId) {
    window.appHandle.canvasHandle.deleteSimplePoint(groupIds);
    event.target.onclick = function(event) {addPattern(event, patternId, tempId)};
    event.target.className = 'button green_button';
    event.target.innerHTML = '+';
};

function buildColorScheme(scheme) {
    /*********************************************************
    *   Function    >> buildColorScheme
    *   Desc        >> Create color gradient
    *********************************************************/
    var scheme = getColorScheme(scheme);
    for (var color in scheme) {
        document.write('<span class="color_block" style="background:' + scheme[color] + ';"></span>');    
    };
};

function ProfileConfigurator() {
    
    this.userData = {'type': null, 'username': null, 'pwd': null, 'mail': null, 'template': null, 
                     'data': null, 'colorScheme': null, 'timeOffset': 0, 'language': null, 'code': null};
    this.profile = null;
    var self = this;
    
    this.init = function () {
        var elementsToHide = ['fldOption2', 'fldOption2a', 'fldOption3', 'fldOption4', 'fldOption5'];
        for (var elem in elementsToHide) {
            document.getElementById(elementsToHide[elem]).style.display = 'none';    
        };
        var activationCode = document.getElementById('activationCode');
        if (activationCode !== undefined) {self.userData.code = activationCode.innerHTML};
        self.start();
    };
    
    this.start = function () {
        var choiceButtons = ['btnTypeOption1', 'btnTypeOption2', 'btnTypeOption3','btnTypeOption4'];
        
        var makeChoice = function (event) {
            for (var bid in choiceButtons) {
                document.getElementById(choiceButtons[bid]).onclick = '';    
            };
            $('#fldOption1').slideUp();
            switch (event.target.getAttribute('id')) {
                case 'btnTypeOption1':
                    self.userData.type = 1;
                    self.accountSettingsAnonymous();
                    break;
                case 'btnTypeOption2':
                    self.userData.type = 2;
                    self.accountSettingsNormal();
                    break;
                case 'btnTypeOption3':
                    self.userData.type = 3;
                    self.setFilePassword();
                    break;
                case 'btnTypeOption4':
                    self.accountPreferences();
                    break;
            };
        };
        
        for (var bid in choiceButtons) {
            document.getElementById(choiceButtons[bid]).onclick = makeChoice;
        };
    };
    
    this.checkUsername = function (username, callback) {
        var comm = new Comms(callback);
        comm.checkUsernameAgainstDatabase(username);
    };
    
    this.accountSettingsAnonymous = function (isFeedback) {
        var inputDone = function () {
            var username = $("#fldOption2 input[name='newusn']").val();
            var password = $("#fldOption2 input[name='newpwd']").val();
            self.userData.username = username;
            self.userData.pwd = password;
            if (password.length !== 0) {
                paintItGreen($("#fldOption2 input[name='newpwd']"), true);
                self.checkUsername(username, inputContinue);
            } else {
                paintItRed($("#fldOption2 input[name='newpwd']"), true);    
            };
        };
        
        var inputContinue = function (status) {
            if (status.status === 'OK' && self.userData.username.length !== 0) {
                paintItGreen($("#fldOption2 input[name='newusn']"), true);
                if (isFeedback === true) {
                    document.getElementById('btnContinue1').setAttribute('hidden', 'hidden');
                    $("#fldOption2 input[name='newusn']").attr('disabled', 'disabled');
                    $("#fldOption2 input[name='newpwd']").attr('disabled', 'disabled');
                } else {
                    self.accountPreferences();
                };
            } else {
                paintItRed($("#fldOption2 input[name='newusn']"), true);
            };
        };
        
        $('#fldOption2').slideDown();
        $("#fldOption2 input[name='newmail']").parent().hide();
        document.getElementById('btnContinue1').onclick = inputDone;
        if (isFeedback === true) {
            document.getElementById('btnContinue1').removeAttribute('hidden');
            $("#fldOption2 input[name='newusn']").removeAttr('disabled');
            $("#fldOption2 input[name='newpwd']").removeAttr('disabled');
            inputDone();
        };
    };
    
    this.accountSettingsNormal = function (isFeedback) {
        var inputDone = function () {
            var username = $("#fldOption2 input[name='newusn']").val();
            var password = $("#fldOption2 input[name='newpwd']").val();
            var email = $("#fldOption2 input[name='newmail']").val();
            self.userData.username = username;
            self.userData.pwd = password;
            self.userData.mail = email;
            if (password.length !== 0) {
                paintItGreen($("#fldOption2 input[name='newpwd']"), true);
                self.checkUsername(username, inputContinue);
            } else {
                paintItRed($("#fldOption2 input[name='newpwd']"), true);       
            };
        };
        
        var inputContinue = function (status) {
            if (status.status === 'OK' && self.userData.username.length !== 0) {
                paintItGreen($("#fldOption2 input[name='newusn']"), true);
                if (validateEmail(self.userData.mail) === true) {
                    paintItGreen($("#fldOption2 input[name='newmail']"), true);
                    if (isFeedback === true) {
                        document.getElementById('btnContinue1').setAttribute('hidden', 'hidden');
                        $("#fldOption2 input[name='newusn']").attr('disabled', 'disabled');
                        $("#fldOption2 input[name='newpwd']").attr('disabled', 'disabled');
                        $("#fldOption2 input[name='newmail']").attr('disabled', 'disabled');
                    } else {
                        self.accountPreferences();
                    };
                } else {
                    paintItRed($("#fldOption2 input[name='newmail']"), true);    
                };
            } else {
                paintItRed($("#fldOption2 input[name='newusn']"), true);   
            };
        };
        
        var validateEmail = function (email) {
            var re = /\S+@\S+/;
            return re.test(email);
        };
        
        $('#fldOption2').slideDown(); 
        document.getElementById('btnContinue1').onclick = inputDone;
        if (isFeedback === true) {
            document.getElementById('btnContinue1').removeAttribute('hidden');
            $("#fldOption2 input[name='newusn']").removeAttr('disabled');
            $("#fldOption2 input[name='newpwd']").removeAttr('disabled');
            $("#fldOption2 input[name='newmail']").removeAttr('disabled');
            inputDone();
        };
    };
    
    this.setFilePassword = function () {
        var inputDone = function () {
            document.getElementById('btnContinue1').onclick = '';
            var password = $("#fldOption2 input[name='newpwd']").val();
            if (password.length === 0) {
                paintItRed(document.getElementById('btnContinue1'));
                return;
            };
            self.userData.pwd = password;
            self.accountPreferences();
        };
        
        $('#fldOption2').slideDown();
        $("#fldOption2 input[name='newusn']").parent().hide();
        $("#fldOption2 input[name='newmail']").parent().hide();
        document.getElementById('btnContinue1').onclick = inputDone;
    };
    
    this.accountPreferences = function () {
        document.getElementById('btnContinue1').setAttribute('hidden', 'hidden');
        $("#fldOption2 input[name='newusn']").attr('disabled', 'disabled');
        $("#fldOption2 input[name='newpwd']").attr('disabled', 'disabled');
        $("#fldOption2 input[name='newmail']").attr('disabled', 'disabled');
        $('#fldOption2a').slideDown();
        // Deal with timezone settings
        var currentOffset = 0;
        
        var getTimeZone = function() {
            var offset = new Date().getTimezoneOffset();
            offset = Math.floor(offset/60); // Adjust for weird offsets + convert to hours
            // Check for Safari
            if (/Apple/.test(navigator.vendor)){
                var zone = '?';
            } else {
                var zone = Intl.DateTimeFormat().resolved.timeZone;
            };
            currentOffset = offset;
            var zoneText = languageDict['config']['subtitle14'];
            return [zoneText[0], zone, zoneText[1], offset, zoneText[2]].join(' ');
        };

        var addOne = function () {
            currentOffset += 1;
            document.getElementById('btnDecrease').nextElementSibling.innerHTML = currentOffset;
        };
        
        var subOne = function () {
            currentOffset -= 1;
            document.getElementById('btnDecrease').nextElementSibling.innerHTML = currentOffset;    
        };
        
        var inputDone = function () {
            self.userData.colorScheme = $("#fldOption2a input[name='colorScheme']:checked").val();
            self.userData.language = $("#fldOption2a input[name='lang']:checked").val();
            self.userData.timeOffset = document.getElementById('btnDecrease').nextElementSibling.innerHTML;
            self.chooseTemplate();
        };
        
        document.getElementById('timeZoneDetect').innerHTML = getTimeZone();
        document.getElementById('btnIncrease').onclick = addOne;
        document.getElementById('btnDecrease').onclick = subOne;
        document.getElementById('btnContinue2').onclick = inputDone;
        document.getElementById('btnDecrease').nextElementSibling.innerHTML = currentOffset;
        
    };
    
    this.chooseTemplate = function () {
        $('#fldOption2a').slideUp();
        $('#fldOption3').slideDown();
        
        var inputContinue = function (event) {
            switch (event.target.getAttribute('id')) {
                case 'btnTemplate1':
                    self.userData.template = ['BodyFront', 'BodyBack'];
                    break;
                case 'btnTemplate2':
                    self.userData.template = ['ArmsFront', 'ArmsBack'];
                    break;
            };
            self.startBuilder();
        };
        
        document.getElementById('btnTemplate1').onclick = inputContinue;
        document.getElementById('btnTemplate2').onclick = inputContinue;
    };
    
    this.startBuilder = function () {
        $('#fldOption3').slideUp();
        $('#fldOption4').slideDown();
        
        // Standard template
        var profile = getStandardTemplate();
        profile.user.dataCorruptionHash = '';
        profile.user.language = self.userData.language;
        profile.user.timeZoneOffset = self.userData.timeOffset;
        profile.user.templatesUsed = self.userData.template;
        profile.user.colorScheme = self.userData.colorScheme;
        profile[self.userData.template[0]] = {};
        profile[self.userData.template[1]] = {};
        
        self.profile = profile;

        // Hide irrelevant options
        if (profile.user.templatesUsed[0] === 'BodyFront') {
            document.getElementById('arms_front_set').style.display = 'none';
            document.getElementById('arms_back_set').style.display = 'none';
        } else {
            document.getElementById('body_front_set').style.display = 'none';
            document.getElementById('body_back_set').style.display = 'none';
        };

        var app = new AppConstructor();
        app.init(self.profile, 'config');
        window.appHandle = app;
        window.templates = profile.user.templatesUsed;
        self.completeProfile(profile);
    };
    
    this.completeProfile = function (profile) {
        $('#fldOption5').slideDown();
        
        var serverStatus = function (status) {
            switch (status.status) {
                case 'OK':
                    var comm = new Comms();
                    window.location = comm.HOMEPAGE;
                case 'BAD NAME':
                    if (self.userData.type === 2) {
                        self.accountSettingsNormal(true);
                    } else {
                        self.accountSettingsAnonymous(true);    
                    };
                    break;
            };
        };
        
        var complete = function () {
            if (self.userData.type === 1 || self.userData.type === 2) {
                var comms = new Comms(serverStatus);
                comms.registerNewUser(profile, self.userData.username, self.userData.pwd, 
                                      self.userData.type, self.userData.mail, self.userData.code);
            } else {
                var comms = new Comms(null);
                if (self.userData.type === 3) {
                    comms.newSecureFile(profile, self.userData.pwd, self.userData.code);
                } else {
                    comms.newPlainFile(profile, self.userData.code);
                };
            };
            //document.getElementById('btnComplete').onclick = '';
        };
        
        document.getElementById('btnComplete').onclick = complete;
    };
    
};

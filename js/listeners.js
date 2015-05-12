/***********************************************************************
*   Name:   listeners.js (part of InClock)                                         
*   Date:   5/2015
*   Desc:   Contains all event listeners and constructs the data 
            hierarchy used for data manipulation.
*   Author: J. Vuopionpera
*   
*   Dependencies: comms.js, pointer.js, translate.js
***********************************************************************/

// Globals
var LANGUAGE_DATA = null;

$(document).ready(function (){
    /*******************************************************************
    * Function :: main
    * Desc     -> Handles the hierarchy setup and Top-level classes  
    *******************************************************************/
    // Retrieve user data
    var userdata = new UserData(); 
    var server_status = userdata.getFromTest();
    server_status.done(function (data) {
        // Start contruction
        LANGUAGE_DATA = getLanguageData(data['user'].language);
        makeTemplate();
        userdata.data = data;
        var dashboard = new DashBoard(userdata);
        var supervisor = new SuperListener(dashboard);
        supervisor.init();
    });
});

function makeTemplate() {
     /***************************************************************
     * Function :: makeTemplate
     * Desc     -> Create Dashboard HTML
     ***************************************************************/
    
    var data = LANGUAGE_DATA;
    var dt = new Date();
    var template = [
        '<div id="toolbar">',
        '   <div class="bar">',
        '       <div class="logo"><span>InClock </span><sup>Development</sup></div>',
        '       <div class="button button_signout"><div>', data['button1'], '</div></div>',
        '   </div>',
        '</div>',
        '<div id="ui_wrap">',
        '   <div id="ui_panel">',
        '       <div class="window">',
        '           <div class="bottom">',
        '               <img id="templateIMG" src="../img/front.png" />',
        '           </div>',
        '           <div class="top">',
        '               <svg id="svg_frame" width="600" height="800"></svg>',
        '           </div>',
        '       </div>',
        '       <div class="control">',
        '           <div class="move">',
        '               <div class="title">',
        '                   <div>', data['title1'], '</div>',
        '                   <div></div>',
        '               </div>',
        '               <div class="button first_button" id="switch">',
        '                   <div>', data['button2'], '</div>',
        '               </div>',
        '               <div class="button" id="addnewpoint">',
        '                   <div>', data['button3'], '</div>',
        '               </div>',
        '           </div>',
        '           <div class="edit">',
        '               <div class="title">',
        '                   <div>', data['title2'], '</div>',
        '                   <div></div>',
        '               </div>',
        '               <div class="pain_wrap">',
        '                   <div class="button button_neg">-</div>',
        '                   <div class="value_field"></div>',
        '                   <div class="button button_add">+</div>',
        '                   <div class="button button_save">', data['button4'], '</div>',
        '               </div>',
        '               <div class="other">',
        '                  <div class="button button_new">', data['button5'], '</div>',
        '                   <div class="button warning_button button_delete">', data['button6'], '</div>',
        '               </div>',
        '           </div>',
        '           <div class="advice">',
        '               <div class="title">',
        '                    <div>', data['title3'], '</div>',
        '                    <div></div>',
        '                </div>',
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
};

/***********************************************************************
* Class :: DashBoard
* Desc  -> Handle SVG template changes
* Input -> userdata [object] :: IO Class handle containting all JSON
***********************************************************************/
function DashBoard(userdata) {

    this.TEMPLATE_IMG = {'B1': '../img/front.png', 'B2': '../img/back.png',
                         'A1': '../img/arms_front.png', 'A2': '../img/arms_back.png'};
    
    this.session = userdata;
    this.data = userdata.data;
    this.tid = 0;
    this.templates = this.data.user.template_types;
    this.points = {};
    
    this.init = function () {
        /***************************************************************
		 * Function :: init()
		 * Desc     -> Spawn SVGObjects class for current template
		 **************************************************************/
        this.updateStatus();
        document.getElementById('templateIMG').src = this.TEMPLATE_IMG[this.templates[this.tid]];
        this.points = new SVGObjects();
        this.points.templateId = this.templates[this.tid];
        this.points.make(this.data[this.templates[this.tid]]);
    };
    
    this.updateStatus = function () {
        /***************************************************************
		 * Function :: updateStatus()
		 * Desc     -> Update point statusses based on timestamps
		 **************************************************************/
        var points = this.data[this.templates[this.tid]];
        for (var key in points) {
            var dt = new Date(new Date().getTime());
            // Calculate hours passed since injection
            dt = dt - new Date(points[key].timestamp);
            dt = Math.round(dt / (24*60*60*1000));
            if (points[key].status === 'n') { dt = 'n'; };
            this.data[this.templates[this.tid]][key].status = dt;
        };
    };
    
    this.switchTemplate = function () {
        /***************************************************************
		 * Function :: switchTemplate()
		 * Desc     -> Re-initiate the SVG for new template
		 **************************************************************/
        this.points.destroy_all();
        (this.tid === (this.templates.length - 1)) ? this.tid-- : this.tid++;
        this.init();
    };
    
    this.updatePoints = function (new_points) {
        /***************************************************************
		 * Function :: updatePoints()
		 * Desc     -> Check template point data with master
         * Input    -> new_points [object] :: SVGObjects object
		 **************************************************************/
        var new_points = new_points.point_tracker
        // Iterate points in master
        for (var key in this.data[this.templates[this.tid]]) {
            if (new_points[key] !== undefined) {
                for (prop in new_points[key].data){
                    // Set template values as master values
                    this.data[this.templates[this.tid]][key][prop] = new_points[key].data[prop];
                }
            } else {
                // Delete from master
                delete this.data[this.templates[this.tid]][key];
            }
        };
        // Iterate points in template, check for new points
        for (var key in new_points) {
            if (this.data[this.templates[this.tid]][key] === undefined) {
                var np = new_points[key].data;
                var dt = new Date();
                np.timestamp = dt.getTime();  // Store Unix time
                this.data[this.templates[this.tid]][key] = np;
            }
        }
    };
    
};

/***********************************************************************
* Class :: SuperListener
* Desc  -> Top-Level event listener
* Input -> dashboard [object] :: DashBoard class
***********************************************************************/
function SuperListener(dashboard) {
    
    this.dashboard = dashboard;
    this.dashboard.init();
    this.tempListener = null;
    
    this.init = function () {
        /***************************************************************
		 * Function :: init()
		 * Desc     -> Initiate first template
		 **************************************************************/
        this.tempListener = new TemplateListeners();
        this.tempListener.points = this.dashboard.points;
        this.tempListener.monitor();
        this.monitor();
    };
    
    this.monitor = function (dashboard) {
        /***************************************************************
		 * Function :: monitor()
		 * Desc     -> High-level event handlers
		 **************************************************************/
        var self = this;
        $("#switch").click(function () {
            self.dashboard.updatePoints(self.tempListener.points);
            self.dashboard.switchTemplate();
            self.tempListener.points = self.dashboard.points;
        });
        $(".button_signout").one('click', function () {
            self.dashboard.updatePoints(self.tempListener.points);
            self.dashboard.session.saveToTest(self.dashboard.data);
        });
    }
};

/***********************************************************************
* Class :: TemplateListener
* Desc  -> Handle all low-level template based event handlers
***********************************************************************/
function TemplateListeners() {
    
    this.points = null;
    
    this.monitor = function () {
        /***************************************************************
		 * Function :: monitor()
		 * Desc     -> Low-level event handlers
		 **************************************************************/
        var self = this;
        $("#ui_panel .edit").hide();

        // Control triggers
        $('#addnewpoint').click(function () {
            // Change style
            $('#ui_panel .bottom').css('background', 'rgba(245, 245, 245, 0.4)');
            $('#ui_panel .top').css('cursor', 'crosshair');
            $('#ui_panel .top').attr('id', 'activedropsite');
            // Listen for click
            $('#activedropsite').one("click", function (e) {
                // Calculate click position
                var pointX = e.pageX - $(this).position().left;
                var pointY = e.pageY - $(this).position().top + 800; // compensate for SVG
                self.points.add(pointX, pointY);
                $('#ui_panel .bottom').css('background', 'none');
                $('#ui_panel .top').css('cursor', 'default');
                $('#activedropsite').attr('id', '');
            });
        });

        // Tooltip triggers
        var tooltip = null;
        var pointId = null;
        $('svg').on( "click", 'circle.point', function () {
            pointId = $(this).attr("id")
            tooltip = new ToolTip(self.points.point_tracker[pointId]);
            tooltip.place();
            // Listen for tooltip triggers
            $('#tooltip .box').click(function () {
                tooltip.reset();       
            });
            $('#switch').click(function () {
                tooltip.reset();
            });
            // Change the pain value
            // Pain scale boundaries are between 1 and 10
            var pain = self.points.point_tracker[pointId].data.pain;
            $("#ui_panel .value_field").html(pain);  
            $('#ui_panel .button_neg').click(function () {
                if (pain > 1) {
                    pain -= 1;
                    $("#ui_panel .value_field").html(pain);
                }
            });
            $('#ui_panel .button_add').click(function () {
                if (pain < 10) {
                    pain += 1;
                    $("#ui_panel .value_field").html(pain);
                }
            });
            // Save new pain value
            $('#ui_panel .button_save').click(function () {
                self.points.point_tracker[pointId].data.pain = pain;
                tooltip.reset();
            });
            // Delete a point
            $('#ui_panel .button_delete').one("click", function () {
                tooltip.reset();
                self.points.destroy_one(self.points.point_tracker[pointId]);
                delete self.points.point_tracker[pointId];
            });
            // Add injection
            $('.button_new').one('click', function () {
                self.points.point_tracker[pointId].inject();    
            });
        });
    }
};
/***********************************************************************
*   Name:   pointer.js (part of InClock)                                         
*   Date:   5/2015
*   Desc:   Contains all methods and classes related to the pointer 
            objects and Tooltips
*   Author: J. Vuopionpera
*
*   Dependencies: comms.js, listeners.js, translate.js
***********************************************************************/

/***********************************************************************
* Class :: Pointer
* Desc  -> Simple object for creating and manipulating point objects.
* Input -> data [object] :: simple point data object
***********************************************************************/
function Pointer(data) {
    
    this.data = data;
    
    this.place = function () {
		/***************************************************************
		 * Function :: place()
		 * Desc     -> Create a SVG point construction
		 **************************************************************/
        // Draw new points
        var xmlns = 'http://www.w3.org/2000/svg';
        // Color ring circle
        var new_point = document.createElementNS(xmlns, 'circle');
        new_point.setAttributeNS(null, "id", '0pr' + this.data.id);
        new_point.setAttributeNS(null, "cx", this.data.x);
        new_point.setAttributeNS(null, "cy", this.data.y);
        new_point.setAttributeNS(null, "r", 10);
        new_point.setAttributeNS(null, "stroke", this.color());
        new_point.setAttributeNS(null, "stroke-width", 5);
        new_point.setAttributeNS(null, "fill", "#FFF");
        document.getElementById("svg_frame").appendChild(new_point);
        // Center dot
        new_point = document.createElementNS(xmlns, 'circle');
        new_point.setAttributeNS(null, "id", '1pr' + this.data.id);
        new_point.setAttributeNS(null, "cx", this.data.x);
        new_point.setAttributeNS(null, "cy", this.data.y);
        new_point.setAttributeNS(null, "r", 5);
        new_point.setAttributeNS(null, "fill", "#333");
        document.getElementById("svg_frame").appendChild(new_point);
        // Cover circle
        new_point = document.createElementNS(xmlns, 'circle');
        new_point.setAttributeNS(null, "class", "point");
        new_point.setAttributeNS(null, "id", this.data.id);
        new_point.setAttributeNS(null, "cx", this.data.x);
        new_point.setAttributeNS(null, "cy", this.data.y);
        new_point.setAttributeNS(null, "r", 14);
        new_point.setAttributeNS(null, "opacity", 0.0);
        new_point.setAttributeNS(null, "cursor", 'pointer');
        document.getElementById("svg_frame").appendChild(new_point);
    };
    
    this.color = function () {
		/***************************************************************
		 * Function :: color()
		 * Desc     -> determine status color
		 * Out      -> An RGB color in HEX format
		 **************************************************************/
        // Needs proper determination
        var colors = ['#FF3624', '#FF7300', '#FFE000', '#9BFF24'];
        var days = parseInt(this.data.status);
        if (days <= 3) { return colors[0] };
        if (days <= 5) { return colors[1] };
        if (days <= 7) { return colors[2] };
        return colors[3];
    };
    
    this.update = function (point_property, value) {
		/***************************************************************
		 * Function :: update()
		 * Desc     -> update a point data property
		 * Input    -> point_property [string] :: property key
		 *             value [string | int] :: new value
		 **************************************************************/
        if (data.hasAttribute(point_property)) {
            this.data[point_property] = value;
            this.place();
        }
    };
    
    this.destroy = function () {
		/***************************************************************
		 * Function :: destroy()
		 * Desc     -> Remove a point from the SVG
		 **************************************************************/
        var nodeNames = [this.data.id, '0pr' + this.data.id, '1pr' + this.data.id];
        for (var i = 0; i < nodeNames.length; i++) {
            var point = document.getElementById(nodeNames[i]);
            document.getElementById("svg_frame").removeChild(point);
        }
	};
    
    this.inject = function () {
        /***************************************************************
		 * Function :: inject()
		 * Desc     -> Register an injection
		 **************************************************************/
        this.data.status = 0;
        var dt = new Date();
        this.data.timestamp = dt.getTime();
        this.destroy();
        this.place();
    };
    
};

/***********************************************************************
* Class :: SVGObjects
* Desc  -> Create and track point objects
***********************************************************************/
function SVGObjects() {
	
    this.DEFAULT_PAIN_VALUE = 5;
    this.DEFAULT_STATUS = 'n';
    this.templateId = null;
	this.point_tracker = {};
	
	this.make = function (points) {
		// Make test points
		for (var k in points) {
			point = new Pointer(points[k]);
            point.place();
            this.point_tracker[k] = point;
		};
	};
    
    this.getNewKey = function () {
        /***************************************************************
		 * Function :: getNewKey()
		 * Desc     -> Generate a new ID relative for template point
         * Out      -> new id [string]
		 **************************************************************/
        var keys = [];
        for (var key in this.point_tracker) { keys.push(key) };
        // Check if template is empty
        if (keys.length === 0) { return [this.templateId, 'P', 0].join(''); };
        // Find max key
        var maxN = keys[0].split('P'); maxN = parseInt(maxN[maxN.length - 1]);
        for (var key in keys) {
            // Extract numeral from ID
            var n = keys[key].split('P'); n = parseInt(n[n.length - 1]);
            if (n > maxN) { maxN = n; };
        };
        return [this.templateId, 'P', maxN + 1].join('');
    };
	
	this.add = function (x, y) {
		/***************************************************************
		 * Function :: add()
		 * Desc     -> Add a new data point
		 * Input    -> pid [string] :: key value
		 * 			-> x [float] :: x-coordinate
		 *          -> y [float] :: y-coordinate
		 *          -> ps [int] :: pain rating 
		 **************************************************************/
		var point = {};
		point.id = this.getNewKey();
		point.x = x;
		point.y = y;
		point.pain = this.DEFAULT_PAIN_VALUE;
		point.status = this.DEFAULT_STATUS;
		point = new Pointer(point);
		point.place();
		this.point_tracker[point.data.id] = point;
	};
	
	this.destroy_one = function (point) {
		/***************************************************************
		 * Function :: destroy_one()
		 * Desc     -> Remove a points from SVG
		 * Input    -> point [Pointer] :: Pointer object
		 **************************************************************/
		point.destroy();
		delete this.point_tracker[point.id];
	};
	
	this.destroy_all = function () {
		/***************************************************************
		 * Function :: destroy_all()
		 * Desc     -> Remove all points from SVG
		 **************************************************************/
		 for (var k in this.point_tracker) {
			 this.destroy_one(this.point_tracker[k]);
		 }
	};
	
};

/***********************************************************************
* Class :: ToolTip
* Desc  -> Spawn and manipulate the tooltip
***********************************************************************/
function ToolTip(point) {

	this.point = point;
    this.element_id = "tooltip";
	
	this.place = function () {
        /***************************************************************
		 * Function :: place()
		 * Desc     -> Spawn a Tooltip at a point location
		 **************************************************************/
        this.reset('place');
        // Create the tooltip from template
        var tooltip_template = [
            '<div id="', this.element_id ,'" ',
            ['style="margin:', (point.data.y - 880), 'px 0px 0px ', (point.data.x - 25), 'px;">'].join(""),
            '   <div class="box">',
            '       <div class="pain" title="', LANGUAGE_DATA['tooltext4'], '"', 
            '           style="background:', this.get_color(point.data.pain) ,';">',
            '           <div>', point.data.pain, '</div>',
            '       </div>',
            '       <div class="tminus" title="', LANGUAGE_DATA['tooltext5'], '">',
            '           <div>', this.status(point.data.status), '</div>',
            '       </div>',
            '   </div>',
            '   <div class="triangle" style="border-top:20px solid', 
                this.get_color(point.data.pain) ,';"></div>',
            '</div>'].join("");

		$("#ui_panel .top").append(tooltip_template);
        // Reveal options window
        if (!$("#ui_panel .edit").is(':visible')) { $("#ui_panel .edit").slideDown() };
	};
	
    this.status = function (status) {
        /***************************************************************
		 * Function :: status()
		 * Desc     -> Get a status based on days passed
         * Input    -> status [int | string] :: days passed | none
         * Out      -> string
		 **************************************************************/
        if (status !== 'none' && status > 1) { 
            // Derive user date from GMT time
            var offset = new Date().getTimezoneOffset();
            if (offset < 0) { 
                offset = Math.abs(offset * 60000); 
            } else { 
                offset = offset * 60000; 
            };
            var userDate = new Date(point.data.timestamp + offset);
            userDate = [userDate.getUTCDate(), userDate.getUTCMonth() + 1, userDate.getUTCFullYear()];
            return userDate.join("/");
        };
        if (status === 0) { return LANGUAGE_DATA['tooltext1'] };    
        if (status === 1) { return LANGUAGE_DATA['tooltext2'] };
        return LANGUAGE_DATA['tooltext1']
    };
    
    this.get_color = function (pain) {
        /***************************************************************
		 * Function :: get_color()
		 * Desc     -> Get a HEX color for a pain value
         * Input    -> pain [int] :: pain value
         * Out      -> HEX color as string
		 **************************************************************/
        var colors = ['#FF3624', '#FF7300', '#FFE000', '#9BFF24'];
        if (pain <= 4) { return colors[3] };
        if (pain <= 6) { return colors[2] };
        if (pain <= 8) { return colors[1] };
        return colors[0];
    };

	this.reset = function (eventType) {
		var tool = document.getElementById(this.element_id);
        if (tool !== null) {
            tool.parentNode.removeChild(tool);
            if (eventType === 'place') { return };
            if ($("#ui_panel .edit")) { $("#ui_panel .edit").slideUp() };
        };
	};
};
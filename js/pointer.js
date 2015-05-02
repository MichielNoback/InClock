/***********************************************************************
*   Name:   pointer.js (part of InClock)                                         
*   Date:   5/2015
*   Desc:   Contains all methods and classes related to the pointer 
            objects and Tooltips
*   Author: J. Vuopionpera
***********************************************************************/

/***********************************************************************
* Class :: Pointer
* Desc  -> Simple object for creating and manipulating point objects.
* Input -> data [object] :: simple point data object
* 		   pageHandle [object] :: jQuery handle  
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
        return colors[3]
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
        var nodeNames = [this.data.id, '0pr'+this.data.id, '1pr'+this.data.id];
        for (var i = 0; i < nodeNames.length; i++) {
            var point = document.getElementById(nodeNames[i]);
            document.getElementById("svg_frame").removeChild(point);
        }
	};
    
};

/***********************************************************************
* Class :: SVGObjects
* Desc  -> Create and track point objects
***********************************************************************/
function SVGObjects() {
	
    this.maxId = 6;
	this.point_tracker = {};
	
	this.test = function () {
		// Make test points
        
		var points = [{'id': 'p1', 'x': 200, 'y': 600, 'status': 5, 'pain': 7}, 
                      {'id': 'p2', 'x': 200, 'y': 500, 'status': 11, 'pain': 3}, 
                      {'id': 'p3', 'x': 300, 'y': 450, 'status': 22, 'pain': 5}, 
                      {'id': 'p4', 'x': 367, 'y': 423, 'status': 7, 'pain': 9}, 
                      {'id': 'p5', 'x': 345, 'y': 402, 'status': 0, 'pain': 6}, 
                      {'id': 'p6', 'x': 480, 'y': 280, 'status': 3, 'pain': 2}];
        
		for (var k in points) {
			this.add(points[k].id, points[k].x, points[k].y, points[k].pain, points[k].status);
		};
	};
	
	this.add = function (pid, x, y, ps, status) {
		/***************************************************************
		 * Function :: add()
		 * Desc     -> Add a new data point
		 * Input    -> pid [string] :: key value
		 * 			-> x [float] :: x-coordinate
		 *          -> y [float] :: y-coordinate
		 *          -> ps [int] :: pain rating 
		 **************************************************************/
		var point = {};
		point.id = pid;
		point.x = x;
		point.y = y;
		point.pain = ps;
		point.status = status;
		point = new Pointer(point);
		point.place();
		this.point_tracker[pid] = point;
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
		this.reset();
        // Create the tooltip from template
        var tooltip_template = [
            '<div id="', this.element_id ,'" ',
            ['style="margin:', (point.data.y - 880), 'px 0px 0px ', (point.data.x - 25), 'px;">'].join(""),
            '   <div class="box">',
            '       <div class="pain" style="background:', this.get_color(point.data.pain) ,';">',
            '           <div>', point.data.pain, '</div>',
            '       </div>',
            '       <div class="tminus">',
            '           <div>', this.status(point.data.status), '</div>',
            '       </div>',
            '   </div>',
            '   <div class="triangle" style="border-top:20px solid', 
                this.get_color(point.data.pain) ,';"></div>',
            '</div>'].join("");

		$("#ui_panel .top").append(tooltip_template);
        // Reveal options window
        $("#ui_panel .edit").slideDown();
	};
	
    this.status = function (status) {
        /***************************************************************
		 * Function :: status()
		 * Desc     -> Get a status based on days passed
         * Input    -> status [int | string] :: days passed | none
         * Out      -> string
		 **************************************************************/
        if (status !== 'none' && status > 1) { return ['&plusmn; ' + point.data.status + ' d'].join("") };
        if (status === 0) { return 'Vandaag' };    
        if (status === 1) { return 'Gisteren' };
        return 'Nooit'
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

	this.reset = function () {
		var tool = document.getElementById(this.element_id);
        if (tool !== null) {
            tool.parentNode.removeChild(tool);
            $("#ui_panel .edit").slideUp();
        };
	};
};
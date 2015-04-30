/***********************************************************************
*   Name:   pointer.js (part of InClock)                                         
*   Date:   5/2015
*   Desc:   Contains all methods and classes
*           related to the pointer objects
*   Author: J. Vuopionpera
***********************************************************************/

/***********************************************************************
* Class :: Pointer
* Desc  -> Simple object for creating and manipulating point objects.
* Input -> data [object] :: simple point data object
* 		   pageHandle [object] :: jQuery handle  
***********************************************************************/
function Pointer(data, pageHandle) {
    
    this.data = data;
    this.handle = pageHandle;
    
    this.place = function () {
		/***************************************************************
		 * Function :: place()
		 * Desc     -> Create a SVG point construction
		 **************************************************************/
        // Draw new points
        var xmlns = 'http://www.w3.org/2000/svg';
        // Color ring circle
        var new_point = document.createElementNS(xmlns, 'circle');
        new_point.setAttributeNS(null, "cx", data.x);
        new_point.setAttributeNS(null, "cy", data.y);
        new_point.setAttributeNS(null, "r", 10);
        new_point.setAttributeNS(null, "stroke", this.color());
        new_point.setAttributeNS(null, "stroke-width", 5);
        new_point.setAttributeNS(null, "fill", "#FFF");
        document.getElementById("svg_frame").appendChild(new_point);
        // Center dot
        new_point = document.createElementNS(xmlns, 'circle');
        new_point.setAttributeNS(null, "cx", data.x);
        new_point.setAttributeNS(null, "cy", data.y);
        new_point.setAttributeNS(null, "r", 5);
        new_point.setAttributeNS(null, "fill", "#333");
        document.getElementById("svg_frame").appendChild(new_point);
        // Cover circle
        new_point = document.createElementNS(xmlns, 'circle');
        new_point.setAttributeNS(null, "class", 'point');
        new_point.setAttributeNS(null, "id", data.id);
        new_point.setAttributeNS(null, "cx", data.x);
        new_point.setAttributeNS(null, "cy", data.y);
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
        var colors = ['red', 'orange', 'green'];
        return colors[parseInt(data.status) - 1];
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
    
};

/***********************************************************************
* Class :: SVGObjects
* Desc  -> Create and track point objects
***********************************************************************/
function SVGObjects() {
	
	this.point_tracker = {};
	
	this.test = function () {
		// Make test points
		var handle = $('#ui_panel svg');
		var points = [{'id': 'p1', 'x': 200, 'y': 600, 'status': 1}, {'id': 'p2', 'x': 200, 'y': 500, 'status': 2}, {'id': 'p3', 'x': 300, 'y': 450, 'status': 1}, {'id': 'p4', 'x': 367, 'y': 423, 'status': 3}, {'id': 'p5', 'x': 345, 'y': 402, 'status': 3}, {'id': 'p6', 'x': 480, 'y': 280, 'status': 3}];
		for (var k in points) {
			var _p = new Pointer(points[k], handle);
			_p.place();
			this.point_tracker[_p.data.id] = _p;
		};
	};
	
};

function ToolTip(point) {

	this.point = point;
	
	this.place = function () {
		this.reset();
		var html = '<div class="tooltip" style="margin:' + (point.data.y - 880) + 'px 0px 0px ' + 
				   (point.data.x - 25) + 'px;"><div class="box"><div class="pain"><span>Pijn</span>'+
				   '<div>?</div></div><div class="tminus">' + '<span>Dagen</span><div>' + point.data.status + 
				   '</div></div><div class="recommendation"></div><div class="controls"></div></div>' +
				   '<div class="triangle"></div></div>';
		$("#ui_panel .top").append(html);
	};
	
	this.reset = function () {
		$('.tooltip').remove();
	};
};

$(document).ready(function (){
	// Setup SVG 
    var points = new SVGObjects();
    points.test();
    // Listen for point triggers
    $('.point').click(function () {
		tooltip = new ToolTip(points.point_tracker[$(this).attr("id")]);
		tooltip.place();
	});
});

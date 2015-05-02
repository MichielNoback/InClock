/***********************************************************************
*   Name:   listeners.js (part of InClock)                                         
*   Date:   5/2015
*   Desc:   Contains all event listeners
*   Author: J. Vuopionpera
***********************************************************************/

$(document).ready(function (){
	// Setup SVG 
    var points = new SVGObjects();
    points.test();
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
            var newId = points.maxId + 1;
            points.add(('p' + newId), pointX, pointY, 1, 'n');
            points.maxId = newId;
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
		tooltip = new ToolTip(points.point_tracker[pointId]);
		tooltip.place();
        // Listen for tooltip triggers
        $('#tooltip .box').click(function () {
            tooltip.reset();        
        });
        // Change the pain value
        var pain = points.point_tracker[pointId].data.pain;
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
        $('#ui_panel .button_save').click(function () {
            points.point_tracker[pointId].data.pain = pain;
            tooltip.reset();
        });
        // Delete a point
        $('#ui_panel .button_delete').one("click", function () {
            tooltip.reset();
            points.destroy_one(points.point_tracker[pointId]);
        });
	});
    
});
$(document).ready(function() {


    // adds click event to close button of slide panel
    $('.panel-slide .icn-close').on('click', function(e){
        e.stopPropagation();

        var $el = $(this).parents('.panel-slide');

        rightPanelClose($el);

        return false;
    });
});

// adds click event to popover
$(document).click(function(e) {
    var popover = $('.popover');

    if ((popover.length > 0 && popover.has(e.target).length == 0) || $(e.target).is('.close')) {
        $('.popover-trigger').popover('hide');
    }
});

function rightPanelSlide($el) {
    if ( !$el.hasClass('opened') ){
        $el.addClass('opened');

        $el.css("z-index", slider_z_index).css("right", "-" + $el.width() + "px").show().animate({ right: 0 }, function() {
            slider_z_index++;
            $el.find(">.panel-body").animate({ scrollTop: 0 });
        });
    }
    else {
        $el.css("z-index", slider_z_index);
        slider_z_index++;

        $el.find(">.panel-body").animate({ scrollTop: 0 });
    }
}

function rightPanelClose($el) {
    if ($el.hasClass('opened')) {

        $el.animate({right: '-' + $($el).width() + 'px'}, function(){
            $(this).removeClass('opened');
        });
    }
}

function myParseInt(val) {
    return isNaN(val) ? 0 : parseInt(val);
}

function DisplayNoResultsFound() {
    var grid = this;
    // Get the number of Columns in the grid
    var dataSource = grid.dataSource;
    var colCount = grid.columns.length;

    // If there are no results place an indicator row
    if (dataSource._total === 0) {
        grid.tbody.append('<tr class="kendo-data-row"><td colspan="' + colCount + '" style="text-align:center" width="100%"><b>No Results Found!</b></td></tr>');
    }
}

function showUpgradeButton(feature) {
    var self = this;

    if (feature === "marketing") {
        $("#marketingUpgrade").show().siblings().addClass("blur-div");
    } else if (feature === "reservation") {
        $("#futureResUpgrade").show().siblings().addClass("blur-div");
    }
}

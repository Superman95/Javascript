Ratings = function () {
    this.groupBy = null;
    this.start = null;
    this.end = null;
    this.ratingDS = null;
    this.chart = null;
}


Ratings.inheritsFrom(Page$Base);

Ratings.prototype.init = function () {
    var self = this;

    self.initFilters();
    self.createRatingsDS();
    self.createChart();
    self.registerEvents();

    self.parent.initSliders();
}

Ratings.prototype.onVenueChange = function () {
    // Put the code that needs to be run when venue dropdown changed
    var self = this;

    self.readAll();
}

Ratings.prototype.readAll = function () {
    var self = this;

    self.chart.dataSource.data([]);
    self.ratingDS.read({
        group_by: self.groupBy.value(),
        from_date: kendo.toString(self.start.value(), "yyyy-MM-dd"),
        to_date: kendo.toString(self.end.value(), "yyyy-MM-dd"),
        venue_id: self.venue.value()
    });
}

Ratings.prototype.registerEvents = function () {
    var self = this;

    $('#btnReset').on('click', function (e) {
        self.start.value(oneMonthAgo);
        self.end.value(today);
        self.groupBy.value("week");
        Utils.enableButton($("#btnSearch"));

        self.readAll();
    });

    $("#btnSearch").on('click', function (e) {
        Utils.disableButton($(this));

        self.readAll();
    });
}

Ratings.prototype.initFilters = function () {
    var self = this;

    self.parent.initFilters.call(self);

    self.groupBy = $("#groupBy").kendoDropDownList({
        change: function () {

        }
    }).data("kendoDropDownList");
    self.start = $("#start").kendoDatePicker({
        change: function () {
            self.end.min(this.value());
//            self.readAll();
        }
    }).data("kendoDatePicker");
    self.end = $("#end").kendoDatePicker({
        change: function () {
            self.start.max(this.value());
//            self.readAll();
        }
    }).data("kendoDatePicker");

    self.start.max(self.end.value());
    self.end.min(self.start.value());
}


// Minimum/maximum number of visible items
var MIN_SIZE = 8;
var MAX_SIZE = 16;

// Optional sort expression
//var SORT = { field: "val", dir: "desc" };
var SORT = {};

// Minimum distance in px to start dragging
var DRAG_THR = 50;

// State variables
var viewStart = 0;
var viewSize = MIN_SIZE;
var newStart;

var baseUnits = {
    date: "days",
    week: "weeks",
    month: "months"
};

Ratings.prototype.createRatingsDS = function() {
    var self = this;

    self.ratingDS = new kendo.data.DataSource({
        transport: {
            read: Utils.transportRead("/feedback/all_ratings.jsonp")
        },
        schema: {
            model: {
                fields: {
                    date: { type: "date" },
                    overall_rating: { type: "number" },
                    food_rating: { type: "number" },
                    service_rating: { type: "number" },
                    ambiance_rating: { type: "number" },
                    num_overall_rating: { type: "number" },
                    num_food_rating: { type: "number" },
                    num_service_rating: { type: "number" },
                    num_ambiance_rating: { type: "number" }
                }
            }
        },
        change: function (e) {
            Utils.enableButton($("#btnSearch"));

            var groupBy = self.groupBy.value();
            self.chart.options.categoryAxis.baseUnit = baseUnits[groupBy];

            var ds = self.chart.dataSource;

            viewStart = 0;
            viewSize = MIN_SIZE;

            ds.query({
                skip: viewStart,
                page: 0,
                pageSize: viewSize,
                sort: SORT
            });

            ds.data(this.data());
        },
        error: function(e) {
            Utils.enableButton($("#btnSearch"));
        }
    });
}

Ratings.prototype.createChart = function () {
    var self = this;

    // Drag handler
    function onDrag(e) {
        var chart = e.sender;
        var ds = chart.dataSource;
        var delta = Math.round(e.originalEvent.x.initialDelta / DRAG_THR);

        if (delta != 0) {
            newStart = Math.max(0, Math.min(ds.data().length - viewSize, viewStart - delta));
            ds.query({
                skip: newStart,
                page: 0,
                pageSize: viewSize,
                sort: SORT
            });
        }
    }

    function onDragEnd() {
        viewStart = newStart;
    }

    // Zoom handler
    function onZoom(e) {
        var chart = e.sender;
        var ds = chart.dataSource;
        viewSize = Math.min(Math.max(viewSize + e.delta, MIN_SIZE), MAX_SIZE);

        ds.query({
            skip: viewStart,
            page: 0,
            pageSize: viewSize,
            sort: SORT
        });

        // Prevent document scrolling
        e.originalEvent.preventDefault();
    }

    self.chart = $("#chart").kendoChart({
        title: { text: "Ratings" },
        legend: { position: "bottom" },
        autoBind: false,
        dataSource: {
            data: [],
            pageSize: viewSize,
            page: 0,
            sort: SORT
        },
        seriesDefaults: {
            type: "line",
            style: "smooth",
            width: 3,
            opacity: 0.8,
            markers: { visible: true }
        },
        series: [
            {
                field: "food_rating",
                name: "Food Score",
                color: "#eb575c",
                aggregate: "avg"
            },
            {
                field: "service_rating",
                name: "Service Score",
                color: "#49b046",
                aggregate: "avg"
            },
            {
                name: "Overall Score",
                color: "#4193ee",
                field: "overall_rating",
                aggregate: "avg"

            }
        ],
        categoryAxis: {
            field: "date",
            line: { visible: false },
            crosshair: {
                visible: true
            }
        },
        valueAxis: {
            min: 0,
            max: 5.2
        },
        transitions: false,
        tooltip: {
            visible: true,
            color: "white",
            template: kendo.template($("#scoreTooltipTemplate").html())
        },
        drag: onDrag,
        dragEnd: onDragEnd,
        zoom: onZoom
    }).data("kendoChart");
}
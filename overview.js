Overview = function () {
    this.groupBy = null;
    this.period = null;
    this.feedback_sort = null;
    this.start = null;
    this.end = null;

    this.feedbackPositiveGrid = null;
    this.feedbackNegativeGrid = null;
    this.futureLunchGrid = null;
    this.futureDinnerGrid = null;

    this.basicGuestStatsDataSource = null;
    this.reservationsDataSource = null;
    this.repeatGuestsDataSource = null;
    this.happyScoreDataSource = null;
    this.ratingAvgDataSource = null;
    this.marketingDataSource = null;
    this.feedbackDataSource = null;
    this.futureResDataSource = null;

    this.respondTab = null;
    this.progressPercentages = {
        guestStats: 20,
        happyScore: 15,
        ratingAverage: 15,
        marketing: 20,
        reservations: 10,
        //repeatGuests: 10,
        feedbacks: 20
    };

    Utils.showProgressBar();
}

Overview.inheritsFrom(Page$Base);

Overview.prototype.init = function () {
    var self = this;

    self.initGuestStats();
    self.initHappyScore();
    self.initRatingAverage();
    self.initMarketingResults();

    self.initResChart();
    //self.initRepeatGuestsChart();

    self.initFeedbackGrids();
    self.initTab();

    self.initFutureRes();
    self.initTabFuture();

    self.initFilters();
    self.initRespondTab();
    self.registerEvents();

    self.parent.initSliders();
}

Overview.prototype.onVenueChange = function () {
    // Put the code that needs to be run when venue dropdown changed
    var self = this;

    self.readAll();
}

/**
 * read all datasource
 */
Overview.prototype.readAll = function () {
    var self = this;
    console.log("Refresh");

    Utils.showProgressBar();

    var venue_id = self.venue.value();
    var period_days = self.period.value();

    self.basicGuestStatsDataSource.read({
        venue_id: venue_id,
        period_days: period_days
    });

    self.reservationsDataSource.read({
        venue_id: venue_id,
        period_days: period_days
    });

    /*self.repeatGuestsDataSource.read({
     venue_id: venue_id,
     period_days: period_days
     });
     */
    self.happyScoreDataSource.read({
        venue_id: venue_id,
        period_days: period_days
    });

    self.ratingAvgDataSource.read({
        venue_id: venue_id,
        period_days: period_days
    });

    // Check to see if they have the marketing featured enabled
    if ($.inArray("Automated Marketing", product_features) < 0) {
        showUpgradeButton("marketing");
        self.marketingDataSource.data([
            {
                total_spend: 1000,
                count: 100,
                total_cover: 25,
                recips: 200,
                avg_spend: 100
            }
        ]);
        console.log("Add progress");
        Utils.setProgress(self.progressPercentages.marketing);

    }
    else {
        self.marketingDataSource.read({
            venue_id: venue_id,
            period_days: period_days
        });
    }

    // Check to see if they have the future res featured enabled
    if (product_features.indexOf("Future Reservations") < 0) {
        showUpgradeButton("reservation");
        $("#res-period").data("kendoDropDownList").enable(false);
        $("#res-select").data("kendoDropDownList").enable(false);
    } else {
        $("#res-period").data("kendoDropDownList").enable(true);
        $("#res-select").data("kendoDropDownList").enable(true);
    }

    self.feedbackDataSource.read({
        venue_id: venue_id,
        period_days: period_days,
        sort_type: self.feedback_sort.value()
    });

    self.futureResDataSource.read({
        venue_id: venue_id,
        period_days: self.res_period.value(),
        all: self.res_select.value()
    });

}

/*
 * Init Respond Tab
 */
Overview.prototype.initRespondTab = function () {
    var self = this;

    self.respondTab = new RespondTab();

    self.respondTab.init(
        self.closeRespondTab.bind(self),
        self.closeRespondTab.bind(self),
        self.closeRespondTab.bind(self)
    );

    self.respondTab.hide();
}

/**
 * Init filter controls: venue, month
 */
Overview.prototype.initFilters = function () {
    var self = this;

    self.parent.initFilters.call(self);

    self.period = $("#period").kendoDropDownList({
        change: function (e) {
            self.readAll();
        }
    }).data("kendoDropDownList");

    self.res_period = $("#res-period").kendoDropDownList({
        change: function (e) {
            self.futureResDataSource.read({
                venue_id: self.venue.value(),
                period_days: self.res_period.value(),
                all: self.res_select.value()
            });
        }
    }).data("kendoDropDownList");

    self.res_select = $("#res-select").kendoDropDownList({
        change: function (e) {
            self.futureResDataSource.read({
                venue_id: self.venue.value(),
                period_days: self.res_period.value(),
                all: self.res_select.value()
            });
        }
    }).data("kendoDropDownList");

    self.feedback_sort = $("#feedback-sort").kendoDropDownList({
        change: function (e) {
            console.log(self.feedback_sort.value());

            self.feedbackDataSource.read({
                venue_id: self.venue.value(),
                period_days: self.period.value(),
                sort_type: self.feedback_sort.value()
            });
        }
    }).data("kendoDropDownList");
}

Overview.prototype.closeRespondTab = function () {
    var self = this;
    var $respondTab = self.respondTab.$dialog;
    // Get the divRespond of the feedback row to which respondTab is currently associated with;
    var divRespond = $respondTab.parent(".div-respond");

    if (divRespond) { // if currently divRespond is attached, shrinks divRespond of the current feedback row and change the button text
        divRespond.height(0);

        // Change the button text
        var btnRespond = divRespond.closest(".feedback-row").find(".btnRespond");
        btnRespond.removeClass("opened").find(".button-name").html("Add Note/ Reply");
    }
}

/**
 * Register events
 */
Overview.prototype.registerEvents = function () {
    var self = this;

    self.parent.registerEvents.call(self);

    $("#btnGo").click(function () {
        self.readAll();
    });

    $("#feedback-positive-grid, #feedback-negative-grid").on("click", ".btnRespond", function (e) {
        e.preventDefault();

        if ($(this).hasClass("opened")) {
            self.closeRespondTab();
        } else {
            self.closeRespondTab();

            // get the current divRespond
            var divRespond = $(this).closest(".feedback-row").find(".div-respond");


            var $respondTab = self.respondTab.$dialog;

            if (divRespond.find($respondTab).length == 0) { // if current divRespond contains respondTab, don't create again
                // detach from the previous attach
                $respondTab = $respondTab.detach();
                // attach the tab to the current feedback row
                $respondTab.appendTo(divRespond);

                self.respondTab.initEditor();
            }

            // get feedback data
            var domRow = $(this).closest(".feedback-row").parent("tr");
            var feedback = $(domRow).closest("div.k-grid").data("kendoGrid").dataItem(domRow);
            // load respond tab with feedback
            self.respondTab.load(feedback.venue_id, feedback.rating_id, feedback.email, feedback.answer);



            // expand the height of divRespond
            divRespond.height($respondTab.height() + 1);


            // add "opened" class to button and change the title of the button
            $(this).addClass("opened").find(".button-name").html("Close");


            // scroll to the selected feedback row
            var scrollTop = $(domRow).data("offsetTop");
            var gridContent = $(domRow).closest("div.k-grid-content");
            gridContent.animate({ scrollTop: scrollTop }, { queue: false });
        }
    });
}

/**
 * Init total tracked count
 */
Overview.prototype.initGuestStats = function () {
    var self = this;
    self.basicGuestStatsDataSource = new kendo.data.DataSource({
        transport: {
            read: Utils.transportRead("/guests/basic_guest_stats.jsonp")
        },

        change: function (e) {
            var data = this.data();
            var firstItem = data[0];

            if (firstItem.get('guest_count') <= 1) {
                $(".total-tracked-count-wrapper").removeClass("green-background").addClass("maroon-background");
                $("#total-email-count").html("No guests yet...");
            }
            else {
                $(".total-tracked-count-wrapper").removeClass().removeClass("maroon-background").addClass("green-background");
            }

            $("#total-guest-count").html(Utils.formatNumber(firstItem.get('guest_count')));
            $("#total-email-count").html(Utils.formatNumber(firstItem.get('email_count')));
        },

        requestEnd: function (e) {
            Utils.setProgress(self.progressPercentages.guestStats);
        }
    });
}

/* Init res chart
 */
Overview.prototype.initResChart = function () {
    var self = this;

    self.reservationsDataSource = new kendo.data.DataSource({
        transport: {
            read: Utils.transportRead("/guests/reservation_stats.jsonp")
        },
        schema: {
            model: {
                fields: {
                    cover_count: { type: "number" },
                    date: { type: "date" },
                    groupdate: { type: "date" }
                }
            }
        },
        change: function (e) {
            var self = this;
            var maxColumns = 17;
            var minColumnWidth = 31;

            var data = this.data();

            var width = "100%";
            if (data.length > maxColumns) {
                width = data.length * minColumnWidth;
            }

            $("#reservations-chart").width(width);

            var resChart = $("#reservations-chart").data("kendoChart");
            resChart.options.valueAxis.labels.visible = true

        },
        requestEnd: function (e) {
            Utils.setProgress(self.progressPercentages.reservations);
        }
    });

    $("#reservations-chart").kendoChart({
        autoBind: false,
        dataSource: self.reservationsDataSource,
        // legend: {
        // position: "top"
        // },
        seriesDefaults: {
            type: "line",
            line: {
                style: "smooth",
                width: 3
            },
            markers: {
                visible: true
            }
        },
        series: [
            {
                field: "cover_count",
                color: "#49b046"
            }
        ],
        tooltip: {
            visible: true,
            template: "#= value #",
            color: "white"
        },
        valueAxis: {
            // max: 400,
            // majorUnit: 50,
            field: "cover_count",
            labels: {
                visible: false,
                format: "{0}"
            },
            majorGridLines: {
                visible: false
            },
            line: {
                visible: false
            }
        },
        categoryAxis: {
            field: "date",
            baseUnit: "days",
            line: {
                visible: false
            }
        }
    });
}

/**
 * Init repeat guests chart
 */
Overview.prototype.initRepeatGuestsChart = function () {
    var self = this;

    self.repeatGuestsDataSource = new kendo.data.DataSource({
        transport: {
            read: Utils.transportRead("/guests/repeat_vs_first_time_guests.jsonp")
        },
        schema: {
            model: {
                fields: {
                    date_col: { type: "string" },
                    percentage: { type: "number" },
                    repeatCount: { type: "number" },
                    totalCountVal: { type: "number" }
                }
            }
        },
        requestEnd: function (e) {
            Utils.setProgress(self.progressPercentages.repeatGuests);
        }
    });

    $("#repeat-guests-chart").kendoChart({
        autoBind: false,
        dataSource: self.repeatGuestsDataSource,
        // legend: {
        // position: "top"
        // },
        seriesDefaults: {
            type: "line",
            line: {
                style: "smooth",
                width: 3
            },
            markers: {
                visible: true
            }
        },
        series: [
            {
                field: "percentage",
                // name: "Percentage",
                color: "#49b046"
            }
        ],
        tooltip: {
            visible: true,
            template: "#= category #: #= value #%",
            color: "white"
        },
        valueAxis: {
            max: 100,
            majorUnit: 20,
            labels: {
                format: "{0}%"
            },
            majorGridLines: {
                visible: false
            },
            line: {
                visible: false
            }
        },
        categoryAxis: {
            field: "date_col",
            // baseUnit: "months",
            line: {
                visible: false
            }
        }
    });
}

/**
 * Init Guest Ratings score
 */
Overview.prototype.initHappyScore = function () {
    var self = this;

    $(".percent-wrapper .small-percent").tooltip({
        container: '.scoreboard'
    });

    self.happyScoreDataSource = new kendo.data.DataSource({
        transport: {
            read: Utils.transportRead("/feedback/happy_score.jsonp")
        },

        change: function (e) {
            var data = this.data();
            var firstItem = data[0];
            var happy_percent = firstItem.get('percentage');

            var grade;
            var happy_score = 0;
            var sad_score = 0;

            if (happy_percent !== null) {
                happy_score = parseFloat(happy_percent);
                sad_score = 100 - happy_score;
            }

            if (happy_score >= 90) {
                $(".grade-wrapper").removeClass("orange-background darkorange-background maroon-background").addClass("green-background");
                grade = "A";
            }
            else if (happy_score >= 80) {
                $(".grade-wrapper").removeClass("green-background darkorange-background maroon-background").addClass("orange-background");
                grade = "B";
            }
            else if (happy_score >= 70) {
                $(".grade-wrapper").removeClass("green-background orange-background maroon-background").addClass("darkorange-background");
                grade = "C";
            }
            else if (happy_score >= 1) {
                $(".grade-wrapper").removeClass("green-background orange-background darkorange-background").addClass("maroon-background");
                grade = "D";
            }
            else {
                $(".grade-wrapper").removeClass("green-background orange-background darkorange-background").addClass("maroon-background");
                grade = "-";
            }

            $("#venga-grade").html(grade);
            $("#happy-percent").html(kendo.toString(happy_score, "n0"));
            $("#sad-percent").html(kendo.toString(sad_score, "n0"));
        },

        requestEnd: function (e) {
            Utils.setProgress(self.progressPercentages.happyScore);
        }
    });
}

/**
 * Init overall ratings averages: overall, food, service, ambiance
 */
Overview.prototype.initRatingAverage = function () {
    var self = this;

    self.ratingAvgDataSource = new kendo.data.DataSource({
        transport: {
            read: Utils.transportRead("/feedback/rating_averages.jsonp")
        },

        change: function (e) {
            var data = this.data();
            var firstItem = data[0];

            var overall_rating = kendo.parseFloat(firstItem.get('overall_rating'));
            var food_rating = kendo.parseFloat(firstItem.get('food_rating'));
            var service_rating = kendo.parseFloat(firstItem.get('service_rating'));
            var ambiance_rating = kendo.parseFloat(firstItem.get('ambiance_rating'));

            var num_overall_rating = kendo.parseInt(firstItem.get('num_overall_rating'));
            var num_food_rating = kendo.parseInt(firstItem.get('num_food_rating'));
            var num_service_rating = kendo.parseInt(firstItem.get('num_service_rating'));
            var num_ambiance_rating = kendo.parseInt(firstItem.get('num_ambiance_rating'));

            $("#overall-avg").html(kendo.toString(overall_rating, "n1"));
            $("#food-avg").html(kendo.toString(food_rating, "n1"));
            $("#service-avg").html(kendo.toString(service_rating, "n1"));
            $("#ambiance-avg").html(kendo.toString(ambiance_rating, "n1"));
        },

        requestEnd: function (e) {
            Utils.setProgress(self.progressPercentages.ratingAverage);
        }
    });
}

/**
 * Init marketing results
 */
Overview.prototype.initMarketingResults = function () {
    var self = this;

    $(".stat-wrapper .stat").tooltip({
        container: '.scoreboard'
    });

    self.marketingDataSource = new kendo.data.DataSource({
        transport: {
            read: Utils.transportRead("/marketing/campaigns.jsonp")
        },

        change: function (e) {
            var data = this.data();

            var total_spend = 0;
            var total_tables = 0;
            var total_cover = 0;
            var avg_spend = 0;
            var total_recips = 0;
            var prev_total_tables = 0;
            var diff = 0;

            for (var i = 0; data.length > i; i++) {
                total_spend += kendo.parseFloat(data[i].get("total_spend"));
                total_tables += kendo.parseFloat(data[i].get("count"));
                prev_total_tables += kendo.parseFloat(data[i].get("prevCount"));
                total_cover += kendo.parseFloat(data[i].get("total_cover"));
                total_recips += kendo.parseFloat(data[i].get("recips"));
                avg_spend += kendo.parseFloat(data[i].get("avg_spend"));
            }

            if (prev_total_tables == 0 && total_tables > 0) {
                diff = 1;
            }
            else if (prev_total_tables == 0 && total_tables == 0) {
                diff = 0;
            }
            else {
                diff = ( (prev_total_tables - total_tables) / prev_total_tables );
            }

            $(".scoreboard #total-spend").html(Utils.formatCurrency(total_spend));
            $(".scoreboard #total-tables").html(Utils.formatNumber(total_tables));
            $(".scoreboard #total-cover").html(Utils.formatNumber(total_cover));
            $(".scoreboard #total-recips").html(Utils.formatNumber(total_recips));
            $(".scoreboard #avg-spend").html(Utils.formatCurrency(avg_spend));

            if (diff < 0) {
                diff = Math.abs(diff);
                $(".scoreboard #diff-total").html("Down " + kendo.format("{0:p0}", diff));
                $(".scoreboard #mark-result_diff").css("background-color", "maroon");
            }
            else if (diff === 0) {
                $(".scoreboard #diff-total").html("Neutral " + kendo.format("{0:p0}", diff));
                $(".scoreboard #mark-result_diff").css("background-color", "maroon");
            }
            else {
                $(".scoreboard #diff-total").html("Up " + kendo.format("{0:p0}", diff));
                $(".scoreboard #mark-result_diff").css("background-color", "#49b046");
            }

            if (data.length < 1) {
                $(".scoreboard .campaign-count-wrapper").removeClass("green-background").addClass("maroon-background");
                $(".scoreboard .alert-wrapper").show();
                $(".scoreboard .sales-wrapper").hide();
                $(".scoreboard .marketing-wrapper").hide();
                $(".scoreboard .stat-wrapper").hide();
            }
            else {
                $(".scoreboard .campaign-count-wrapper").removeClass("maroon-background").addClass("green-background");
                $(".scoreboard .alert-wrapper").hide();
                $(".scoreboard .sales-wrapper").show();
                $(".scoreboard .marketing-wrapper").show();
                $(".scoreboard .stat-wrapper").show();
            }

            $(".scoreboard #campaign-count").html(kendo.format("{0:n0}", data.length));
        },

        requestEnd: function (e) {
            Utils.setProgress(self.progressPercentages.marketing);
        }
    });
}

/**
 * Init positive and negative feedback grids
 */
Overview.prototype.initFeedbackGrids = function () {
    var self = this;

    $(".pull-right .tip").tooltip({
        container: '.panel'
    });

    self.feedbackDataSource = new kendo.data.DataSource({
        transport: {
            read: Utils.transportRead("/feedback/all_feedback.jsonp")
        },

        change: function () {
            var data = this.data();
            var filter = this.filter();

            if (typeof filter === "undefined" || filter === null) {
                filter = [];
            }
            else {
                filter = filter.filters;
            }

            var positiveFilters = [
                {
                    field: "rating",
                    operator: "gte",
                    value: 4
                }
            ];

            var neutralFilters = [
                {
                    field: "rating",
                    operator: "lte",
                    value: 0
                }
            ];

            var negativeFilters = [
                {
                    field: "rating",
                    operator: "lte",
                    value: 3
                },
                {
                    field: "rating",
                    operator: "gte",
                    value: 1
                }
            ];

            var query = new kendo.data.Query(data);

            var positiveData = query.filter(filter.concat(positiveFilters)).data;
            var neutralData = query.filter(filter.concat(neutralFilters)).data;
            var negativeData = query.filter(filter.concat(negativeFilters)).data;
            $.merge(positiveData, neutralData);

            self.feedbackPositiveGrid.dataSource.data(positiveData);
            self.feedbackNegativeGrid.dataSource.data(negativeData);

            $("#feedback-positive-count").html(kendo.toString(positiveData.length, "n0"));
            $("#feedback-negative-count").html(kendo.toString(negativeData.length, "n0"));
        },
        requestEnd: function (e) {
            Utils.setProgress(self.progressPercentages.feedbacks);
        }
    });

    self.feedbackPositiveGrid = $("#feedback-positive-grid").kendoGrid({
        dataSource: {
            pageSize: 20
        },
        navigatable: true,
        pageable: {
            buttonCount: 3
        },
        filterable: true,
        selectable: false,
        autoBind: false,
        rowTemplate: kendo.template($("#overview-feedback-row-template").html()),
        dataBound: function (e) {
            self.onGridDataBound.call(this);
            DisplayNoResultsFound.call(this);
        }
    }).data("kendoGrid");

    self.feedbackNegativeGrid = $("#feedback-negative-grid").kendoGrid({
        dataSource: {
            pageSize: 20
        },
        navigatable: true,
        pageable: {
            buttonCount: 3
        },
        filterable: true,
        selectable: false,
        autoBind: false,
        rowTemplate: kendo.template($("#overview-feedback-row-template").html()),
        dataBound: function (e) {
            self.onGridDataBound.call(this);
            DisplayNoResultsFound.call(this);
        }
    }).data("kendoGrid");
}

Overview.prototype.initTab = function () {
    $("#tabstrip").kendoTabStrip({
        animation: {
            open: {
                effects: "fadeIn"
            }
        }
    });
}

Overview.prototype.initTabFuture = function () {
    $("#tabstrip-future").kendoTabStrip({
        animation: {
            open: {
                effects: "fadeIn"
            }
        }
    });
}

Overview.prototype.onGridDataBound = function (e) {
    var grid = this;

    $(grid.tbody).find(".is-completed").tooltip({
        container: "body"
    });

    // Add popover to each feedback and save offset of each row
    $(grid.tbody).children().each(function (index, el) {
        var $el = $(el);

        // save top offset of each feedback row
        $el.data("offsetTop", $el.position().top);


        var data = grid.dataItem(el);
        var popoverTrigger = $el.find("tr.popover-trigger");

        popoverTrigger.click(function (e) {
            $('.popover-trigger').not(this).popover('hide');
            e.stopPropagation();
        });

        popoverTrigger.popover({
            html: true,
            title: data.full_name + '<a class="close" href="#" data-dismiss="popover">&times;</a>',
            content: '<p>' + data.answer + '</p>',
            placement: 'left',
            container: 'body'
        });

        popoverTrigger.on('show.bs.popover', function (e) {
            $(this).css('background-color', '#f5f5fa');
        });

        popoverTrigger.on('hidden.bs.popover', function (e) {
            $(this).css('background-color', '#ffffff');
        });
    });
}

Overview.prototype.initFutureRes = function () {
    var self = this;

    $(".pull-right .tip").tooltip({
        container: '.panel'
    });

    self.futureResDataSource = new kendo.data.DataSource({
        transport: {
            read: Utils.transportRead("/reservations/list.jsonp")
        },
        schema: {
            model: {
                fields: {
                    first_name: { type: "string" },
                    last_name: { type: "string" },
                    party_size: { type: "integer" },
                    guest_codes: { type: "string" },
                    res_codes: { type: "string" },
                    guest_notes: { type: "string" },
                    res_notes: { type: "string" },
                    resdatetime: { type: "date" },
                    time: { type: "date" },
                    all: { type: "boolean" }
                }
            }
        },
        // Lunch or Dinner tab
        change: function () {
            var data = this.data();
            var filter = this.filter();

            if (typeof filter === "undefined" || filter === null) {
                filter = [];
            } else {
                filter = filter.filters;
            }
            var endLunchTime = new Date("2000-01-01T16:00:00Z");

            var lunchFilters = [
                {
                    field: "time",
                    operator: "lt",
                    value: endLunchTime
                }
            ];

            var dinnerFilters = [
                {
                    field: "time",
                    operator: "gt",
                    value: endLunchTime
                }
            ];

            var query = new kendo.data.Query(data);

            var lunchData = query.filter(filter.concat(lunchFilters)).data;
            var dinnerData = query.filter(filter.concat(dinnerFilters)).data;

            self.futureLunchGrid.dataSource.data(lunchData);
            self.futureDinnerGrid.dataSource.data(dinnerData);

            // Number of Total Lunch/Dinner Reservations
            $("#lunch-count").html(kendo.toString(lunchData.length, "n0"));
            $("#dinner-count").html(kendo.toString(dinnerData.length, "n0"));
        }
    });


    self.futureLunchGrid = $("#future-lunch-grid").kendoGrid({
        dataSource: {
            pageSize: 20
        },
        scrollable: true,
        pageable: {
            pageSizes: false,
            buttonCount: 3
        },
        filterable: true,
        selectable: false,
        rowTemplate: kendo.template($("#overview-future-res-row-template").html()),
        dataBound: function (e) {
            DisplayNoResultsFound.call(this);
        }
    }).data("kendoGrid");

    self.futureDinnerGrid = $("#future-dinner-grid").kendoGrid({
        dataSource: {
            pageSize: 20
        },
        scrollable: true,
        pageable: {
            pageSizes: false,
            buttonCount: 3
        },
        filterable: true,
        selectable: false,
        rowTemplate: kendo.template($("#overview-future-res-row-template").html()),
        dataBound: function (e) {
            DisplayNoResultsFound.call(this);
        }
    }).data("kendoGrid");
}


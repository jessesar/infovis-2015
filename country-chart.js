var formatNumber = function(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
  };
  
var bigXperiod = function(country, x, flow, period) {
    var obj = {};
    var topX = [];
    for (var partner in data[flow]) {
        if (partner !== 'REST') {
            obj[parseInt(data[flow][partner][currentPeriod])] = partner;
        }
    };

    var array = [];             
    while (array.length < x) {
        var max = d3.max(Object.keys(obj).map(function(x) { return parseInt(x);}));
        array.push(obj[max]);
        delete obj[max]
    };
    
    return array;
};

var getArray = function(partners) {
    var dataArray = [];

    for (var partner in partners) {
        var partner = partners[partner];

        dataArray.push(parseInt(data[flow][partner][currentPeriod]));
    };

    return dataArray;
}

var customData;

var spaceForLabels,
    chartWidth,
    barHeight,
    gapBetweenBars;

var chartHeight;

var xScale;
var yScale;
var color;

var chart;

var setupCountryChart = function(x) {
    spaceForLabels   = 120,
    chartWidth       = $('#country-panel').width() - spaceForLabels - 20,
    barHeight        = 30,
    gapBetweenBars   = 8;

	generateCountryChartData(x);

	// Color scale
    color = d3.scale.ordinal()
        .range(['#DB5D59']);

    chartHeight = barHeight * customData.data.length + gapBetweenBars * customData.data.length + 50;

    setupCountryChartScales();    

    yScale = d3.scale.linear()
        .range([chartHeight - gapBetweenBars - 51, 0]);

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .tickFormat('')
        .tickSize(0)
        .orient('left');

    // Specify the chart area and dimensions
    chart = d3.select('#country-panel')
		.append('svg')
		.attr("class", "country-chart")
		.attr("id", "barChart")
        .attr("width", spaceForLabels + chartWidth)
        .attr("height", chartHeight);

    // Create bars
    drawBars();

    chart.append("g")
          .attr("class", "y axis")
          .attr('height', 100)
          .attr("transform", "translate(" + spaceForLabels + ", 0)")
          .call(yAxis);

};

var setupCountryChartScales = function() {
    xScale = d3.scale.linear()
                    .domain([0, d3.max(customData.data.map(function(d) {
                        return d.data
                    }))])
                    .range([70, chartWidth]);
}

var generateCountryChartData = function(x) {
    var partners = bigXperiod(country, x, flow, currentPeriod);
    var dataArray = getArray(partners); 
    
    function obj(country, data) {
        this.country = country;
        this.data = data;
    };
    
    customData = {
      flow: flow,
      data: partners.map(function(d){
        return new obj(d, getArray([d])[0]);
      }),
      labels: partners
    }
}

var drawBars = function(animated) {
    var barGroup = chart.selectAll('rect')
                        .data(customData.data, function(d) {
                            return d.country;
                         })
                        .enter()
                        .append('g')
                        .attr('class', 'barGroup')
                        .attr('id', function(d) {
                            return 'barGroup-'+ d.country.replace(' ', '-');
                        })
                        .on('mouseover', function(d) {
                            var feature = country_map[d.country];

                            d3.select('#'+ feature.id).style('fill', '#404561');
                        })
                        .on('mouseout', function(d) {
                            var feature = country_map[d.country];

                            d3.select('#'+ feature.id).style('fill', '');
                        })
                        .on('click', function(d) {
                            if(d3.event.defaultPrevented) return;

                            var feature = country_map[d.country];
                            selectCountry(feature);

                            d3.selectAll('.barGroup').each(function() {
                                d3.select(this).attr('class', 'barGroup');
                            });

                            d3.select(this).attr('class', 'barGroup selected');
                        });

    var bar = barGroup
                .append("rect")
                .attr("fill", function(d,i) { return color(i % customData.data.length); })
                .attr("class", "bar active")
                .attr("width", function(d) { return xScale(d.data) })
                .attr("height", barHeight - 1)
                .attr('x', spaceForLabels)

    if(animated) {
        bar.attr('y', numberOfCountries * (barHeight + gapBetweenBars))
            .transition()
            .duration(300)
    }

    bar.attr('y', function(d, i) { return i * (barHeight + gapBetweenBars) });

    // Add text label in bar
    var barLabel = barGroup.append("text")
            .attr('class', 'barLabel active')
            .attr("x", function(d) { return xScale(d.data) - 7 + spaceForLabels; })
            .attr("dy", ".35em")
            .text(function(d) { return "€" + formatNumber(d.data); })

    if(animated) {
        barLabel.attr("y", numberOfCountries * (barHeight + gapBetweenBars) + 14)
            .transition()
            .duration(300)
    }

    barLabel.attr("y", function(d, i) { return i * (barHeight + gapBetweenBars) + 14 });

    // Draw labels
    var label = chart.selectAll(".label")
                    .data(customData.data, function(d) {
                        return d.country;
                     })
                    .enter()
                    .append('text')
                    .attr("class", "label active")
                    .attr("x", spaceForLabels - 8)
                    .attr("dy", ".35em")
                    .text(function(d, i) {
                        var feature = country_map[d.country];
                        return feature.properties.name;

                        // return d.country;
                    })

    if(animated) {
        label.attr("y", numberOfCountries * (barHeight + gapBetweenBars) + 14)
             .transition()
             .duration(300)
    }

    label.attr("y", function(d, i) { return i * (barHeight + gapBetweenBars) + 14 });
}

var updateCountryChart = function(x, animated) {
    d3.selectAll('.subunit').each(function() {
        d3.select(this).style('fill', '');
    });

    generateCountryChartData(x);

    setupCountryChartScales();

    var deleteDuration;
    if(animated) {
        deleteDuration = 300;
    } else {
        deleteDuration = 0;
    }

    chart.selectAll('.bar.active')
         .data(customData.data, function(d) {
            return d.country;
         })
         .transition()
            .attr("width", function(d) { return xScale(d.data) })
            .attr('y', function(d, i) { return i * (barHeight + gapBetweenBars) });

    chart.selectAll('.barLabel.active')
         .data(customData.data, function(d) {
            return d.country;
         })
         .transition()
            .attr("x", function(d) { return xScale(d.data) - 7 + spaceForLabels; })
            .attr("y", function(d, i) { return i * (barHeight + gapBetweenBars) + 14 })
            .text(function(d) { return "€" + formatNumber(d.data); });

    chart.selectAll(".label.active")
         .data(customData.data, function(d) {
            return d.country;
         })
         .transition()
            .attr('y', function(d, i) { return i * (barHeight + gapBetweenBars) + 14 })
            .text(function(d) {
	        	var feature = country_map[d.country];
                return feature.properties.name;
                        
            	// return d.country;
            });

    chart.selectAll('.bar.active')
         .data(customData.data, function(d) {
            return d.country;
         })
         .exit()
         .attr('class', 'bar')
         .transition()
         .duration(deleteDuration)
         .attr('y', numberOfCountries * (barHeight + gapBetweenBars))
         .attr('opacity', 0.0)
         .remove();

    chart.selectAll('.barLabel.active')
         .data(customData.data, function(d) {
            return d.country;
         })
         .exit()
         .attr('class', 'barLabel')
         .transition()
         .duration(deleteDuration)
         .attr('y', numberOfCountries * (barHeight + gapBetweenBars) + 14)
         .attr('opacity', 0.0)
         .remove();

    chart.selectAll('.barGroup.active')
         .data(customData.data, function(d) {
            return d.country;
         })
         .exit()
         .attr('class', 'barGroup')
         .transition()
         .duration(deleteDuration)
         .remove();

    chart.selectAll('.label.active')
         .data(customData.data, function(d) {
            return d.country;
         })
         .exit()
         .attr('class', 'label')
         .attr('opacity', 1.0)

         .transition()
         .duration(deleteDuration + 200)

         .attr('y', numberOfCountries * (barHeight + gapBetweenBars) + 14)
         .attr('opacity', 0.0)
         .remove();

    drawBars(animated);
}
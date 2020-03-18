var percentage = true;
var rest = false;

d3.selection.prototype.moveToFront = function() {
		return this.each(function(){
		this.parentNode.appendChild(this);
	});
};

var bigX = function(x) {
	var obj = {};
	var topX = [];
	var flow = 'EXPORT';
	for (var partner in data[flow]) {
		if (partner !== 'REST') {
			var array = [];

			for (var period in data[flow][partner]) {
				array.push(parseInt(data[flow][partner][period]) + parseInt(data['IMPORT'][partner][period]));
			};

			obj[d3.sum(array)] = partner;
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

var calc_rest = function(nonRestArray) {
	function diff(a, b) {
		return a.filter(function(i) {return b.indexOf(i) < 0;});
	};

	var partners = diff(Object.keys(data['IMPORT']), nonRestArray);				
	
	for (var flow in Object.keys(data)) {
		var flow = Object.keys(data)[flow];
		
		if (isNaN(data[flow]['REST'])) {
			data[flow]['REST'] = {};
		}
		
		for (var partner in partners) {
			var partner = partners[partner];
			
			for (var period in Object.keys(data[flow][partner])) {
				var period = Object.keys(data[flow][partner])[period];
				
				if (isNaN(data[flow]['REST'][period])) {
					data[flow]['REST'][period] = parseInt(data[flow][partner][period]);
				} else {
					data[flow]['REST'][period] = parseInt(data[flow][partner][period]) + parseInt(data[flow]['REST'][period]);
				}
			}
		}
	}			
};

var reformat = function(partners) {
	if (rest) {
		calc_rest(partners);
		partners.unshift('REST');
	}

	function obj(label, value, y0) {
		this.label = new Date(parseInt(label).toFixed(0), (parseFloat(label) % 1).toFixed(3) * 100);
		this.value = value;
		this.y = value;
		this.y0 = y0
	};
					
	function partnerObj(name, values) {
		this.name = name;
		this.values = values 
	};
	
	var reformatedArray = [];

	var total = {}
	partners.map(function(d) { 
		return Object.keys(data['IMPORT'][d]).map(
			function(period) {
				if (isNaN(total[period])) {
					total[period] = parseInt(data['IMPORT'][d][period]) + 
									parseInt(data['EXPORT'][d][period])
				} else {
					total[period] = parseInt(data['IMPORT'][d][period]) + 
									parseInt(data['EXPORT'][d][period]) +
									total[period]
				};
			});
	})
		
	for (var partner in partners) {
		var array = []
		var keys = Object.keys(data['IMPORT'][partners[partner]])
		
		for (var period in keys) {
			if(data['IMPORT'][partners[partner]][keys[period]]) {
				var addition = parseInt(data['IMPORT'][partners[partner]][keys[period]]) + parseInt(data['EXPORT'][partners[partner]][keys[period]]);
				var all = total[keys[period]];
				if (addition == 0) { addition = 1 };
				if (all == 0) { all = partners.length };
				array.push(new obj(keys[period], (addition / all), 0))
			}
		};
		reformatedArray.push(new partnerObj(partners[partner], array));
	};
	return reformatedArray;
};

var w, h;

var areaXScale;
var areaYScale;

var areaXAxis;
var areaYAxis;

var areaSvg;

var stack;
var areaDomain;
var area;
var areaData;

var areaColor;
var areaLabelColor;

function setupAreaChart(x) {
	var margin = {top: 20, right: 100, bottom: 30, left: 50};
	w = $('#country-panel').width() - margin.right;
	h = $('#country-panel').height() * 0.32;

	areaData = reformat(bigX(x));
		
	areaYScale = d3.scale.linear()
						 .rangeRound([h, 0]);

	var dates = areaData[0].values.map(function(d) { return d.label;});
	var minDate = dates[0];
	var maxDate = dates[dates.length-1];

	areaXScale = d3.time.scale()
		.domain([minDate, maxDate])
		.nice(d3.time.month)
		.range([0, w]);

	areaXAxis = d3.svg.axis()
		.scale(areaXScale)
		.orient('bottom');

	areaYAxis = d3.svg.axis()
		.scale(areaYScale)
		.orient('left')

	if (percentage) {
		areaYAxis.tickFormat(d3.format('.0%'));
	} else {
		areaYAxis.tickFormat(d3.format('s'));
	}

	stack = d3.layout.stack()
		.offset('zero')
		.values(function (d) { return d.values; })

	updateAreaScales();

	area = d3.svg.area()
		.interpolate('cardinal')
		.x(function (d) { return areaXScale(d.label);})
		.y0(function (d) { return areaYScale(d.y0); })
		.y1(function (d) { return areaYScale(d.y0 + d.y); });
		
	var topMargin;
	if(h + margin.top + margin.bottom < 300) {
		topMargin = '345px';
	} else {
		topMargin = '370px';
	}
		
	areaSvg = d3.select('#country-panel')
		.append('svg')
		.attr('width', w + margin.right)
		.attr('height', h + margin.top + margin.bottom)
		.style('top', topMargin)
		.attr('class', 'area-chart')
		.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
	
	addAreas();
		
	areaSvg.append('g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0,' + h + ')')
		.call(areaXAxis);

	areaSvg.append('g')
		.attr('class', 'y axis')
		.call(areaYAxis);

	var pointer = areaSvg.append('line')
					.attr('class', 'pointer')
					.attr('x1', function() {
						var d = new Date(parseInt(currentPeriod).toFixed(0), (parseFloat(currentPeriod) % 1).toFixed(3) * 100);

						return areaXScale(d);
					})
					.attr('y1', 0)
					.attr('x2', function() {
						var d = new Date(parseInt(currentPeriod).toFixed(0), (parseFloat(currentPeriod) % 1).toFixed(3) * 100);

						return areaXScale(d);
					})
					.attr('y2', h)
					.attr('stroke', '#666')
					.attr('stroke-width', 2)
					.attr('opacity', '0.5');
						
};

var updateAreaScales = function() {
	areaDomain = d3.extent(stack(areaData), function(d) {
		return d3.max(d.values, function(v) {
			return (v.y0 + v.y) - v.y0;
		});
	});

	areaColor = d3.scale.linear()
						.domain(areaDomain)
						.range(['#fff2de', '#db5d59']);

	areaLabelColor = d3.scale.linear()
						.domain(areaDomain)
						.range(['#666', '#333333']);

						//.range(['#7D7D7D', '#5C5C5C']);
}

var updateXScale = function() {
	var dates = areaData[0].values.map(function(d) { return d.label;});
	var minDate = dates[0];
	var maxDate = dates[dates.length-1];

	areaXScale.domain([minDate, maxDate])
			  .nice(d3.time.month);

	areaSvg.select('.x.axis')
			.call(areaXAxis);
}

var addAreas = function() {
	var groups = areaSvg.selectAll('.country')
						.data(stack(areaData), function(d) {
							return d.name.replace(' ', '-');
						})
						.enter()
						.append('path')
						.attr('class', 'country')
						.attr('id', function(d){
							return 'area-'+ d.name.replace(' ', '-');
						})
						.attr('d', function(d) {
							return area(d.values);
							})
						.style('fill', function(d) {
							var maxHeight = d3.max(d.values, function(v) {
								return (v.y0 + v.y) - v.y0;
							});

							return areaColor(maxHeight);
						});

	var legend = areaSvg.selectAll('.area-country-name')
						.data(areaData, function(d) {
							return d.name.replace(' ', '-');
						})
						.enter()
						.append('text')
							 .attr('class', 'area-country-name')
							 .attr('x', function(d) {
							 	var area = d3.select('#area-'+ d.name.replace(' ', '-')).node();
							 	var bbox = area.getBBox();

							 	var center = [bbox.x + (bbox.width / 2), (bbox.y + bbox.height / 2)];
							 	return center[0];
							 })
							 .attr('y', function(d) {
							 	var middle = Math.round((d.values.length -1) / 2);
							 	var v = d.values[middle];

							 	var y0 = areaYScale(v.y0);
							 	var y = areaYScale(v.y0 + v.y);
							 	var diff = y - y0;

							 	return y0 + (diff / 2) + 3;

							 	/*var area = d3.select('#area-'+ d.name.replace(' ', '-')).node();
							 	var bbox = area.getBBox();

							 	var center = [bbox.x + (bbox.width / 2), (bbox.y + bbox.height / 2)];
							 	return center[1] + 4;*/
							 })
							 .text(function(d) {
							 	var feature = country_map[d.name];
							 	return feature.properties.name;
							 })
							 .attr('fill', function(d) {
							 	var maxHeight = d3.max(d.values, function(v) {
									return (v.y0 + v.y) - v.y0;
								});

							 	return areaLabelColor(maxHeight);
							 });
}

var updateAreaChart = function(x) {
	areaData = reformat(bigX(x));

	updateXScale();

	updateAreaScales();

	var groups = areaSvg.selectAll('.country')
						.data(stack(areaData), function(d) {
							return d.name.replace(' ', '-');
						})
						.attr('d', function(d) {
							return area(d.values);
						})
						.style('fill', function(d) {
							var maxHeight = d3.max(d.values, function(v) {
								return (v.y0 + v.y) - v.y0;
							});

							return areaColor(maxHeight);
						});

	areaSvg.selectAll('.area-country-name')
			.data(areaData, function(d) {
				return d.name.replace(' ', '-');
			})
			 .attr('x', function(d) {
			 	var area = d3.select('#area-'+ d.name.replace(' ', '-')).node();
			 	var bbox = area.getBBox();

			 	var center = [bbox.x + (bbox.width / 2), (bbox.y + bbox.height / 2)];
			 	return center[0];
			 })
			 .text(function(d) {
			 	var feature = country_map[d.name];
			 	return feature.properties.name;
			 })
			 .attr('y', function(d) {
			 	var area = d3.select('#area-'+ d.name.replace(' ', '-')).node();
			 	var bbox = area.getBBox();

			 	var center = [bbox.x + (bbox.width / 2), (bbox.y + bbox.height / 2)];
			 	return center[1];
			 })
			 .attr('fill', function(d) {
			 	var maxHeight = d3.max(d.values, function(v) {
					return (v.y0 + v.y) - v.y0;
				});

			 	return areaLabelColor(maxHeight);
			 });

	areaSvg.selectAll('.country')
			.data(stack(areaData), function(d) {
				return d.name.replace(' ', '-');
			})
			.exit()
			.remove();

	areaSvg.selectAll('.area-country-name')
			.data(areaData, function(d) {
				return d.name.replace(' ', '-');
			})
			.exit()
			.remove();

	addAreas();

	areaSvg.select('.pointer').moveToFront();
}

var updatePointer = function(period, animated) {
	var pointer = areaSvg.select('.pointer')

	var duration;
	if(animated) {
		pointer = pointer.transition()
						.ease('linear')
						.duration(timelineSpeed);
	}

	pointer.attr('x1', function() {
				var d = new Date(parseInt(period).toFixed(0), (parseFloat(period) % 1).toFixed(3) * 100);

				return areaXScale(d);
			})
			.attr('x2', function() {
				var d = new Date(parseInt(period).toFixed(0), (parseFloat(period) % 1).toFixed(3) * 100);

				return areaXScale(d);
			});
}
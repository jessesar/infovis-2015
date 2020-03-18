var createProjection = function() {
	projection = d3.geo.mercator()
					    .scale(700)
					    .center(country_info_map['POLAND'].capitalCoordinate) // The Netherlands
					    .translate([600, 350]);

	path = d3.geo.path().projection(projection);
}

var periodMap = {};

var loadMap = function(mapFile, cb) {
	d3.json(mapFile, function(d) {
		features = topojson.feature(d, d.objects.subunits).features.filter(function(d) {
		  			return (EU.indexOf(d.id) > -1);
		  		 });
		  		 
		features.forEach(function(d) {
			switch(d.id) {
				case 'CYP':
					d.properties.name = 'Cyprus';
					break;

				case 'IRL':
					d.properties.name = 'Ireland';
					break;
			}

			country_map[d.properties.name.toUpperCase()] = d;
		});

		svg.selectAll(".subunit")
		    .data(features)
			  .enter().append("path")
			    .attr('stroke', 'white')
			    .attr('stroke-width', '1')
			    .attr('fill', featureFill)
			    .attr('class', featureClass)
			    .attr('d', path)
			    .attr('id', function(d) {
					return d.id;
				});

		svg.selectAll('.countryLabel')
			.data(features)
			.enter()
			.append('text')
			.attr('class', 'countryLabel')
			.text(function(d) {
				return d.id;
			})
			.attr('x', function(d) {
				var c = normalizeCountryName(d.properties.name.toUpperCase());
				var capital = country_info_map[c].capitalCoordinate;
				var center = d3.geo.centroid(country_map[c]);

				var interpolator = d3.geo.interpolate(capital, center);
				var coordinate = interpolator(0.01 / d3.geo.distance(capital, center));

				return projection(coordinate)[0] + 1;
			})
			.attr('y', function(d) {
				var c = normalizeCountryName(d.properties.name.toUpperCase());
				var capital = country_info_map[c].capitalCoordinate;
				var center = d3.geo.centroid(country_map[c]);

				var interpolator = d3.geo.interpolate(capital, center);
				var coordinate = interpolator(0.01 / d3.geo.distance(capital, center));

				return projection(coordinate)[1] + 3;
			})
			.style('fill', countryLabelFill);
		
		svg.selectAll('.subunit').on('click', function() {
			if(d3.event.defaultPrevented) return;

			selectCountry(this.__data__);
		});

		svg.selectAll('.subunit').on('mouseover', function(d) {
			clearTimeout(clearTimer);

			d3.select('#country-name').text(d.properties.name);
		});

		var clearTimer;
		svg.selectAll('.subunit').on('mouseout', function(d) {
			clearTimer = setTimeout(function() {
				d3.select('#country-name').text(country_map[country].properties.name);
			}, 100);
		});

		placeCapitals(function() {
			// Create flows after capitals have been loaded 
			createFlows();

			revealFlows();

			placeCapitals();

			// animateFlows();
		});
		
		cb();
	});
};

var selectCountry = function(c) {
	pause();

	country = c.properties.name.toUpperCase();
	d3.select('#country-name').text(country_map[country].properties.name);

	d3.json('data_new/'+ country +'.json', function(d) {
		d3.selectAll('.subunit').each(function() {
			d3.select(this).attr('class', featureClass);
		});

		data = d;

		createConnections(data[flow]);

		if(currentAnimation != 0) {
			hideFlows(300);
		} else {
			hideFlows(700);
		}

		createScales();

		createFlows();
	    
		if(currentAnimation != 0) {
			revealFlows(300);
		} else {
			revealFlows(700);
		}

		placeCapitals();

		updateCountryChart(numberOfCountries, false);
		updateAreaChart(numberOfCountries, false);

		setTimeout(function() {
			if(currentAnimation == 1) {
				play();
			} else if(currentAnimation == -1) {
				reverse();
			}
		}, 100);
	});
}

var updateMap = function() {
	svg.selectAll('.subunit')
		.data(features)
		.transition()
	    .attr('fill', featureFill)
	    .attr('class', featureClass);

	svg.selectAll('.countryLabel')
		.data(features)
		.transition()
		.style('fill', countryLabelFill);
}

var countryAvailable = function(c) {
	if(c in country_info_map) {
		if(country_info_map[c].startPeriod) {
			var thisStartPeriod = country_info_map[c].startPeriod;

			if(parseInt(currentPeriod.replace('.', '')) >= parseInt(thisStartPeriod.replace('.', ''))) {
    			return true;
    		} else {
    			return false;
    		}
		} else {
			return false;
		}
	} else {
		return false;
	}
}

var featureFill = function(d) {
	var c = normalizeCountryName(d.properties.name.toUpperCase());

	if(countryAvailable(c)) {
		return '#ccc';
	} else {
		return '#EBEBEB';
	}
};

var featureClass = function(d) {
	var c = normalizeCountryName(d.properties.name.toUpperCase());

	var classes = ['subunit']

	if(country == c) {
		classes.push('selected');
	}

	if(countryAvailable(c)) {
		classes.push('available');
	}

	return classes.join(' ');
};

var countryLabelFill = function(d) {
	var c = normalizeCountryName(d.properties.name.toUpperCase());

	if(countryAvailable(c)) {
		return '#666';
	} else {
		return '#ccc';
	}
}

var placeCapitals = function(cb) {
	d3.selectAll('.capital').attr('class', 'capital old');

	countries.forEach(function(c) {
		var point = projection(c.capitalCoordinate);

		var circle = svg.append('circle')
			.attr('cx', point[0])
			.attr('cy', point[1])
			.attr('r', function(d) {
				if(c.country.toUpperCase() == country) {
					return 3;
				} else {
					return 2;
				}
			})
			.attr('class', 'capital');

		circle.on('mouseover', function() {
			d3.select('#country-name').text('Capital of '+ c.country);
		});

		capital_map[c.country.toUpperCase()] = c.capitalCoordinate;
	});

	d3.selectAll('.capital.old').remove();

	if(cb) {
		cb();
	}
}

var moveMap = function(coordinates, scale, animated) {
	coordinates = [coordinates[0], coordinates[1]]
	
	projection = projection.scale(scale)
	    				   .center(coordinates)
	    				   .translate([650, 350]);
	
	update(animated);
}

var zoomToFeature = function(feature) {
	var coordinates = d3.geo.centroid(feature);
			
	moveMap(coordinates, 2000, true);

	xCo = 35;
	yCo = 58;

	d3.selectAll('.subunit').attr('class', 'subunit');
	d3.select(this).attr('class', 'subunit active');

	currentPosition = [500, 2550];
	currentScale = 2000;
}

var activateDrag = function() {
	var drag = d3.behavior.drag();
	var m0;
	var o0;

	var xCo = 12.3;
	var yCo = 22;

	drag.on('dragstart', function() {
		// Ignore click on subunit
		d3.event.sourceEvent.stopPropagation();
		
		m0 = [d3.event.sourceEvent.pageX, d3.event.sourceEvent.pageY];
	    o0 = projection.center();
	});

	drag.on('drag', function() {
		if(m0) {
	        var m1 = [d3.event.sourceEvent.pageX, d3.event.sourceEvent.pageY],
	            o1 = [o0[0] - (m1[0] - m0[0]) / xCo, o0[1] + (m1[1] - m0[1]) / yCo];  
	        
	        projection = projection.center(o1);
		
			update();
	    }
	});

	svg.call(drag);
}
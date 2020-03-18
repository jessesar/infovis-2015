var slider;
var slideTimer;

var addTimeline = function() {
	slider = d3.slider()
					.min(1995)
					.max(2014)
					.ticks((2014 - 1995))
					.stepValues(d3.range(1995, 2014 + (1/12), (1/12)))
					.showRange(false)
					.tickFormat(function(d) {
						var year = Math.floor(d);

						/* var month = (d - year);
						month = Math.round(month * 12) + 1; */

						return Math.floor(d);
					})
					.value(currentPeriod.split('.')[0])
					.callback(function(slider) {
						clearTimeout(slideTimer);

						period = getPeriodFromSlider(slider.value());
						updatePointer(period, !dragging);

						slideTimer = setTimeout(function() {
							changePeriod(period);

							if(slider.value() == 1995) {
								setTimeout(function() {
									pause();
									
									currentAnimation = 0;
									timelineSpeed = 500;
								}, 250);
							}

							if(slider.value() == 2014) {
								setTimeout(function() {
									pause();
									
									currentAnimation = 0;
									timelineSpeed = 500;
								}, 250);
							}
						}, 5);
					});

	d3.select('#slider').call(slider);

	d3.select('.dragger').on('mouseover', function() {
		pause();
	});

	d3.select('.dragger').on('mouseout', function() {
		if(!dragging) {
			if(currentAnimation == 1) {
				play();
			} else if(currentAnimation == -1) {
				reverse();
			}
		}
	});
};

var getPeriodFromSlider = function(v) {
	v = v.toString();

	var year = v.split('.')[0];
	var month = Math.round((v - year) * 12) + 1;

	month = '0'.substring(0, '00'.length - month.toString().length) + month;

	return year +'.'+ month;
}

var changePeriod = function(period) {
	currentPeriod = period;

	updateVisualisation();
}

var updateVisualisation = function() {
	updateMap();

	createConnections(data[flow]);

	hideFlows(300);

	updateFlows();

	createScales();

	createFlows();
     
	revealFlows(300);

	placeCapitals();

	updateCountryChart(numberOfCountries, true);
	
	d3.select('#current-period').text(currentPeriod.split('.')[0]);
}

var animateInterval;
var currentAnimation = 0;

var pause = function() {
	clearInterval(animateInterval);

	d3.select('.dragger')
		.transition()
	    .duration(0);

	d3.select('#reverse').attr('class', '');
	d3.select('#play').attr('class', '');

	d3.select('#play').style('display', 'inline-block');
	d3.select('#reverse').style('display', 'inline-block');
	d3.select('#pause').style('display', 'none');

	d3.select('#speed').text('0x');
}

var play = function() {
	if(slider.value() == 2014) {
		slider.setValue(1995);
	}

	clearInterval(animateInterval);

	animateInterval = setInterval(function() {
		slider.setValue(parseFloat(slider.value()) + (3/12));
	}, timelineSpeed);

	d3.select('#reverse').attr('class', '');
	d3.select('#play').attr('class', 'active');

	d3.select('#play').style('display', 'none');
	d3.select('#pause').style('display', 'inline-block');
	d3.select('#reverse').style('display', 'inline-block');

	if(timelineSpeed == 500) {
		d3.select('#speed').text('1x');
	} else {
		d3.select('#speed').text('2x');
	}
}

var reverse = function() {
	clearInterval(animateInterval);

	animateInterval = setInterval(function() {
		slider.setValue(parseFloat(slider.value()) - (3/12));
	}, timelineSpeed);

	d3.select('#reverse').attr('class', 'active');
	d3.select('#play').attr('class', '');

	d3.select('#reverse').style('display', 'none');
	d3.select('#pause').style('display', 'inline-block');
	d3.select('#play').style('display', 'inline-block');

	d3.select('#speed').text('1x');
}

var dragging = false;

var customDragStart = function() {
	pause();

	dragging = true;
}

var customDragStop = function() {
	setTimeout(function() {
		if(currentAnimation == 1) {
			play();
		} else if(currentAnimation == -1) {
			reverse();
		}
	}, 100);

	dragging = false;
}

$(document).keydown(function(e) {
	if(e.keyCode == 32) {
		if(currentAnimation == 0) {
			play();
			currentAnimation = 1;
		} else {
			if(currentAnimation == 1 && timelineSpeed == 500) {
				timelineSpeed = 200;
				d3.select('#speed').text('2x');

				pause();
				play();
			} else {
				pause();
				currentAnimation = 0;

				timelineSpeed = 500;
			}
		}
	}
});

window.onresize = function(event) {
	d3.select('#slider').select('svg').remove();

    d3.select('#slider').call(slider);
};

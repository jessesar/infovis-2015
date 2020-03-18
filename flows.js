var constructControlPoint = function(a, b, h) {
	var xP1 = (a[0] < b[0]) ? a : b;
	var xP2 = (a[0] < b[0]) ? b : a;

	var yP1 = (a[1] < b[1]) ? a : b;
	var yP2 = (a[1] < b[1]) ? b : a;

	var x = xP1[0] + ((xP2[0] - xP1[0]) / 2);
	var y = yP1[1] + ((yP2[1] - yP1[1]) / 2);
		          
	var xDiff = (b[0] - a[0]);
	var yDiff = (a[1] - b[1]);

	var b = Math.atan(yDiff / xDiff) * 180 / Math.PI;
	var a = 90 - b;

	var h = h * Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)) / 30;

	x += -h * Math.cos(a * (Math.PI / 180));
	y += -h * Math.sin(a * (Math.PI / 180));

	return { x: x, y: y }
}

var flowLine = d3.svg.line()
					.interpolate(function(points) {
						var controlPoint = constructControlPoint(points[0], points[1], 5);

						return points.join(' Q'+ controlPoint.x +','+ controlPoint.y +' ');
					})
				      
					.x(function(country) {
						var feature = country_map[country];

						// var coordinates = d3.geo.centroid(feature);
						var coordinates = capital_map[country];

						return projection(coordinates)[0];
					})

					.y(function(country) {
						var feature = country_map[country];
						
						// var coordinates = d3.geo.centroid(feature);
						var coordinates = capital_map[country];

						return projection(coordinates)[1];
					});

var createFlows = function() {
	svg.selectAll('.connection')
		.data(connections, function(d) {
			return d.countries[0] +'-'+ d.countries[1];
		})
		.enter()
		 .append('path')
		 .attr('class', 'connection')
		 .attr('d', function(d) {
			 return flowLine(d.countries);
		 })
		 .attr('stroke-width', function(d) {
			 return widthScale(d.value);
		 })
		 .attr('stroke', function(d) {
			 return colorScale(d.value);
	     })
	     .attr('clip-path', function(d) {
		     return 'url(#clip-'+ d.countries[0].replace(' ', '') +'-'+ d.countries[1].replace(' ', '') +')';
	     })
		 .attr('opacity', function(d) {
			 return opacityScale(d.value);
			 //return 0.8;
		 });
}

var setCategory = function(f) {
	flow = f;

	pause();
	updateVisualisation();

	setTimeout(function() {
		if(currentAnimation == 1) {
			play();
		} else if(currentAnimation == -1) {
			reverse();
		}
	}, 100);
}

var updateFlows = function() {
	svg.selectAll('.connection')
		.data(connections, function(d) {
			return d.countries[0] +'-'+ d.countries[1];
		})
		.transition()
		.duration(300)
		.attr('stroke-width', function(d) {
			return widthScale(d.value);
		})
		.attr('opacity', function(d) {
			 return opacityScale(d.value);
			 //return 0.8;
		});
}

var deleteFlows = function() {
	svg.selectAll('.connection')
		.data(connections, function(d) {
			return d.countries[0] +'-'+ d.countries[1];
		})
		.exit()
		.remove();
}
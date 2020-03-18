var revealFlows = function(animationDuration) {
	if(!animationDuration) {
		animationDuration = 700;
	}

	svg.selectAll('.connectionClipPath')
		.data(connections, function(d) {
			return d.countries[0] +'-'+ d.countries[1];
		})
		.enter()
		 .append('svg:clipPath')
	     .attr('id', function(d) {
		     return 'clip-'+ d.countries[0].replace(' ', '') +'-'+ d.countries[1].replace(' ', '');
	     })
	     .attr('class', 'connectionClipPath')
	     .append("svg:rect")
		 .attr('class', 'connectionClip')
		 .attr('x', function(d) {
			 var feature = country_map[d.countries[0]];
			 
			 // var coordinates = d3.geo.centroid(feature);
			 var coordinates = capital_map[d.countries[0]];
			 
			 return projection(coordinates)[0] - 250;
		 })
		 .attr('y', function(d) {
			 var feature = country_map[d.countries[0]];
			 
			 // var coordinates = d3.geo.centroid(feature);
			 var coordinates = capital_map[d.countries[0]];
			 
			 return projection(coordinates)[1] - 20;
		 })
		 .attr('transform', function(d) {
			var points = [];
			
			d.countries.forEach(function(country) {
				var feature = country_map[country];
				
				// var coordinates = d3.geo.centroid(feature);
				var coordinates = capital_map[country];
				
				var point = projection(coordinates);
				
				points.push(point);
			});
			 
			var xDiff = (points[1][0] - points[0][0]);
            var yDiff = (points[1][1] - points[0][1]);
          
            var a = Math.atan(xDiff / yDiff) * 180 / Math.PI;
            
            if(xDiff > 0 && yDiff > 0) {
	            a = 1 * a;
            } else if(xDiff < 0 && yDiff < 0) {
	            a = -1 * (180 - a);
            } else if(xDiff > 0 && yDiff < 0) {
	            a = a + 180;
            }
			 
			return 'rotate('+ -a +' '+ (points[0][0]) +' '+ points[0][1] +')'; 
		 })
		 .attr('width', '500px')
		 .attr('height', 0)
		 .attr('data-to', function(d) {
			 return d.countries[1];
		 })
		 
		 .transition()
		 .duration(animationDuration)
		 
		 .attr('height', function(d) {
			var points = [];
			
			d.countries.forEach(function(country) {
				var feature = country_map[country];
				
				// var coordinates = d3.geo.centroid(feature);
			 	var coordinates = capital_map[country];
				
				var point = projection(coordinates);
				
				points.push(point);
			});
			 
			var xDiff = (points[1][0] - points[0][0]);
            var yDiff = (points[1][1] - points[0][1]);
			 
		 	return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)) + 26; 
		 });
}

var hideFlows = function(animationDuration) {
	if(!animationDuration) {
		animationDuration = 700;
	}

	svg.selectAll('.connectionClip')
		.data(connections, function(d) {
			return d.countries[0] +'-'+ d.countries[1];
		})
		.exit()
		.transition()
		.duration(animationDuration)

		.attr('height', 0);

	setTimeout(function() {
		svg.selectAll('.connection')
			.data(connections, function(d) {
				return d.countries[0] +'-'+ d.countries[1];
			})
			.exit()

			.remove();
	}, animationDuration + 100);

	setTimeout(function() {
		svg.selectAll('.connectionClipPath')
			.data(connections, function(d) {
				return d.countries[0] +'-'+ d.countries[1];
			})
			.exit()

			.remove();
	}, animationDuration + 100);
}

var animateFlows = function() {
	var addClipRect = function(clip, startY, country) {
		clip.append('rect')
			.attr('x', function() {
				 d = country;

				 var feature = country_map[d.countries[0]];
				 
				 // var coordinates = d3.geo.centroid(feature);
			 	 var coordinates = capital_map[d.countries[0]];
				 
				 return projection(coordinates)[0] - 50;
			 })
			 .attr('y', function() {
			 	 d = country;

				 var feature = country_map[d.countries[0]];
				 
				 // var coordinates = d3.geo.centroid(feature);
			 	 var coordinates = capital_map[d.countries[0]];
				 
				 return projection(coordinates)[1] + startY;
			 })
			 .attr('transform', function() {
			 	d = country;

				var points = [];
				
				d.countries.forEach(function(country) {
					var feature = country_map[country];
					
					// var coordinates = d3.geo.centroid(feature);
			 		var coordinates = capital_map[country];
					
					var point = projection(coordinates);
					
					points.push(point);
				});
				 
				var xDiff = (points[1][0] - points[0][0]);
	            var yDiff = (points[1][1] - points[0][1]);
	          
	            var a = Math.atan(xDiff / yDiff) * 180 / Math.PI;
	            
	            if(xDiff > 0 && yDiff > 0) {
		            a = 1 * a;
	            } else if(xDiff < 0 && yDiff < 0) {
		            a = -1 * (180 - a);
	            } else if(xDiff > 0 && yDiff < 0) {
		            a = a + 180;
	            }
				 
				return 'rotate('+ -a +' '+ (points[0][0]) +' '+ points[0][1] +')'; 
			 })
			 .attr('width', '100px')
			 .attr('height', '16px')
			 .attr('fill', 'blue')

			 .transition()
			 .duration(10000)
			 .ease('linear')

			 .attr('y', function() {
			 	 d = country;

				 var feature = country_map[d.countries[0]];
				 
				 // var coordinates = d3.geo.centroid(feature);
			 	 var coordinates = capital_map[d.countries[0]];
				 
				 return projection(coordinates)[1] + startY + 200;
			 });
	}

	var addClipRects = function(clip, n, country) {
		for(var i = n; i >= 0; i--) {
			addClipRect(clip, 360 - (i * 20), country);
		}
	}

	setTimeout(function() {
		svg.selectAll('.connection').each(function(d) {
			var clip = svg.append('clipPath')
							.attr('id', 'flow-'+ d.countries[0] +'-'+ d.countries[1].replace(' ', ''))

			addClipRects(clip, 40, d);
		});

		svg.selectAll('.connection')
			 .data(connections)
		     .attr('clip-path', function(d) {
				return 'url(#flow-'+ d.countries[0] +'-'+ d.countries[1].replace(' ', '') +')';
		     });
	}, 1380);
}
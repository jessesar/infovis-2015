var excludedCountries = ['GERMANY DEMOCRATIC REPUBLIC'];

var filterData = function(data) {
	excludedCountries.forEach(function(country) {
		delete data[country];
	});

	return data;
}

var normalizeCountryName = function(name) {
	switch(name) {
		case 'GERMANY (incl DD from 1991)':
			name = 'GERMANY';
			break;

		case 'CZECH REPUBLIC (CS->1992)':
			name = 'CZECH REPUBLIC';
			break;

		case 'BELGIUM (and LUXBG -> 1998)':
			name = 'BELGIUM';
			break;

		case 'NORWAY (incl.SJ excl.1995,1996)':
			name = 'NORWAY';
			break;

		case 'RUSSIAN FEDERATION (RUSSIA)':
			name = 'RUSSIA';
			break;
	}

	return name;
}

var loadCountryInfo = function(cb) {
	d3.json('data/countries.json', function(c) {
		countries = c;

		countries.forEach(function(c) {
			country_info_map[c.country.toUpperCase()] = c;
		})

		cb();
	});
}

var createConnections = function(data) {
	if(flow == 'EXPORT') {
		d3.select('#export').attr('class', 'active');
		d3.select('#import').attr('class', '');
	} else {
		d3.select('#export').attr('class', '');
		d3.select('#import').attr('class', 'active');
	}

	connections = [];

	Object.keys(data).forEach(function(partnerCountry) {
		var newConnection = {};

		newConnection.value = parseInt(data[partnerCountry][currentPeriod].toString().replace(/,/g, ''));

		partnerCountry = normalizeCountryName(partnerCountry);
		newConnection.countries = [country, partnerCountry];

		connections.push(newConnection);
	});

	var connectionsDomain = d3.extent(connections, function(d) {
							 	return d.value;
							});

	quantizeScale = d3.scale.quantize().domain(connectionsDomain).range(['bottom', 'top']);

	connections.sort(function(a, b) {
		return b.value - a.value;
	});

	connections = connections.slice(0, 10);
	connections.reverse();
}

var createScales = function() {
	var connectionsDomain = d3.extent(connections, function(d) {
							 	return d.value;
							});

	widthScale = d3.scale.linear()
							 .domain(connectionsDomain)
							 .range([2, 10]);

	opacityScale = d3.scale.linear()
							 .domain(connectionsDomain)
							 .range([0.3, 0.85]);

	colorScale = d3.scale.linear()
						 .domain(connectionsDomain)
						 .range(['#DB5D59', '#DB5D59']);
}
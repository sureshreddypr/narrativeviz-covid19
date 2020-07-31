(function (d3, topojson) {
  'use strict';

  const loadAndProcessData = () => 
  	Promise
  	.all([d3.json('https://covid.ourworldindata.org/data/owid-covid-data.json'),
        d3.json('https://unpkg.com/visionscarto-world-atlas@0.0.4/world/50m.json')])
    .then( ([unData, topoJSONdata]) => {
      // console.log(unData);
    	const rowById = unData.reduce((accumulator, d) => {
      	accumulator[d['Country code']] = d;
        return accumulator;
      }, {});
      const countries = topojson.feature(topoJSONdata, 
                                topoJSONdata.objects.countries);


    	// Use another foreach function to map 
      // each country's data into d.properties, 
      // where d is an individual "country feature".
    	countries.features.forEach(d => {
      	Object.assign(d.properties, rowById[+d.id]);
      });
      
      const covidMetadata = countries.features
      	.filter(d => d.properties['total_cases'])
        .map(d => {
          d.properties['total_cases'] = +d.properties['toal_cases'].replace(/ /g, '') * 1000;
          return d;
        });
      
      return {
        features: countries.features, 
        covidMetadata
      };
    });

  const sizeLegend = (selection, props) => {
    
    const { sizeScale, spacing, textOffset, numTicks, populationFormat } = props;
    // This is just the update selection.
    
    const ticks = sizeScale.ticks(numTicks).filter(d => d !== 0);
    const groups = selection.selectAll('g').data(ticks);
    
    const groupsEnter = groups.enter().append('g')
    	.attr('class', 'ticks'); 
    
    groupsEnter
      .merge(groups)
      	.attr('transform', (d, i) => `translate(0, ${i * spacing})`);
    groups.exit().remove();
    
    groupsEnter.append('circle')
    		// .attr('cx', xPosition)
    		// .attr('cy', height/2)
    	.merge(groups.select('circle'))
        .attr('r', sizeScale);
    
    groupsEnter.append('text')
    		// .attr('cx', xPosition)
    		// .attr('cy', height/2)
    	.merge(groups.select('text'))
        .text(d => populationFormat(d))
    		.attr('x', textOffset)
    		.attr('dy', '0.32em');
  };

  const svg = d3.select('svg');

  const projection = d3.geoNaturalEarth1();
  const pathGenerator = d3.geoPath().projection(projection);

  const g = svg.append('g');

  g.append('path')
  	.attr('class', 'sphere')
  	.attr('d', pathGenerator({type: 'Sphere'}));

  svg.call(d3.zoom().on('zoom', () => {
  	g.attr('transform', d3.event.transform);
  }));

  const radiusValue = d => d.properties['2018'];
  const populationFormat = d3.format(',');

  loadAndProcessData().then(countries => {
    
    const sizeScale = d3.scaleSqrt();

    sizeScale
      .domain([0, d3.max(countries.features, radiusValue)])
    	.range([0, 23]);
    
    g.append('g')
      .attr('transform', `translate(50, 280)`)
      .call(sizeLegend, {
        sizeScale, 
        spacing: 30,
        textOffset: 25,
        numTicks: 5,
      	populationFormat: d3.format(',')
    })
    .append('text')
      .attr('class', 'legend-title')
      .text('Scale (population)')
      .attr('y', -30)
      .attr('x', -15);
    
    g.selectAll('.legend-rect').data([null])
    	.enter().append('rect')
    		.attr('class', '.legend-rect')
    		.attr('height', 265)
    		.attr('width', 137)
    		.attr('opacity', 0.3)
    		.attr('y', 225)
    		.attr('x', 20)
    		.attr('rx', 20);
    
  	g.selectAll('path')
      .data(countries.features)
      .enter().append('path')
        .attr('class', 'country')
        .attr('d', pathGenerator)
        .attr('fill', d => d.properties['2018'] ? '#b59d70' : '#b34f44')
      .append('title')
        .text(d => isNaN(radiusValue(d)) 
                ? 'missing' 
                : [d.properties['Region, subregion, country or area *'], 
                      populationFormat(radiusValue(d))
                     ].join(': '));
    
    countries.featuresWithPopulation.forEach(d => {
    	d.properties.projected = projection(d3.geoCentroid(d));
    });
      
    g.selectAll('circle')
      .data(countries.featuresWithPopulation)
      .enter().append('circle')
    		.attr('class', 'country-circle')
    		.attr('cx', d => d.properties.projected[0])
        .attr('cy', d => d.properties.projected[1])
    		.attr('r', d => sizeScale(radiusValue(d)));

  });

}(d3, topojson));

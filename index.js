import { select, 
        json, 
        geoPath, 
        geoNaturalEarth1, 
        geoCentroid,
        zoom, 
        event,
        scaleOrdinal,
        schemeSpectral,
       	scaleSqrt,
       	max,
        format } from 'd3';
import { loadAndProcessData } from './loadAndProcessData'
import { sizeLegend } from './sizeLegend'

const svg = select('svg');

const projection = geoNaturalEarth1();
const pathGenerator = geoPath().projection(projection)

const g = svg.append('g')

g.append('path')
	.attr('class', 'sphere')
	.attr('d', pathGenerator({type: 'Sphere'}))

svg.call(zoom().on('zoom', () => {
	g.attr('transform', event.transform)
}))

const radiusValue = d => d.properties['2018'];
const populationFormat = format(',');

loadAndProcessData().then(countries => {
  
  const sizeScale = scaleSqrt();

  sizeScale
    .domain([0, max(countries.features, radiusValue)])
  	.range([0, 23])
  
  g.append('g')
    .attr('transform', `translate(50, 280)`)
    .call(sizeLegend, {
      sizeScale, 
      spacing: 30,
      textOffset: 25,
      numTicks: 5,
    	populationFormat: format(',')
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
  		.attr('rx', 20)
  
	g.selectAll('path')
    .data(countries.features)
    .enter().append('path')
      .attr('class', 'country')
      .attr('d', pathGenerator)
      .attr('fill', d => d.properties['2018'] ? '#b59d70' : '#b34f44')
    .append('title')
      .text(d => isNaN(radiusValue(d)) 
              ? 'No cases reported' 
              : [d.properties['Region, subregion, country or area *'], 
                    populationFormat(radiusValue(d))
                   ].join(': '))
  
  countries.featuresWithPopulation.forEach(d => {
  	d.properties.projected = projection(geoCentroid(d));
  })
    
  g.selectAll('circle')
    .data(countries.featuresWithPopulation)
    .enter().append('circle')
  		.attr('class', 'country-circle')
  		.attr('cx', d => d.properties.projected[0])
      .attr('cy', d => d.properties.projected[1])
  		.attr('r', d => sizeScale(radiusValue(d)))

})

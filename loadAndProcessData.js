import { feature } from 'topojson'
import { csv, json } from 'd3'

export const loadAndProcessData = () => 
	Promise
	.all([json('https://covid.ourworldindata.org/data/owid-covid-data.json'),
      json('https://unpkg.com/visionscarto-world-atlas@0.0.4/world/50m.json')])
  .then( ([unData, topoJSONdata]) => {
    // console.log(unData);
  	const rowById = unData.reduce((accumulator, d) => {
    	accumulator[d['Country code']] = d;
      return accumulator;
    }, {})
    const countries = feature(topoJSONdata, 
                              topoJSONdata.objects.countries);


  	// Use another foreach function to map 
    // each country's data into d.properties, 
    // where d is an individual "country feature".
  	countries.features.forEach(d => {
    	Object.assign(d.properties, rowById[+d.id]);
    })
    
    const covidMetadata = countries.features
    	.filter(d => d.properties['total_cases'])
      .map(d => {
        d.properties['total_cases'] = +d.properties['total_cases'].replace(/ /g, '') * 1000;
        return d;
      })
    
    return {
      features: countries.features, 
      covidMetadata
    };
  });

import { feature } from 'topojson'
import { csv, json } from 'd3'

export const loadAndProcessData = () => 
	Promise
	.all([csv('https://github.com/sureshreddypr/narrativeviz-covid19/covid19_full_data_jul272020.csv'),
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
    
    const featuresWithPopulation = countries.features
    	.filter(d => d.properties['location'])
      .map(d => {
        d.properties['location'] = +d.properties['location'].replace(/ /g, '') * 1000;
        return d;
      })
    
    return {
      features: countries.features, 
      featuresWithPopulation
    };
  });

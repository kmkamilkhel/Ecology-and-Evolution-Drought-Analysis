// Define the list of years to evaluate
var yearsEval = ee.List.sequence({
  start: 2000,
  end: 2023,
  step: 1
});

print('Years:', yearsEval);

// Function to estimate sigma from the data
var estimateSigma = function(dataset) {
  var diff = dataset.map(function(image) {
    return image.select('NIR').subtract(image.select('Red')).abs();
  });

  var sigma = diff.mean().reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyarea.geometry(),
    scale: 30,
    maxPixels: 1e13
  }).get('NIR');

  return ee.Number(sigma);
};

// Function to calculate kNDVI using the RBF kernel
var calculateKNDVI = function(nir, red, sigma) {
  var kndvi = ee.Image().expression(
    'tanh((pow((nir - red), 2)) / (2 * pow(sigma, 2)))',
    {
      'nir': nir,
      'red': red,
      'sigma': sigma
    }
  ).rename('kNDVI');
  
  return kndvi;
};

// Function to get the appropriate Landsat collection for a given year
var getLandsatCollection = function(year, startDate, endDate) {
  if (year >= 2013) {
    // Landsat 8 (OLI)
    return ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .filter(ee.Filter.date(startDate, endDate))
      .filterBounds(studyarea)
      .select(['SR_B5', 'SR_B4'], ['NIR', 'Red']);
  } else {
    // Landsat 5 (TM)
    return ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
      .filter(ee.Filter.date(startDate, endDate))
      .filterBounds(studyarea)
      .select(['SR_B4', 'SR_B3'], ['NIR', 'Red']);
  }
};

// Function to calculate the seasonal kNDVI for a given season and year
var calculateSeasonalKNDVI = function(year, season) {
  var dateStart, dateEnd;
  
  if (season === 'Summer') {
    dateStart = ee.Date.fromYMD(year, 6, 1);
    dateEnd = ee.Date.fromYMD(year, 8, 31);
  } else if (season === 'Spring') {
    dateStart = ee.Date.fromYMD(year, 3, 1);
    dateEnd = ee.Date.fromYMD(year, 5, 31);
  } else if (season === 'Autumn') {
    dateStart = ee.Date.fromYMD(year, 9, 1);
    dateEnd = ee.Date.fromYMD(year, 11, 30);
  } else {
    print('Unknown season:', season);
    return null;
  }
  
  var dataset = getLandsatCollection(year, dateStart, dateEnd);

  // Scale the reflectance values to [0, 1]
  var landsatScaled = dataset.map(function(image) {
    return image.multiply(0.0000275).add(-0.2); // Scale factor for Landsat Collection 2 Level-2
  });

  // Estimate sigma from the data
  var sigma = estimateSigma(landsatScaled);

  // Calculate kNDVI for each image in the collection
  var kndviCollection = landsatScaled.map(function(image) {
    return calculateKNDVI(image.select('NIR'), image.select('Red'), sigma);
  });

  // Calculate the seasonal median kNDVI
  var kndviSeasonal = kndviCollection.median().clip(studyarea).rename('kNDVI_' + season + '_' + year);
  
  return kndviSeasonal.set({'year': year, 'season': season});
};

// Iterate over the years and seasons, create export tasks for each seasonal kNDVI image
yearsEval.evaluate(function(years) {
  var seasons = ['Summer', 'Spring', 'Autumn'];
  
  years.forEach(function(year) {
    seasons.forEach(function(season) {
      var kndviImage = calculateSeasonalKNDVI(year, season);
      
      if (kndviImage !== null) {
        Export.image.toDrive({
          image: kndviImage,
          description: 'kNDVI_' + season + '_' + year,
          folder: 'kNDVI_Seasonal',
          fileNamePrefix: 'kNDVI_' + season + '_' + year,
          scale: 30,
          region: studyarea.geometry(),
          crs: 'EPSG:4326',
          maxPixels: 1e13
        });
      }
    });
  });
});

// Example: Display the kNDVI image for Summer 2023
var imageSummer2023 = calculateSeasonalKNDVI(2023, 'Summer');

Map.centerObject(studyarea, 8);
Map.addLayer(imageSummer2023, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'kNDVI Summer 2023');

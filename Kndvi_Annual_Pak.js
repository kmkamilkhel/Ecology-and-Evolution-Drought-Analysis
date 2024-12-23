// Define the list of years to evaluate
var yearsEval = ee.List.sequence({
  start: 2000,
  end: 2023,
  step: 1
});

print('Years:', yearsEval);

// Function to estimate sigma from the data
var estimateSigma = function(dataset) {
  // Calculate the absolute difference between NIR and Red bands
  var diff = dataset.map(function(image) {
    return image.select('sur_refl_b02').subtract(image.select('sur_refl_b01')).abs();
  });

  // Compute the mean of these differences across all images
  var sigma = diff.mean().reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyarea.geometry(),
    scale: 500,
    maxPixels: 1e13
  }).get('sur_refl_b02');  // We use 'sur_refl_b02' as a reference since the output is a scalar

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

// Function to calculate the annual kNDVI for a given year
var calculateAnnualKNDVI = function(year){
  
  // Define start and end dates for the whole year
  var dateStart = ee.Date.fromYMD(year, 1, 1);
  var dateEnd = ee.Date.fromYMD(year, 12, 31);
  
  // Filter image collection according to dates, study area, and select NIR and Red bands
  var dataset = ee.ImageCollection('MODIS/061/MOD13A1') 
    .filter(ee.Filter.date(dateStart, dateEnd))
    .filterBounds(studyarea)
    .select(['sur_refl_b02', 'sur_refl_b01']);  // NIR = b02, Red = b01

  // Scale the reflectance values to [0, 1]
  var modisScaled = dataset.map(function(image) {
    return image.divide(10000);
  });

  // Estimate sigma from the data
  var sigma = estimateSigma(modisScaled);

  // Calculate kNDVI for each image in the collection
  var kndviCollection = modisScaled.map(function(image) {
    return calculateKNDVI(image.select('sur_refl_b02'), image.select('sur_refl_b01'), sigma);
  });

  // Calculate the annual median kNDVI
  var kndviAnnual = kndviCollection.median().clip(studyarea).rename('kNDVI_' + year);
  
  // Set the year property
  return kndviAnnual.set({'year': year});
};

// Iterate over the years, create export tasks for each annual kNDVI image
yearsEval.evaluate(function(years) {
  years.forEach(function(year) {
    var kndviImage = calculateAnnualKNDVI(year);
    
    if (kndviImage !== null) {
      // Export the kNDVI image to Google Drive
      Export.image.toDrive({
        image: kndviImage,
        description: 'kNDVI_ST' + year,
        folder: 'kNDVI_ST',
        fileNamePrefix: 'kNDVI_ST' + year,
        scale: 500,
        region: studyarea.geometry(),
        crs: 'EPSG:4326',  // Specify WGS 84 as the CRS
        maxPixels: 1e13
      });
    }
  });
});

// Example: Display the kNDVI image for 2023
var image2023 = calculateAnnualKNDVI(2023);

// Add the kNDVI 2023 image to the map
Map.centerObject(studyarea, 6);  // Center the map on your study area with a zoom level of 8
Map.addLayer(image2023, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'kNDVI 2023');


// Initialize the map
console.log("Initializing the map");

// Create the tile layer background
let basemap = L.tileLayer(
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'",
  {
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  });

// Function to determine marker size based on magnitude
function markerSize(mag) {
  let radius = 1;


  if (mag > 0) {
    radius = mag ** 5;
  }

  return radius
}

// Function to choose color based on depth
function chooseColor(depth) {
  let color = "black";

  // Depth colors
  if (depth <= 10) {
    color = "#EDD1FF";
  } else if (depth <= 30) {
    color = "#8ECAE9";
  } else if (depth <= 50) {
    color = "#62CE60";
  } else if (depth <= 70) {
    color = "#F4A436";
  } else if (depth <= 90) {
    color = "#D7743D";
  } else {
    color = "#D7263D";
  }

  // return color
  return (color);
}


// Function to create the map
function createMap(data, geo_data) {
  // STEP 1: Initialize Base Layers

  // Tile layer variables
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Overlay layers
  let markers = L.markerClusterGroup();
  let heatArray = [];
  let circleArray = [];

  for (let i = 0; i < data.length; i++){
    let row = data[i];
    let location = row.geometry;

    // Create marker
    if (location) {
      // Extract coordinates
      let point = [location.coordinates[1], location.coordinates[0]];
      
      // Convert timestamp to date
      let timestamp = row.properties.time;
      let date = new Date(timestamp);

      // Format the date and time
      let formattedDateTime = date.toLocaleString(); // Convert unix to readable format
      
      // Make marker
      let marker = L.marker(point);
      let popup = `<h1>${row.properties.title} ${formattedDateTime}</h1>`; // Include title and formatted date/time in the popup
      marker.bindPopup(popup);
      markers.addLayer(marker);

      // Add marker to array
      heatArray.push(point);

      // Define and create circle marker
      let circleMarker = L.circle(point, {
        fillOpacity: 0.75,
        color: chooseColor(location.coordinates[2]),
        fillColor: chooseColor(location.coordinates[2]),
        radius: markerSize(row.properties.mag)
      }).bindPopup(popup);

      circleArray.push(circleMarker);
    }
  }

  // create layer
  let heatLayer = L.heatLayer(heatArray, {
    radius: 25,
    blur: 20
  });

  let circleLayer = L.layerGroup(circleArray);

  // tectonic plate layer
  let geo_layer = L.geoJSON(geo_data, {
    style: {
      "color": "maroon",
      "weight": 3
    }
  });

  // Step 3: BUILD the Layer Controls

  // Only one base layer can be shown at a time.
  let baseLayers = {
    Street: street,
    Topography: topo
  };

  let overlayLayers = {
    Markers: markers,
    Heatmap: heatLayer,
    Circles: circleLayer,
    "Tectonic Plates": geo_layer
  }

  // Step 4: Initialize the Map
  let myMap = L.map("map", {
    center: [30, -40],
    zoom: 2,
    layers: [street, markers, geo_layer]
  });


  // Step 5: Add the Layer Control filter + legends as needed
  L.control.layers(baseLayers, overlayLayers).addTo(myMap);

  // Step 6: Legend
  let legend = L.control({ position: "bottomleft" });
  legend.onAdd = function() {
    let div = L.DomUtil.create("div", "info legend");

    let legendInfo = "<h4>Legend</h4>"
    legendInfo += "<i style='background: #EDD1FF'></i>-10-10<br/>";
    legendInfo += "<i style='background: #8ECAE9'></i>10-30<br/>";
    legendInfo += "<i style='background: #62CE60'></i>30-50<br/>";
    legendInfo += "<i style='background: #F4A436'></i>50-70<br/>";
    legendInfo += "<i style='background: #D7743D'></i>70-90<br/>";
    legendInfo += "<i style='background: #D7263D'></i>90+";

    div.innerHTML = legendInfo;
    return div;
  };

  // Adding the legend to the map
  legend.addTo(myMap);
}

// Function to create the map
function quakeMap() {

  // Assemble the API query URL
  let earthquake = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
  let tectonic = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

  d3.json(earthquake).then(function (data) {
    // console.log(data);
    d3.json(tectonic).then(function (geo_data) {
      let data_rows = data.features;

      // make map with both datasets
      createMap(data_rows, geo_data);
    });
  });
}

quakeMap();

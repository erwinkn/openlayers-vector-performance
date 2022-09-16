## OpenLayers vector performance issue
Reproduction of a performance issue with OpenLayers when rendering a 300kB gzipped GeoJSON.

The layer in question has 7,882 features and 68,921 points according to PostGIS:
```
=> select count(*) from published.electricity_prices;
 count 
-------
  7882
(1 row)

=> SELECT sum(ST_NPoints(geometry)) FROM published.electricity_prices;
  sum  
-------
 68921
(1 row)
```

The performance issue is a bit surprising, since OpenLayers has an example of rendering a LineString of 700,000+ points without any issue: https://openlayers.org/en/latest/examples/fractal.html

The data is a map of electricity prices for different US utilities. The geometries are MultiPolygon, simplified from the exact shape of US counties.

A lot of MultiPolygons overlap, due to a naive handling of multiple data points for a single county. I don't know whether this is the source of the performance issue.
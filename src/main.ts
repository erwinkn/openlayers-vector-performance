import { Map, VectorTile, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM, Vector as VectorSource } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import OLGeoJSON from "ol/format/GeoJSON";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import { Projection } from "ol/proj";
import { geojsonIndexReplacer } from "./geojson-vt";
import { WebGLLayer } from "./webgl";
import { Map as MapLibreMap } from "maplibre-gl";

import geojsonvt from "geojson-vt";
import type { GeoJSON } from "geojson";

import "ol/ol.css";

function getData() {
	return fetch("/electricity_prices.json").then((x) => x.json());
}

async function renderOL(data: unknown) {
	const view = new View({
		center: [0, 0],
		zoom: 1,
	});

	const features = new OLGeoJSON().readFeatures(data, {
		dataProjection: "EPSG:4326",
		featureProjection: "EPSG:3857",
	});

	const source = new VectorSource({
		features,
	});
	new Map({
		target: "ol",
		layers: [
			new TileLayer({
				source: new OSM(),
			}),
			new VectorLayer({
				source,
			}),
		],
		view,
	});

	view.fit(source.getExtent());
}

async function renderOLGeojsonVT(data: GeoJSON) {
	const view = new View({
		center: [0, 0],
		zoom: 1,
	});

	const map = new Map({
		target: "ol-geojson-vt",
		layers: [
			new TileLayer({
				source: new OSM(),
			}),
		],
		view,
	});

	const tileIndex = geojsonvt(data, {
		extent: 4096, // tile extent (both width and height)
		debug: 1, // logging level (0 to disable, 1 or 2)
		promoteId: "fid", // name of a feature property to promote to feature.id. Cannot be used with `generateId`
	});
	console.log("Tiles created:");
	console.log(tileIndex.tileCoords);
	const format = new OLGeoJSON({
		// Data returned from geojson-vt is in tile pixel units
		dataProjection: new Projection({
			code: "TILE_PIXELS",
			units: "tile-pixels",
			extent: [0, 0, 4096, 4096],
		}),
	});
	const source = new VectorTileSource({
		tileUrlFunction: function (tileCoord) {
			// Use the tile coordinate as a pseudo URL for caching purposes
			return JSON.stringify(tileCoord);
		},
		tileLoadFunction: function (tile: VectorTile, url: string) {
			const tileCoord = JSON.parse(url);
			const data = tileIndex.getTile(tileCoord[0], tileCoord[1], tileCoord[2]);
			const geojson = JSON.stringify(
				{
					type: "FeatureCollection",
					features: data ? data.features : [],
				},
				geojsonIndexReplacer
			);
			const features = format.readFeatures(geojson, {
				extent: source.getTileGrid()!.getTileCoordExtent(tileCoord),
				featureProjection: map.getView().getProjection(),
			});
			tile.setFeatures(features);
			// TypeScript not happy with a more precise argument type of VectorTile instead of Tile
		} as any,
	});

	const layer = new VectorTileLayer({
		source,
	});
	map.addLayer(layer);

	// quick way to get an extent
	const extent = new VectorSource({
		features: new OLGeoJSON().readFeatures(data, {
			dataProjection: "EPSG:4326",
			featureProjection: "EPSG:3857",
		}),
	}).getExtent();

	view.fit(extent);
}

async function renderOLWebGL(data: unknown) {
	const view = new View({
		center: [0, 0],
		zoom: 1,
	});

	const features = new OLGeoJSON().readFeatures(data, {
		dataProjection: "EPSG:4326",
		featureProjection: "EPSG:3857",
	});

	const source = new VectorSource({
		features,
	});

	new Map({
		target: "ol-webgl",
		layers: [
			new TileLayer({
				source: new OSM(),
			}),
			new WebGLLayer({
				source,
			}),
		],
		view,
	});

	view.fit(source.getExtent());
}

async function renderMapLibre(data: any) {
	const map = new MapLibreMap({
		container: "maplibre", // container id
		style: "https://demotiles.maplibre.org/style.json", // style URL
		center: [0, 0], // starting position [lng, lat]
		zoom: 1, // starting zoom
	});
	map.on("load", () => {
		map.addSource('electricity-prices', {
			type: "geojson",
			data,
		});
		map.addLayer({
			id: 'electricity-prices',
			source: 'electricity-prices',
			type: "fill",
			layout: {},
			paint: {
				"fill-color": "#088",
				"fill-opacity": 0.8,
			},
		});
	});
}

async function renderPage() {
	const data = await getData();
	await Promise.all([
		renderOL(data),
		renderOLGeojsonVT(data),
		renderOLWebGL(data),
		renderMapLibre(data)
	]);
}

renderPage();

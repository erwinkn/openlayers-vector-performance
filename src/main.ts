import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM, Vector as VectorSource } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import "ol/ol.css";

async function renderMap() {
	const res = await fetch(
		"/electricity_prices.json"
	);
	const data = await res.json();

	const view = new View({
		center: [0, 0],
		zoom: 1,
	});

	const features = new GeoJSON().readFeatures(data, {
		dataProjection: "EPSG:4326",
		featureProjection: "EPSG:3857",
	});

	const source = new VectorSource({
		features,
	});
	new Map({
		target: "map",
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

renderMap();

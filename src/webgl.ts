import Layer from "ol/layer/Layer";
import WebGLVectorLayerRenderer from "ol/renderer/webgl/VectorLayer";
import { asArray } from "ol/color";
import { packColor } from "ol/renderer/webgl/shaders";
import { Feature } from "ol";

export class WebGLLayer extends Layer {
	createRenderer(): WebGLVectorLayerRenderer {
		return new WebGLVectorLayerRenderer(this, {
			fill: {
				attributes: {
					color: function (feature: Feature) {
						const color = asArray(feature.get("COLOR") || "#eee");
						color[3] = 0.85;
						return packColor(color);
					},
					opacity: function () {
						return 0.6;
					},
				},
			},
			stroke: {
				attributes: {
					color: function (feature: Feature) {
						const color = [...asArray(feature.get("COLOR") || "#eee")];
						color.forEach((_, i) => (color[i] = Math.round(color[i] * 0.75))); // darken slightly
						return packColor(color);
					},
					width: function () {
						return 1.5;
					},
					opacity: function () {
						return 1;
					},
				},
			},
		});
	}
}

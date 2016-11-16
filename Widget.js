///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/dom',
    'dojo/on',
    'dojo/aspect',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/LayerInfos/LayerInfos',
    'jimu/dijit/Message',
    'esri/dijit/Legend'
  ],
  function(
    declare,
    array,
    lang,
    dom,
    on,
    aspect,
    _WidgetsInTemplateMixin,
    BaseWidget,
    LayerInfos,
    Message,
    Legend) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'Legend',
      baseClass: 'jimu-widget-legend',
      layerInfos: [],
      legend: null,
      startup: function() {
        this.inherited(arguments);

        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(layerInfosObj) {
            this.config.legend.map = this.map;
            this.legend = new Legend(this.config.legend, this.legendDiv);
            this.updateLegendLayerInfos(layerInfosObj);
            this.legend.startup();
            this.removeLegendOfBasemap();

            if (this.legend && this.legend._createLegend) {
              aspect.after(this.legend, '_createLegend', lang.hitch(this, 'removeLegendOfBasemap'));
            }

            this.own(on(
              layerInfosObj,
              'layerInfosIsShowInMapChanged',
              lang.hitch(this, 'onLayersVisibilityChange')
            ));
          }), lang.hitch(this, function(err) {
            console.error(err);
            new Message({
              message: err.message || err
            });
          }));
        this.own(on(this.map, "extent-change", lang.hitch(this, function(evt) {
          this.onLayersVisibilityChange();
        })));
      },

      onLayersVisibilityChange: function() {
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(layerInfosObj) {
            this.updateLegendLayerInfos(layerInfosObj);
           }));
        this.legend.refresh();
      },

      _getInvalidLegendLayer: function() {
        var invalidLegendLayers = [];
        var basemapInMap = this.map.getBasemap();

        if (this.map.itemInfo &&
          this.map.itemInfo.itemData) { // created using arcgisUtils.createMap
          array.forEach(this.map.itemInfo.itemData.baseMap.baseMapLayers, function(basemapLayer) {
            invalidLegendLayers.push(basemapLayer.id);
          });

          array.forEach(this.map.itemInfo.itemData.operationalLayers, function(layer) {
            if (layer.showLegend === false) {
              invalidLegendLayers.push(layer.id);
            }
          });

          array.forEach(this.map.layerIds, lang.hitch(this, function(layerId) {
            var layer = this.map.getLayer(layerId);
            if (layer._basemapGalleryLayerType) { // basemapgallery changed
              invalidLegendLayers.push(layerId);
            }
          }));
        } else { // created using esri/Map
          array.forEach(this.map.layerIds, lang.hitch(this, function(layerId) {
            var layer = this.map.getLayer(layerId);
            if (!layer.isOperationalLayer) {
              invalidLegendLayers.push(layerId);
            }
          }));
        }

        if (basemapInMap) {
          invalidLegendLayers.push(basemapInMap);
        }
        return invalidLegendLayers;
      },

      removeLegendOfBasemap: function() {
        array.forEach(this._getInvalidLegendLayer(), function(layerId) {
          var baseNode = dom.byId(this.legend.id + '_' + layerId);
          if (baseNode && baseNode.nodeType === 1) {
            this.removedDiv.appendChild(baseNode);
          }

        }, this);
      },

      updateLegendLayerInfos: function(layerInfos) {
        var legendLayerInfo = [];
        array.forEach(layerInfos._finalLayerInfos, lang.hitch(this, function(layerInfo) {
          if (layerInfo.layerObject.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer" && layerInfo.isVisible()) {
            legendLayerInfo.push({"layer": this.map.getLayer(layerInfo.id)});
          } else if (layerInfo.layerObject.declaredClass == "esri.layers.ArcGISTiledMapServiceLayer" && layerInfo.isVisible()) {
            var hideLayers =[];
            var currentScale = this.map.getScale();
            if (layerInfo._jsapiLayerInfos.length == 1) {
              legendLayerInfo.push({"layer": this.map.getLayer(layerInfo.id)});
            } else {
              for (var i = 0; i < layerInfo._jsapiLayerInfos.length; i++) {
                hideLayers.push(i);
              }
              array.forEach(layerInfo._jsapiLayerInfos, lang.hitch(this, function(sublayerInfo) {
                if (sublayerInfo.subLayerIds) {
                  if (sublayerInfo.minScale > this.map.getScale() && sublayerInfo.maxScale < this.map.getScale()) {
                    for (var j = sublayerInfo.subLayerIds.length; j > 0; j--) {
                      hideLayers.splice(sublayerInfo.subLayerIds[j - 1], 1);
                    }
                    hideLayers.splice(sublayerInfo.id, 1);
                  }                                            
                }
              }));
              legendLayerInfo.push({"hideLayers": hideLayers, "layer": this.map.getLayer(layerInfo.id)});
            }
          } else {
            console.log("Unsupport layer: " + layerInfo.layerObject.declaredClass);
          }
        }));
        this.legend.layerInfos = legendLayerInfo;
      }
    });

    return clazz;
  });
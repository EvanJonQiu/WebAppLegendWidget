# WebAppLegendWidget
A legend widget of WebAppBuilder

## To resolve 
There is a layer construct of cached GIS Service:
Layers:
  * layer_group0(0)
    - layer1(1)
    - layer2(2)
    - layer3(4)
  * layer_group5(5)
    - layer6(6)
    - layer7(7)
    - layer8(8)
    - ...
    
The layer scale is configed in layer_groupN(N) that display/hide layers belong to the group.
In this case, the normal legend widget will list all legend regardless of current scale.

## Issue
It could not work if the layer group has sub-group.


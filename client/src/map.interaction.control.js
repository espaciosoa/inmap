export function mapAllowInteraction(map, enabled) {
    if (!enabled) {
        console.log("DISABLING MAP CONTROLS")
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (map.tap) map.tap.disable();
    }
    else {
        console.log("ENABLING MAP CONTROLS")
        map.dragging.enabled();
        map.touchZoom.enabled();
        map.doubleClickZoom.enabled();
        map.scrollWheelZoom.enabled();
        map.boxZoom.enabled();
        map.keyboard.enabled();
        if (map.tap) map.tap.enabled();

    }
}
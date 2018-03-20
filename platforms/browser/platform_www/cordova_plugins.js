cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-lightsensor/www/lightsensor.js",
        "id": "cordova-plugin-lightsensor.LightSensor",
        "pluginId": "cordova-plugin-lightsensor",
        "clobbers": [
            "window.plugin.lightsensor"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.3.3",
    "cordova-plugin-lightsensor": "1.0.0"
}
// BOTTOM OF METADATA
});
$(function() {
    function PSUControlViewModel(parameters) {
        var self = this;

        self.settingsViewModel = parameters[0]
        self.loginState = parameters[1];
        
        self.settings = undefined;

        self.sensingPlugin_old = "";
        self.switchingPlugin_old = "";

        self.scripts_gcode_psucontrol2_post_on = ko.observable(undefined);
        self.scripts_gcode_psucontrol2_pre_off = ko.observable(undefined);

        self.isPSUOn = ko.observable(undefined);

        self.psu_indicator = $("#psucontrol2_indicator");

        self.onBeforeBinding = function() {
            self.settings = self.settingsViewModel.settings;

            self.settings.plugins.psucontrol2.sensingPlugin.subscribe(function(oldValue) {
                self.sensingPlugin_old = oldValue;
            }, this, 'beforeChange');

            self.settings.plugins.psucontrol2.switchingPlugin.subscribe(function(oldValue) {
                self.switchingPlugin_old = oldValue;
            }, this, 'beforeChange');

            self.settings.plugins.psucontrol2.sensingPlugin.subscribe(function(newValue) {
                if (newValue === "_GET_MORE_") {
                    self.openGetMore();
                    self.settings.plugins.psucontrol2.sensingPlugin(self.sensingPlugin_old);
                }
            });

            self.settings.plugins.psucontrol2.switchingPlugin.subscribe(function(newValue) {
                if (newValue === "_GET_MORE_") {
                    self.openGetMore();
                    self.settings.plugins.psucontrol2.switchingPlugin(self.switchingPlugin_old);
                }
            });

            self.sensingPlugin_old = self.settings.plugins.psucontrol2.sensingPlugin();
            self.switchingPlugin_old = self.settings.plugins.psucontrol2.switchingPlugin();
        };

        self.onSettingsShown = function () {
            self.scripts_gcode_psucontrol2_post_on(self.settings.scripts.gcode["psucontrol2_post_on"]());
            self.scripts_gcode_psucontrol2_pre_off(self.settings.scripts.gcode["psucontrol2_pre_off"]());
        };

        self.onSettingsHidden = function () {
            self.settings.plugins.psucontrol2.scripts_gcode_psucontrol2_post_on = null;
            self.settings.plugins.psucontrol2.scripts_gcode_psucontrol2_pre_off = null;
        };

        self.onSettingsBeforeSave = function () {
            if (self.scripts_gcode_psucontrol2_post_on() !== undefined) {
                if (self.scripts_gcode_psucontrol2_post_on() != self.settings.scripts.gcode["psucontrol2_post_on"]()) {
                    self.settings.plugins.psucontrol2.scripts_gcode_psucontrol2_post_on = self.scripts_gcode_psucontrol2_post_on;
                    self.settings.scripts.gcode["psucontrol2_post_on"](self.scripts_gcode_psucontrol2_post_on());
                }
            }

            if (self.scripts_gcode_psucontrol2_pre_off() !== undefined) {
                if (self.scripts_gcode_psucontrol2_pre_off() != self.settings.scripts.gcode["psucontrol2_pre_off"]()) {
                    self.settings.plugins.psucontrol2.scripts_gcode_psucontrol2_pre_off = self.scripts_gcode_psucontrol2_pre_off;
                    self.settings.scripts.gcode["psucontrol2_pre_off"](self.scripts_gcode_psucontrol2_pre_off());
                }
            }
        };

        self.onStartup = function () {
            self.isPSUOn.subscribe(function() {
                if (self.isPSUOn()) {
                    self.psu_indicator.removeClass("off").addClass("on");
                } else {
                    self.psu_indicator.removeClass("on").addClass("off");
                }   
            });

            $.ajax({
                url: API_BASEURL + "plugin/psucontrol2",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "getPSUState"
                }),
                contentType: "application/json; charset=UTF-8"
            }).done(function(data) {
                self.isPSUOn(data.isPSUOn);
            });
        }

        self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin != "psucontrol2") {
                return;
            }

            if (data.isPSUOn !== undefined) {
                self.isPSUOn(data.isPSUOn);
            }
        };

        self.togglePSU = function() {
            if (self.isPSUOn()) {
                if (self.settings.plugins.psucontrol2.enablePowerOffWarningDialog()) {
                    showConfirmationDialog({
                        message: "You are about to turn off the PSU.",
                        onproceed: function() {
                            self.turnPSUOff();
                        }
                    });
                } else {
                    self.turnPSUOff();
                }
            } else {
                self.turnPSUOn();
            }
        };

        self.turnPSUOn = function() {
            $.ajax({
                url: API_BASEURL + "plugin/psucontrol2",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "turnPSUOn"
                }),
                contentType: "application/json; charset=UTF-8"
            })
        };

    	self.turnPSUOff = function() {
            $.ajax({
                url: API_BASEURL + "plugin/psucontrol2",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "turnPSUOff"
                }),
                contentType: "application/json; charset=UTF-8"
            })
        };

        self.subPluginTabExists = function(id) {
            return $('#settings_plugin_' + id).length > 0
        };

        self.openGetMore = function() {
            window.open("https://plugins.octoprint.org/by_tag/#tag-psucontrol-subplugin", "_blank");
        };
    }

    ADDITIONAL_VIEWMODELS.push([
        PSUControlViewModel,
        ["settingsViewModel", "loginStateViewModel"],
        ["#navbar_plugin_psucontrol2", "#settings_plugin_psucontrol2"]
    ]);
});

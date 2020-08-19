"use strict";
module.exports = {
    hide_warning: function (condition, container_id) {
        if (condition) {
            var warning_container = document.getElementById(container_id);
            if (warning_container != null) {
                warning_container.style.display = "none";
            }
            else {
                console.log("No element with ID {" + container_id + "} found");
            }
        }
    },
};

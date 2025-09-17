"""Routes to query and control Guider"""

import json
import os

from flask import Blueprint, abort, jsonify

guider_bp = Blueprint("guider", __name__, url_prefix="/api/guider")


def get_configured_guider():
    """Get the configured guider device from config file."""
    config_file = "device_config.json"
    if os.path.exists(config_file):
        with open(config_file, "r") as f:
            config = json.load(f)
            return config.get("guiderDevice", "")
    return ""


@guider_bp.route("/")
def index():
    """Test Route"""
    return jsonify({"message": "This is the guider blueprint"})


@guider_bp.route("/status")
def status():
    """Return Guider status"""
    configured_device = get_configured_guider()
    if not configured_device:
        return jsonify(
            {"connected": False, "device": None, "error": "No guider configured"}
        )

    # Check if configured device exists (basic USB device check)
    device_exists = os.path.exists(configured_device)

    return jsonify(
        {
            "connected": device_exists,
            "device": configured_device,
            "available": device_exists,
        }
    )

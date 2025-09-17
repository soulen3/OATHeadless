"""Routes to query and control Camera"""

import json
import os

from flask import Blueprint, abort, jsonify

from .cameras import get_camera_list

camera_bp = Blueprint("camera", __name__, url_prefix="/api/camera")


def get_configured_camera():
    """Get the configured camera device from config file."""
    config_file = "device_config.json"
    if os.path.exists(config_file):
        with open(config_file, "r") as f:
            config = json.load(f)
            return config.get("cameraDevice", "")
    return ""


@camera_bp.route("/")
def index():
    """Test Route"""
    return jsonify({"message": "This is the camera blueprint"})


@camera_bp.route("/status")
def status():
    """Return Camera status"""
    configured_device = get_configured_camera()
    if not configured_device:
        return jsonify(
            {"connected": False, "device": None, "error": "No camera configured"}
        )

    # Check if configured device is available
    camera_list = get_camera_list()
    device_available = any(
        cam["name"] == configured_device or str(cam["index"]) == configured_device
        for cam in camera_list.get("webcameras", [])
    )

    return jsonify(
        {
            "connected": device_available,
            "device": configured_device,
            "available": device_available,
        }
    )


@camera_bp.route("/list")
def list_cameras():
    """Return the names and port of attached cameras."""
    return jsonify(get_camera_list())

"""Routes to query and control Camera"""

from flask import Blueprint, abort, jsonify

from .cameras import get_camera_list

camera_bp = Blueprint("camera", __name__, url_prefix="/camera")


@camera_bp.route("/")
def index():
    """Test Route"""
    return jsonify({"message": "This is the camera blueprint"})


@camera_bp.route("/status")
def status():
    """Return Camera status"""
    abort(501)


@camera_bp.route("/list")
def list_cameras():
    """Return the names and port of attached cameras."""
    return jsonify(get_camera_list())

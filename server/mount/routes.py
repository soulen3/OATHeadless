"""Routes to query and control OAT mount"""

from flask import Blueprint, abort, jsonify

mount_bp = Blueprint("mount", __name__, url_prefix="/mount")


@mount_bp.route("/")
def index():
    """Test Route"""
    return jsonify({"message": "This is the mount blueprint"})


@mount_bp.route("/status")
def status():
    """Return OAT status"""
    abort(501)

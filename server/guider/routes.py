"""Routes to query and control Guider"""

from flask import Blueprint, abort, jsonify

guider_bp = Blueprint("guider", __name__, url_prefix="/guider")


@guider_bp.route("/")
def index():
    """Test Route"""
    return jsonify({"message": "This is the guider blueprint"})


@guider_bp.route("/status")
def status():
    """Return Guider status"""
    abort(501)

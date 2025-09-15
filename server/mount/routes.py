"""Routes to query and control OAT mount.

   This will be broken into two parts. One that will use a serial connection
   to send commands to the mount, and one that will use a indiserver.  Both are required so custom serial commands can be sent to mount, and an indi server is required to use PHD2.

"""

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

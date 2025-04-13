"""Define error handling and generic routes."""

import time
from datetime import datetime
from flask import Flask, abort, jsonify, request

from .camera.routes import camera_bp
from .guider.routes import guider_bp
from .mount.routes import mount_bp

app = Flask(__name__)
app.register_blueprint(camera_bp)
app.register_blueprint(mount_bp)
app.register_blueprint(guider_bp)


# Error Handling
@app.errorhandler(404)
def not_found(e):  # pylint: disable=unused-argument
    """404 Error."""
    return jsonify({"message": "Not Found."}), 404


@app.errorhandler(400)
def bad_request(e):  # pylint: disable=unused-argument
    """404 Error."""
    return jsonify({"message": "Bad Request."}), 400


@app.errorhandler(501)
def not_implemented(e):  # pylint: disable=unused-argument
    """501 Error."""
    return jsonify({"message": "Request has not been implemented."}), 501


# Define routes
@app.route("/")
def index():
    """Returns a string to check if the server is responding correctla.y"""
    return jsonify({"message": "For controlling telescope mount and cameras"})


@app.route("/status")
def status():
    """Returns status about connected devices.
    Include the following:
      current_time: system datetime
      latitude: float or none
      longitude: float or none
      OAT Status: dict or none
      Camera Port: dict or one
      Guider Port: dict or one
    """
    abort(501)


@app.route("/get_time")
def get_time():
    """Returns the systems current time."""
    return jsonify({"current_time": datetime.now()})


@app.route("/set_time")
def set_time():
    """Set the system time to the one provided.
    If time_string is provided in ISO format, set the system time to it.
    If time_string isn't provided, try syncing to NTP.
    """
    time_string = request.args.get("time_string", None)
    if time_string:
        try:
            current_time = datetime.fromisoformat(time_string)
            time.clock_settime(time.CLOCK_REALTIME, current_time)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
    else:
        # Request ntp sync.
        abort(501)
    return get_time()

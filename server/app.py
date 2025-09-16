"""Define error handling and generic routes."""

import logging
import time
from datetime import datetime

from flask import Flask, abort, jsonify, request, render_template
from werkzeug.middleware.proxy_fix import ProxyFix

from .camera.routes import camera_bp
from .guider.routes import guider_bp
from .mount.routes import mount_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# COnfigure App
app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Add Blueprints
app.register_blueprint(camera_bp)
app.register_blueprint(mount_bp)
app.register_blueprint(guider_bp)


# Error Handling
@app.errorhandler(404)
def not_found(e):  # pylint: disable=unused-argument
    """404 Error."""
    logger.warning("404 Not Found: %s", request.url)
    return jsonify({"message": "Not Found."}), 404


@app.errorhandler(400)
def bad_request(e):  # pylint: disable=unused-argument
    """400 Error."""
    logger.warning("400 Bad Request: %s", request.url)
    return jsonify({"message": "Bad Request."}), 400


@app.errorhandler(501)
def not_implemented(e):  # pylint: disable=unused-argument
    """501 Error."""
    logger.warning("501 Not Implemented: %s", request.url)
    return jsonify({"message": "Request has not been implemented."}), 501


@app.route("/devices")
def list_devices():
    """List available serial and USB devices."""
    import serial.tools.list_ports

    devices = []
    ports = serial.tools.list_ports.comports()

    for port in ports:
        devices.append(
            {
                "device": port.device,
                "description": port.description,
                "hwid": port.hwid,
                "vid": port.vid,
                "pid": port.pid,
                "manufacturer": port.manufacturer,
                "product": port.product,
            }
        )

    return jsonify({"devices": devices})


@app.route("/")
@app.route("/<path:path>")
def client_app(path=None):
    """Serve the Angular client application."""
    return render_template("client.html")


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
            logger.info("System time set to: %s", time_string)
        except ValueError as e:
            logger.error("Invalid time format: %s - %s", time_string, str(e))
            return jsonify({"message": str(e)}), 400
    else:
        # Request ntp sync.
        logger.warning("NTP sync requested but not implemented")
        abort(501)
    return get_time()

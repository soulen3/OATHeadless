"""Define error handling and generic routes."""

import logging
import time
from datetime import datetime

from flask import (Flask, abort, jsonify, render_template, request,
                   send_from_directory)
from werkzeug.middleware.proxy_fix import ProxyFix

from .camera.routes import camera_bp
from .guider.routes import guider_bp
from .mount.routes import mount_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configure App
app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static",
)
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


@app.route("/")
@app.route("/<path:path>")
def client_app(path=None):
    """Serve the Angular client application."""
    return render_template("index.html")


@app.route("/api/guider/capture")
def capture_guider_image():
    """Capture image from guider device."""
    import base64
    import json
    import os

    import cv2

    # Get configured guider device
    config_file = "device_config.json"
    guider_device = ""

    if os.path.exists(config_file):
        try:
            with open(config_file, "r") as f:
                config = json.load(f)
                guider_device = config.get("guiderDevice", "")
        except:
            pass

    if not guider_device or not os.path.exists(guider_device):
        return jsonify({"error": "Guider device not configured or not available"}), 400

    try:
        # Extract video device number from path (e.g., /dev/video0 -> 0)
        device_num = int(guider_device.split("video")[-1])

        # Capture image using OpenCV
        cap = cv2.VideoCapture(device_num)
        if not cap.isOpened():
            return jsonify({"error": "Failed to open guider device"}), 500

        ret, frame = cap.read()
        cap.release()

        if not ret:
            return jsonify({"error": "Failed to capture image"}), 500

        # Encode image as base64 JPEG
        _, buffer = cv2.imencode(".jpg", frame)
        img_base64 = base64.b64encode(buffer).decode("utf-8")

        return jsonify(
            {"image": f"data:image/jpeg;base64,{img_base64}", "timestamp": time.time()}
        )

    except Exception as e:
        return jsonify({"error": f"Image capture failed: {str(e)}"}), 500


@app.route("/api/devices")
def list_devices():
    """List available serial and USB devices."""
    import glob
    import os
    import subprocess

    import serial.tools.list_ports

    devices = []

    # Serial ports
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
                "type": "serial",
            }
        )

    # USB video devices using v4l2-ctl
    try:
        result = subprocess.run(
            ["v4l2-ctl", "--list-devices"], capture_output=True, text=True, check=True
        )

        lines = result.stdout.strip().split("\n")
        current_camera = None

        for line in lines:
            line = line.strip()
            if line and not line.startswith("\t") and not line.startswith(" "):
                # Camera name line
                current_camera = line.rstrip(":")
            elif line.startswith("\t/dev/video") and current_camera:
                # First video device for this camera
                device_path = line.strip()
                devices.append(
                    {
                        "device": device_path,
                        "description": current_camera,
                        "hwid": "",
                        "vid": None,
                        "pid": None,
                        "manufacturer": "Unknown",
                        "product": current_camera,
                        "type": "video",
                    }
                )
                current_camera = None  # Only take first device per camera

    except (subprocess.CalledProcessError, FileNotFoundError):
        # Fallback to old method if v4l2-ctl not available
        pass

    # USB devices (for guiders)
    usb_devices = glob.glob("/dev/ttyUSB*") + glob.glob("/dev/ttyACM*")
    for device in usb_devices:
        # Skip if already in serial ports
        if not any(d["device"] == device for d in devices):
            devices.append(
                {
                    "device": device,
                    "description": f"USB device {os.path.basename(device)}",
                    "hwid": "",
                    "vid": None,
                    "pid": None,
                    "manufacturer": "Unknown",
                    "product": f"USB Device {os.path.basename(device)}",
                    "type": "usb",
                }
            )

    return jsonify({"devices": devices})


@app.route("/api/config/device", methods=["GET", "POST"])
def device_config():
    """Get or set device configuration."""
    import json
    import os

    config_file = "device_config.json"

    if request.method == "POST":
        # Save device configuration
        data = request.get_json()
        if not data:
            return jsonify({"error": "No configuration data provided"}), 400

        try:
            with open(config_file, "w") as f:
                json.dump(data, f, indent=2)
            logger.info("Device configuration saved: %s", data)
            return jsonify({"message": "Device configuration saved", "config": data})
        except Exception as e:
            logger.error("Failed to save device config: %s", str(e))
            return jsonify({"error": "Failed to save configuration"}), 500

    else:
        # Get current device configuration
        try:
            if os.path.exists(config_file):
                with open(config_file, "r") as f:
                    config = json.load(f)
                return jsonify({"config": config})
            else:
                # Return default configuration
                default_config = {
                    "telescopeDevice": "",
                    "telescopeBaudrate": 9600,
                    "guiderDevice": "",
                    "cameraDevice": "",
                }
                return jsonify({"config": default_config})
        except Exception as e:
            logger.error("Failed to load device config: %s", str(e))
            return jsonify({"error": "Failed to load configuration"}), 500


@app.route("/static/images/<filename>")
def serve_image(filename):
    """Serve captured images."""
    return send_from_directory("/var/www/images", filename)


@app.route("/api/get_time")
def get_time():
    """Returns the systems current time."""
    return jsonify({"current_time": datetime.now()})


@app.route("/api/set_time")
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

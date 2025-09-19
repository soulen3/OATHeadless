"""Routes to query and control Guider"""

import json
import os
import subprocess

from flask import Blueprint, abort, jsonify, request

from .guiders import GuiderCamera
from .phd2_client import PHD2Client

guider_bp = Blueprint("guider", __name__, url_prefix="/api/guider")

# Global PHD2 client instance
phd2 = PHD2Client()


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


@guider_bp.route("/capture")
def capture():
    """Capture image from configured guider camera"""
    configured_device = get_configured_guider()
    if not configured_device:
        return jsonify({"error": "No guider configured"}), 400

    try:
        # Use index 0 for the first available camera
        guider = GuiderCamera("guider", 0)
        filename = guider.get_image()
        return jsonify(
            {"filename": filename, "message": "Guider image captured successfully"}
        )
        return jsonify(
            {"filename": filename, "message": "Guider image captured successfully"}
        )
    except ValueError:
        return jsonify({"error": "Invalid guider device format"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to capture guider image: {str(e)}"}), 500


@guider_bp.route("/phd2/status")
def phd2_status():
    """Get PHD2 connection status"""
    return jsonify(phd2.get_status())


@guider_bp.route("/phd2/connect", methods=["POST"])
def phd2_connect():
    """Connect to PHD2"""
    status = phd2.get_status()
    if status["connected"]:
        return jsonify({"message": "PHD2 already connected", "connected": True})
    else:
        return jsonify({"message": "PHD2 not responding", "connected": False}), 503


@guider_bp.route("/phd2/start_guiding", methods=["POST"])
def start_guiding():
    """Start PHD2 guiding"""
    if not phd2.is_connected():
        return jsonify({"error": "PHD2 not connected"}), 503

    success = phd2.start_guiding()
    if success:
        return jsonify({"message": "Guiding started"})
    else:
        return jsonify({"error": "Failed to start guiding"}), 500


@guider_bp.route("/phd2/stop_guiding", methods=["POST"])
def stop_guiding():
    """Stop PHD2 guiding"""
    if not phd2.is_connected():
        return jsonify({"error": "PHD2 not connected"}), 503

    success = phd2.stop_guiding()
    if success:
        return jsonify({"message": "Guiding stopped"})
    else:
        return jsonify({"error": "Failed to stop guiding"}), 500


@guider_bp.route("/phd2/process/status")
def phd2_process_status():
    """Check if PHD2 process is running"""
    try:
        result = subprocess.run(["pgrep", "phd2"], capture_output=True, text=True)
        running = result.returncode == 0
        return jsonify({"running": running})
    except Exception as e:
        return jsonify({"running": False, "error": str(e)})


@guider_bp.route("/phd2/process/control", methods=["POST"])
def phd2_process_control():
    """Start or stop PHD2 process"""
    data = request.get_json()
    action = data.get("action") if data else None

    if action == "start":
        try:
            subprocess.run(["pkill", "phd2"], check=False)  # Kill any existing instance
            subprocess.Popen(
                ["nohup", "/usr/bin/phd2"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return jsonify({"message": "PHD2 started", "running": True})
        except Exception as e:
            return jsonify({"error": f"Failed to start PHD2: {str(e)}"}), 500

    elif action == "stop":
        try:
            subprocess.run(["pkill", "phd2"], check=True)
            return jsonify({"message": "PHD2 stopped", "running": False})
        except subprocess.CalledProcessError:
            return jsonify({"message": "PHD2 was not running", "running": False})
        except Exception as e:
            return jsonify({"error": f"Failed to stop PHD2: {str(e)}"}), 500

    return jsonify({"error": "Invalid action. Use 'start' or 'stop'"}), 400


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

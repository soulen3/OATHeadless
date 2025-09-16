"""Routes to query and control OAT mount using Meade commands.

This module provides REST API endpoints for mount control via serial communication
and INDI server integration for PHD2 compatibility.

Serial commands for OpenAstroTech can be found here:
    https://wiki.openastrotech.com/Knowledge/Firmware/MeadeCommands
"""

from flask import Blueprint, abort, jsonify, request

from .indi_client import IndiClient
from .serial import MountSerial

mount_bp = Blueprint("mount", __name__, url_prefix="/mount")


@mount_bp.route("/")
@mount_bp.route("/status")
def status():
    """Get comprehensive mount status using multiple Meade commands."""
    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    status_data = {}

    # Current position
    mount.write(":GR#")  # Get RA
    status_data["ra"] = mount.read_data()

    mount.write(":GD#")  # Get DEC
    status_data["dec"] = mount.read_data()

    # Tracking and movement status
    mount.write(":GT#")  # Get tracking rate
    status_data["tracking_rate"] = mount.read_data()

    mount.write(":D#")  # Distance bars (slewing indicator)
    slew_status = mount.read_data()
    status_data["slewing"] = slew_status != "" if slew_status else False

    # Site information
    mount.write(":Gg#")  # Get longitude
    status_data["longitude"] = mount.read_data()

    mount.write(":Gt#")  # Get latitude
    status_data["latitude"] = mount.read_data()

    # Time information
    mount.write(":GL#")  # Get local time
    status_data["local_time"] = mount.read_data()

    mount.write(":GC#")  # Get date
    status_data["date"] = mount.read_data()

    mount.disconnect()
    return jsonify(status_data)


@mount_bp.route("/position")
def position():
    """Get current mount RA/DEC coordinates."""
    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    mount.write(":GR#")
    ra = mount.read_data()

    mount.write(":GD#")
    dec = mount.read_data()

    mount.disconnect()
    return jsonify({"ra": ra, "dec": dec})


@mount_bp.route("/tracking")
def tracking():
    """Get current tracking rate."""
    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    mount.write(":GT#")
    rate = mount.read_data()

    mount.disconnect()
    return jsonify({"tracking_rate": rate})


@mount_bp.route("/target", methods=["GET"])
def get_target():
    """Get current target coordinates."""
    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    mount.write(":Gr#")  # Get target RA
    target_ra = mount.read_data()

    mount.write(":Gd#")  # Get target DEC
    target_dec = mount.read_data()

    mount.disconnect()
    return jsonify({"target_ra": target_ra, "target_dec": target_dec})


@mount_bp.route("/target", methods=["POST"])
def set_target():
    """Set target coordinates for slewing.

    Expects JSON: {"ra": "HH:MM:SS", "dec": "sDD:MM:SS"}
    """
    data = request.get_json()
    if not data or "ra" not in data or "dec" not in data:
        return jsonify({"error": "RA and DEC required"}), 400

    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    # Set target coordinates
    mount.write(f":Sr{data['ra']}#")  # Set target RA
    ra_response = mount.read_data()

    mount.write(f":Sd{data['dec']}#")  # Set target DEC
    dec_response = mount.read_data()

    mount.disconnect()
    return jsonify(
        {
            "ra_set": ra_response == "1",
            "dec_set": dec_response == "1",
            "target_ra": data["ra"],
            "target_dec": data["dec"],
        }
    )


@mount_bp.route("/indi/status")
def indi_status():
    """Check if mount is connected to INDI service."""
    indi = IndiClient()

    server_running = indi.is_server_running()
    if not server_running:
        return (
            jsonify(
                {
                    "server_running": False,
                    "mount_connected": False,
                    "error": "INDI server not running",
                }
            ),
            503,
        )

    mount_connected = indi.get_mount_status()
    return jsonify({"server_running": True, "mount_connected": mount_connected})


@mount_bp.route("/home", methods=["POST"])
def home_mount():
    """Move to Home. No response expected."""
    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    mount.write(":hF#")  # Find home position for both axes

    mount.disconnect()
    return jsonify(
        {
            "message": "Move both axes to home",
        }
    )


@mount_bp.route("/home/ra", methods=["POST"])
def home_ra():
    """Home RA axis using Hall sensor. No response expected."""
    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    mount.write(":MHRL#")  # Find home position for RA axis

    mount.disconnect()
    return jsonify({"success": True, "message": "Homing RA axis"})


@mount_bp.route("/home/dec", methods=["POST"])
def home_dec():
    """Home DEC axis using Hall sensor. No response expected."""
    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    mount.write(":MHDU#")  # Find home position for DEC axis

    mount.disconnect()
    return jsonify({"success": True, "message": "Homing DEC axis"})


@mount_bp.route("/location", methods=["POST"])
def set_location():
    """Set mount location coordinates.
    
    Expects JSON: {"latitude": "sDD:MM:SS", "longitude": "DDD:MM:SS"}
    """
    data = request.get_json()
    if not data or "latitude" not in data or "longitude" not in data:
        return jsonify({"error": "latitude and longitude required"}), 400

    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    mount.write(f":St{data['latitude']}#")  # Set latitude
    lat_response = mount.read_data()

    mount.write(f":Sg{data['longitude']}#")  # Set longitude
    lon_response = mount.read_data()

    mount.disconnect()
    return jsonify({
        "latitude_set": lat_response == "1",
        "longitude_set": lon_response == "1",
        "latitude": data["latitude"],
        "longitude": data["longitude"]
    })


@mount_bp.route("/firmware")
def firmware():
    """Get mount firmware version."""
    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    mount.write(":GVN#")
    version = mount.read_data()

    mount.disconnect()
    return jsonify({"firmware_version": version})


@mount_bp.route("/datetime", methods=["POST"])
def set_datetime():
    """Set mount date and time.

    Expects JSON: {"date": "MM/DD/YY", "time": "HH:MM:SS"}
    """
    data = request.get_json()
    if not data or "date" not in data or "time" not in data:
        return jsonify({"error": "date and time required"}), 400

    mount = MountSerial()
    mount.connect()

    if not mount.is_connected:
        return jsonify({"error": "Mount not connected"}), 503

    mount.write(f":SC{data['date']}#")  # Set date
    date_response = mount.read_data()

    mount.write(f":SL{data['time']}#")  # Set local time
    time_response = mount.read_data()

    mount.disconnect()
    return jsonify(
        {
            "date_set": date_response == "1",
            "time_set": time_response == "1",
            "date": data["date"],
            "time": data["time"],
        }
    )


@mount_bp.route("/indi/connection", methods=["POST"])
def indi_connection():
    """Connect or disconnect mount from INDI service."""
    data = request.get_json()
    if not data or "connect" not in data:
        return jsonify({"error": "connect parameter required"}), 400

    indi = IndiClient()

    if not indi.is_server_running():
        return jsonify({"error": "INDI server not running"}), 503

    connect = data["connect"]
    driver = data.get("driver", "indi_lx200_OnStep")

    if connect:
        success = indi.connect_mount(driver)
        action = "connected"
    else:
        success = indi.disconnect_mount(driver)
        action = "disconnected"

    return jsonify({"success": success, "action": action, "driver": driver})

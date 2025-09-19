"""Serial communication interface for OAT mount using Meade commands."""

import logging
import os
import sys

import serial
import serial.tools.list_ports

logger = logging.getLogger(__name__)

DEFAULT_DEVICE = "/dev/serial/by-id/usb-Raspberry_Pi_Pico_E662608797224B29-if00"


class MountSerial:
    """Handles serial communication with OAT mount."""

    def __init__(self, device=None, baudrate=None, timeout=0.5):
        """Initialize serial connection parameters."""
        self.device = device or self._get_configured_device()
        self.baudrate = baudrate or self._get_configured_baudrate()
        self.timeout = timeout
        self.serial = None
        self.is_connected = False

    def _get_configured_device(self):
        """Get configured telescope device from config file."""
        import json

        try:
            config_file = "device_config.json"
            if os.path.exists(config_file):
                with open(config_file, "r") as f:
                    config = json.load(f)
                    device = config.get("telescopeDevice", "")
                    if device:
                        logger.info("Using configured telescope device: %s", device)
                        return device
        except Exception as e:
            logger.warning("Failed to load device config: %s", str(e))

        # Fallback to default device
        logger.info("Using default telescope device: %s", DEFAULT_DEVICE)
        return DEFAULT_DEVICE

    def _get_configured_baudrate(self):
        """Get configured telescope baudrate from config file."""
        import json

        try:
            config_file = "device_config.json"
            if os.path.exists(config_file):
                with open(config_file, "r") as f:
                    config = json.load(f)
                    baudrate = config.get("telescopeBaudrate", 9600)
                    logger.info("Using configured telescope baudrate: %s", baudrate)
                    return baudrate
        except Exception as e:
            logger.warning("Failed to load baudrate config: %s", str(e))

        return 9600

    def connect(self):
        """Establish serial connection to mount."""
        if self.is_connected or self.serial:
            logger.info("Already connected to mount at %s", self.device)
            return

        try:
            self.serial = serial.Serial(
                self.device, baudrate=self.baudrate, timeout=self.timeout
            )
            self.is_connected = True
            logger.info("Connected to mount at %s", self.device)
        except Exception as e:
            self.is_connected = False
            logger.error("Error connecting to %s: %s", self.device, e)

    def disconnect(self):
        """Close serial connection."""
        if self.serial and self.serial.is_open:
            self.serial.close()
            self.is_connected = False

    def write(self, command):
        """Send Meade command to mount."""
        if not self.is_connected:
            logger.warning("Not connected to serial port")
            return False

        try:
            import time

            self.serial.write(bytes(command, "utf-8"))
            self.serial.flush()  # Ensure command is sent
            time.sleep(0.1)  # Give mount time to process
            return True
        except Exception as e:
            logger.error("Error sending data: %s", e)
            return False

    def read_data(self, num_bytes=None):
        """Read response from mount."""
        if not self.is_connected:
            logger.warning("Not connected to serial port")
            return None

        try:
            import time

            if num_bytes:
                data = self.serial.read(num_bytes)
            else:
                # For OAT responses, read until '#' terminator or timeout
                data = b""
                start_time = time.time()
                while time.time() - start_time < self.timeout:
                    if self.serial.in_waiting > 0:
                        byte = self.serial.read(1)
                        data += byte
                        if byte == b"#":
                            break
                    else:
                        time.sleep(0.01)  # Small delay to prevent busy waiting

            response = data.decode("utf-8").strip()
            # Remove trailing '#' if present
            if response.endswith("#"):
                response = response[:-1]

            return response

        except Exception as e:
            logger.error("Error reading data: %s", e)
            return None

    def __del__(self):
        """Ensure connection is closed on cleanup."""
        self.disconnect()

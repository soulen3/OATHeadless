"""Serial communication interface for OAT mount using Meade commands."""

import logging
import sys

import serial

logger = logging.getLogger(__name__)

DEFAULT_DEVICE = "/dev/serial/by-id/usb-Raspberry_Pi_Pico_E662608797224B29-if00"


class MountSerial:
    """Handles serial communication with OAT mount."""

    def __init__(self, device=DEFAULT_DEVICE, baudrate=9600, timeout=0.01):
        """Initialize serial connection parameters."""
        self.device = device
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial = None
        self.is_connected = False

    def connection(self):
        """Establish serial connection to mount."""
        try:
            self.serial = serial.Serial(
                self.device, baudrate=self.baudrate, timeout=self.timeout
            )
            self.is_connected = True
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
            self.serial.write(bytes(command, "utf-8"))
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
            if num_bytes:
                data = self.serial.read(num_bytes)
            else:
                data = self.serial.readline()

            return data.decode("utf-8").strip()

        except Exception as e:
            logger.error("Error reading data: %s", e)
            return None

    def __del__(self):
        """Ensure connection is closed on cleanup."""
        self.disconnect()

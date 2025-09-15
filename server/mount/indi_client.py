"""INDI client for mount connection management."""

import socket
import subprocess
import time


class IndiClient:
    """Manages INDI server connection for mount control."""

    def __init__(self, host="localhost", port=7624):
        """Initialize INDI client."""
        self.host = host
        self.port = port
        self.connected = False

    def is_server_running(self):
        """Check if INDI server is running."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((self.host, self.port))
            sock.close()
            return result == 0
        except:
            return False

    def connect_mount(self, driver="indi_lx200_OnStep"):
        """Connect mount driver to INDI server."""
        if not self.is_server_running():
            return False
        
        try:
            # Start driver if not already running
            subprocess.run(["indi_setprop", f"{driver}.CONNECTION.CONNECT=On"], 
                         check=True, capture_output=True)
            time.sleep(2)  # Allow connection time
            self.connected = True
            return True
        except subprocess.CalledProcessError:
            return False

    def disconnect_mount(self, driver="indi_lx200_OnStep"):
        """Disconnect mount driver from INDI server."""
        if not self.is_server_running():
            return False
        
        try:
            subprocess.run(["indi_setprop", f"{driver}.CONNECTION.CONNECT=Off"], 
                         check=True, capture_output=True)
            self.connected = False
            return True
        except subprocess.CalledProcessError:
            return False

    def get_mount_status(self, driver="indi_lx200_OnStep"):
        """Get mount connection status from INDI."""
        if not self.is_server_running():
            return None
        
        try:
            result = subprocess.run(["indi_getprop", f"{driver}.CONNECTION"], 
                                  capture_output=True, text=True, check=True)
            return "CONNECT=On" in result.stdout
        except subprocess.CalledProcessError:
            return None

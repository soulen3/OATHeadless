"""Unit tests for mount routes."""

import json
import unittest
from unittest.mock import Mock, patch

from flask import Flask

from .routes import mount_bp


class TestMountRoutes(unittest.TestCase):
    """Test mount API routes."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = Flask(__name__)
        self.app.register_blueprint(mount_bp)
        self.client = self.app.test_client()

    @patch("mount.routes.MountSerial")
    def test_status_not_connected(self, mock_mount):
        """Test status when mount not connected."""
        mock_instance = Mock()
        mock_instance.is_connected = False
        mock_mount.return_value = mock_instance

        response = self.client.get("/mount/status")
        self.assertEqual(response.status_code, 503)

    @patch("mount.routes.MountSerial")
    def test_status_success(self, mock_mount):
        """Test successful status request."""
        mock_instance = Mock()
        mock_instance.is_connected = True
        mock_instance.read_data.side_effect = [
            "12:34:56",
            "+45:30:00",
            "1.0",
            "",
            "",
            "-80:30:00",
            "+45:30:00",
            "12:00:00",
            "01/01/25",
        ]
        mock_mount.return_value = mock_instance

        response = self.client.get("/mount/status")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["ra"], "12:34:56")

    @patch("mount.routes.MountSerial")
    def test_position_success(self, mock_mount):
        """Test position endpoint."""
        mock_instance = Mock()
        mock_instance.is_connected = True
        mock_instance.read_data.side_effect = ["12:34:56", "+45:30:00"]
        mock_mount.return_value = mock_instance

        response = self.client.get("/mount/position")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["ra"], "12:34:56")
        self.assertEqual(data["dec"], "+45:30:00")

    @patch("mount.routes.MountSerial")
    def test_set_target_success(self, mock_mount):
        """Test setting target coordinates."""
        mock_instance = Mock()
        mock_instance.is_connected = True
        mock_instance.read_data.side_effect = ["1", "1"]
        mock_mount.return_value = mock_instance

        response = self.client.post(
            "/mount/target", json={"ra": "12:34:56", "dec": "+45:30:00"}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["ra_set"])
        self.assertTrue(data["dec_set"])

    def test_set_target_missing_data(self):
        """Test setting target with missing data."""
        response = self.client.post("/mount/target", json={"ra": "12:34:56"})
        self.assertEqual(response.status_code, 400)

    @patch("mount.routes.IndiClient")
    def test_indi_status_server_down(self, mock_indi):
        """Test INDI status when server down."""
        mock_instance = Mock()
        mock_instance.is_server_running.return_value = False
        mock_indi.return_value = mock_instance

        response = self.client.get("/mount/indi/status")
        self.assertEqual(response.status_code, 503)

    @patch("mount.routes.IndiClient")
    def test_indi_status_success(self, mock_indi):
        """Test INDI status when server running."""
        mock_instance = Mock()
        mock_instance.is_server_running.return_value = True
        mock_instance.get_mount_status.return_value = True
        mock_indi.return_value = mock_instance

        response = self.client.get("/mount/indi/status")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["server_running"])
        self.assertTrue(data["mount_connected"])

    @patch("mount.routes.IndiClient")
    def test_indi_connection_connect(self, mock_indi):
        """Test INDI mount connection."""
        mock_instance = Mock()
        mock_instance.is_server_running.return_value = True
        mock_instance.connect_mount.return_value = True
        mock_indi.return_value = mock_instance

        response = self.client.post("/mount/indi/connection", json={"connect": True})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["action"], "connected")

    @patch("mount.routes.IndiClient")
    def test_indi_connection_disconnect(self, mock_indi):
        """Test INDI mount disconnection."""
        mock_instance = Mock()
        mock_instance.is_server_running.return_value = True
        mock_instance.disconnect_mount.return_value = True
        mock_indi.return_value = mock_instance

        response = self.client.post("/mount/indi/connection", json={"connect": False})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["action"], "disconnected")

    @patch("mount.routes.MountSerial")
    def test_home_mount_success(self, mock_mount):
        """Test homing both axes."""
        mock_instance = Mock()
        mock_instance.is_connected = True
        mock_instance.read_data.return_value = "1"
        mock_mount.return_value = mock_instance

        response = self.client.post("/mount/home")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Move both axes to home")

    @patch("mount.routes.MountSerial")
    def test_home_ra_success(self, mock_mount):
        """Test homing RA axis."""
        mock_instance = Mock()
        mock_instance.is_connected = True
        mock_mount.return_value = mock_instance

        response = self.client.post("/mount/home/ra")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Homing RA axis")

    @patch("mount.routes.MountSerial")
    def test_home_dec_success(self, mock_mount):
        """Test homing DEC axis."""
        mock_instance = Mock()
        mock_instance.is_connected = True
        mock_mount.return_value = mock_instance

        response = self.client.post("/mount/home/dec")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Homing DEC axis")

    @patch("mount.routes.MountSerial")
    def test_home_not_connected(self, mock_mount):
        """Test homing when mount not connected."""
        mock_instance = Mock()
        mock_instance.is_connected = False
        mock_mount.return_value = mock_instance

        response = self.client.post("/mount/home")
        self.assertEqual(response.status_code, 503)

    def test_indi_connection_missing_data(self):
        """Test INDI connection with missing data."""
        response = self.client.post("/mount/indi/connection", json={})
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()

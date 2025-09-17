"""Unit tests for mount routes."""

import json
import unittest
from unittest.mock import Mock, patch

from flask import Flask

from .routes import mount_bp


class TestMountRoutes(unittest.TestCase):
    """Test mount API routes."""

    def setUp(self):
        """Set up test client."""
        self.app = Flask(__name__)
        self.app.register_blueprint(mount_bp)
        self.client = self.app.test_client()

    @patch("serial.Serial")
    def test_firmware_success(self, mock_serial):
        """Test getting firmware version."""
        mock_serial_instance = Mock()
        mock_serial_instance.is_open = True
        mock_serial_instance.readline.return_value = b"V1.8.42"
        mock_serial.return_value = mock_serial_instance

        response = self.client.get("/mount/firmware")

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["firmware_version"], "V1.8.42")

    @patch("os.path.exists")
    def test_firmware_device_not_found(self, mock_exists):
        """Test firmware when device file doesn't exist."""
        mock_exists.return_value = False

        response = self.client.get("/mount/firmware")
        self.assertEqual(response.status_code, 503)

    @patch("serial.Serial")
    def test_status_success(self, mock_serial):
        """Test successful status retrieval."""
        mock_serial_instance = Mock()
        mock_serial_instance.is_open = True
        mock_serial_instance.readline.side_effect = [
            b"12:34:56",
            b"45:67:89",
            b"1.0",
            b"",
            b"-123:45:67",
            b"89:01:23",
            b"12:34:56",
            b"01/01/23",
        ]
        mock_serial.return_value = mock_serial_instance

        response = self.client.get("/mount/status")
        self.assertEqual(response.status_code, 200)

    @patch("os.path.exists")
    def test_status_device_not_found(self, mock_exists):
        """Test status when device not found."""
        mock_exists.return_value = False

        response = self.client.get("/mount/status")
        self.assertEqual(response.status_code, 503)

    @patch("serial.Serial")
    def test_position_success(self, mock_serial):
        """Test successful position retrieval."""
        mock_serial_instance = Mock()
        mock_serial_instance.is_open = True
        mock_serial_instance.readline.side_effect = [b"12:34:56", b"45:67:89"]
        mock_serial.return_value = mock_serial_instance

        response = self.client.get("/mount/position")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["ra"], "12:34:56")
        self.assertEqual(data["dec"], "45:67:89")

    @patch("serial.Serial")
    def test_set_target_success(self, mock_serial):
        """Test successful target setting."""
        mock_serial_instance = Mock()
        mock_serial_instance.is_open = True
        mock_serial_instance.readline.side_effect = [b"1", b"1"]
        mock_serial.return_value = mock_serial_instance

        response = self.client.post(
            "/mount/target", json={"ra": "12:34:56", "dec": "45:67:89"}
        )
        self.assertEqual(response.status_code, 200)

    def test_set_target_missing_data(self):
        """Test target setting with missing data."""
        response = self.client.post("/mount/target", json={"ra": "12:34:56"})
        self.assertEqual(response.status_code, 400)

    @patch("serial.Serial")
    def test_home_mount_success(self, mock_serial):
        """Test homing both axes."""
        mock_serial_instance = Mock()
        mock_serial_instance.is_open = True
        mock_serial.return_value = mock_serial_instance

        response = self.client.post("/mount/home")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Move both axes to home")

    @patch("serial.Serial")
    def test_home_ra_success(self, mock_serial):
        """Test homing RA axis."""
        mock_serial_instance = Mock()
        mock_serial_instance.is_open = True
        mock_serial.return_value = mock_serial_instance

        response = self.client.post("/mount/home/ra")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Homing RA axis")

    @patch("serial.Serial")
    def test_home_dec_success(self, mock_serial):
        """Test homing DEC axis."""
        mock_serial_instance = Mock()
        mock_serial_instance.is_open = True
        mock_serial.return_value = mock_serial_instance

        response = self.client.post("/mount/home/dec")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Homing DEC axis")

    @patch("os.path.exists")
    def test_home_device_not_found(self, mock_exists):
        """Test homing when device not found."""
        mock_exists.return_value = False

        response = self.client.post("/mount/home")
        self.assertEqual(response.status_code, 503)

    @patch("serial.Serial")
    def test_set_datetime_success(self, mock_serial):
        """Test setting date and time."""
        mock_serial_instance = Mock()
        mock_serial_instance.is_open = True
        mock_serial_instance.readline.side_effect = [b"1", b"1"]
        mock_serial.return_value = mock_serial_instance

        response = self.client.post(
            "/mount/datetime", json={"date": "09/15/25", "time": "21:54:00"}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["date_set"])
        self.assertTrue(data["time_set"])

    def test_set_datetime_missing_data(self):
        """Test setting datetime with missing data."""
        response = self.client.post("/mount/datetime", json={"date": "09/15/25"})
        self.assertEqual(response.status_code, 400)

    @patch("serial.Serial")
    def test_set_location_success(self, mock_serial):
        """Test setting location coordinates."""
        mock_serial_instance = Mock()
        mock_serial_instance.is_open = True
        mock_serial_instance.readline.side_effect = [b"1", b"1"]
        mock_serial.return_value = mock_serial_instance

        response = self.client.post(
            "/mount/location", json={"latitude": "+45:30:00", "longitude": "123:45:00"}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["latitude_set"])
        self.assertTrue(data["longitude_set"])

    def test_set_location_missing_data(self):
        """Test setting location with missing data."""
        response = self.client.post("/mount/location", json={"latitude": "+45:30:00"})
        self.assertEqual(response.status_code, 400)

    def test_indi_connection_missing_data(self):
        """Test INDI connection with missing data."""
        response = self.client.post("/mount/indi/connection", json={})
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()

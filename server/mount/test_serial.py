"""Unit tests for mount serial communication."""

import unittest
from unittest.mock import Mock, patch
from .serial import MountSerial


class TestMountSerial(unittest.TestCase):
    """Test MountSerial class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mount = MountSerial()

    @patch('mount.serial.serial.Serial')
    def test_connection_success(self, mock_serial):
        """Test successful connection."""
        mock_serial.return_value = Mock()
        self.mount.connection()
        self.assertTrue(self.mount.is_connected)

    @patch('mount.serial.serial.Serial')
    def test_connection_failure(self, mock_serial):
        """Test connection failure."""
        mock_serial.side_effect = Exception("Connection failed")
        self.mount.connection()
        self.assertFalse(self.mount.is_connected)

    def test_write_not_connected(self):
        """Test write when not connected."""
        result = self.mount.write(":GR#")
        self.assertFalse(result)

    @patch('mount.serial.serial.Serial')
    def test_write_success(self, mock_serial):
        """Test successful write."""
        mock_conn = Mock()
        mock_serial.return_value = mock_conn
        self.mount.connection()
        
        result = self.mount.write(":GR#")
        self.assertTrue(result)
        mock_conn.write.assert_called_once_with(b":GR#")

    def test_read_not_connected(self):
        """Test read when not connected."""
        result = self.mount.read_data()
        self.assertIsNone(result)

    @patch('mount.serial.serial.Serial')
    def test_read_success(self, mock_serial):
        """Test successful read."""
        mock_conn = Mock()
        mock_conn.readline.return_value = b"12:34:56\n"
        mock_serial.return_value = mock_conn
        self.mount.connection()
        
        result = self.mount.read_data()
        self.assertEqual(result, "12:34:56")


if __name__ == '__main__':
    unittest.main()

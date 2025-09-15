"""Unit tests for INDI client."""

import unittest
from unittest.mock import Mock, patch
from .indi_client import IndiClient


class TestIndiClient(unittest.TestCase):
    """Test IndiClient class."""

    def setUp(self):
        """Set up test fixtures."""
        self.indi = IndiClient()

    @patch('mount.indi_client.socket.socket')
    def test_server_running_true(self, mock_socket):
        """Test server running detection."""
        mock_sock = Mock()
        mock_sock.connect_ex.return_value = 0
        mock_socket.return_value = mock_sock
        
        result = self.indi.is_server_running()
        self.assertTrue(result)

    @patch('mount.indi_client.socket.socket')
    def test_server_running_false(self, mock_socket):
        """Test server not running detection."""
        mock_sock = Mock()
        mock_sock.connect_ex.return_value = 1
        mock_socket.return_value = mock_sock
        
        result = self.indi.is_server_running()
        self.assertFalse(result)

    @patch('mount.indi_client.subprocess.run')
    def test_connect_mount_success(self, mock_run):
        """Test successful mount connection."""
        with patch.object(self.indi, 'is_server_running', return_value=True):
            mock_run.return_value = Mock()
            
            result = self.indi.connect_mount()
            self.assertTrue(result)
            self.assertTrue(self.indi.connected)

    @patch('mount.indi_client.subprocess.run')
    def test_connect_mount_server_down(self, mock_run):
        """Test mount connection when server down."""
        with patch.object(self.indi, 'is_server_running', return_value=False):
            result = self.indi.connect_mount()
            self.assertFalse(result)

    @patch('mount.indi_client.subprocess.run')
    def test_get_mount_status_connected(self, mock_run):
        """Test getting mount status when connected."""
        with patch.object(self.indi, 'is_server_running', return_value=True):
            mock_run.return_value = Mock(stdout="CONNECT=On")
            
            result = self.indi.get_mount_status()
            self.assertTrue(result)

    @patch('mount.indi_client.subprocess.run')
    def test_get_mount_status_disconnected(self, mock_run):
        """Test getting mount status when disconnected."""
        with patch.object(self.indi, 'is_server_running', return_value=True):
            mock_run.return_value = Mock(stdout="CONNECT=Off")
            
            result = self.indi.get_mount_status()
            self.assertFalse(result)


if __name__ == '__main__':
    unittest.main()

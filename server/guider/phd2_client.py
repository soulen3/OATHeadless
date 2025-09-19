"""PHD2 JSON-RPC client for guiding control."""

import json
from typing import Any, Dict, Optional

import requests


class PHD2Client:
    def __init__(self, host: str = "localhost", port: int = 4400):
        self.base_url = f"http://{host}:{port}"
        self.session = requests.Session()
        self.session.timeout = 5
        self.request_id = 1

    def _send_request(
        self, method: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send JSON-RPC request to PHD2."""
        payload = {"method": method, "id": self.request_id, "jsonrpc": "2.0"}
        if params:
            payload["params"] = params

        self.request_id += 1

        try:
            response = self.session.post(self.base_url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"PHD2 communication error: {str(e)}")

    def get_app_state(self) -> str:
        """Get current PHD2 application state."""
        result = self._send_request("get_app_state")
        return result.get("result", "Stopped")

    def is_connected(self) -> bool:
        """Check if PHD2 is connected and responding."""
        try:
            self.get_app_state()
            return True
        except:
            return False

    def start_guiding(self) -> bool:
        """Start PHD2 guiding."""
        try:
            result = self._send_request(
                "guide", {"settle": {"pixels": 1.5, "time": 10, "timeout": 100}}
            )
            return "error" not in result
        except:
            return False

    def stop_guiding(self) -> bool:
        """Stop PHD2 guiding."""
        try:
            result = self._send_request("stop_capture")
            return "error" not in result
        except:
            return False

    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive PHD2 status."""
        try:
            state = self.get_app_state()
            return {
                "connected": True,
                "state": state,
                "guiding": state in ["Guiding", "LostLock"],
            }
        except:
            return {"connected": False, "state": "Stopped", "guiding": False}

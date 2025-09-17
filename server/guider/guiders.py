"""Setup connections for guider cameras."""

import os
import time
import cv2

IMAGE_PATH = "/var/www/images"


class GuiderCamera:
    def __init__(self, name, index):
        self.name = name
        self.index = index

    def get_image(self):
        cap = cv2.VideoCapture(self.index)
        if not cap.isOpened():
            cap.release()
            raise Exception(f"Cannot open guider camera at index {self.index}")
            
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            raise Exception("Failed to capture frame from guider camera")
            
        filename = self.output_file_name()
        filepath = f"{IMAGE_PATH}/{filename}"
        
        # Ensure directory exists
        os.makedirs(IMAGE_PATH, exist_ok=True)
        
        success = cv2.imwrite(filepath, frame)
        if not success:
            raise Exception("Failed to save guider image")
            
        return filename

    def output_file_name(self):
        return f"{self.name}_guider_{time.time()}.jpg"

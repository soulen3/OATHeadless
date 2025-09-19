"""Setup connections for guider and cammera."""

import os
import time

import cv2
import gphoto2 as gp

IMAGE_PATH = "/var/www/images"


def get_camera_list():
    """Check for cameras that have been connected or removed."""
    gp_cameras = list(gp.gp_camera_autodetect())
    gp_return_list = []
    if gp_cameras:
        for model, port in camera_list:
            gp_return_list.append(f"{model}, {port}")
    cv_cameras = []
    for index in range(10):
        cap = cv2.VideoCapture(index)
        if cap is not None and cap.isOpened():
            name = cap.getBackendName()
            if not name:
                name = f"webcam{index}"
            cv_cameras.append({"index": index, "name": name})
            cap.release()
    return {"webcameras": cv_cameras, "ptp_cameras": gp_return_list}


class GPCamera:
    def __init__(self, name):
        self.name = name
        self.camera = gp.Camera()
        self.camera.init()

    def get_image(self):
        """Take an image, this file will be saved on the camera's memeory card."""
        file_path = self.camera.capture(gp.GP_CAPTURE_IMAGE)
        camera_file = self.camera.file_get(
            file_path.folder, file_path.name, gp.GP_FILE_TYPE_NORMAL
        )
        target_path = f"{IMAGE_PATH}/{file_name}"
        camera_file.save(target_path)
        return filename

    def get_liveview(self):
        """Get a preview, this image won't be saved on the camera's memeory card."""
        file_name = f"{self.name}_liveview.jpg"
        camera_file = self.camera.capture_preview()
        camera_file.save(f"{IMAGE_PATH}/{file_name}")
        return file_name

    def get_summary(self):
        return self.camera.get_summary()

    def get_config(self):
        return self.camera.get_config()


class CVCamera:
    def __init__(self, name, index):
        self.name = name
        self.index = index

    def get_image(self):
        cap = cv2.VideoCapture(self.index)
        if not cap.isOpened():
            cap.release()
            raise Exception(f"Cannot open camera at index {self.index}")

        ret, frame = cap.read()
        cap.release()

        if not ret:
            raise Exception("Failed to capture frame from camera")

        filename = self.output_file_name()
        filepath = f"{IMAGE_PATH}/{filename}"

        # Ensure directory exists
        os.makedirs(IMAGE_PATH, exist_ok=True)

        success = cv2.imwrite(filepath, frame)
        if not success:
            raise Exception("Failed to save image")

        return filename

    def output_file_name(self):
        return f"{self.name}_{time.time()}.jpg"

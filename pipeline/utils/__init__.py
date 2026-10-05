"""
utils/__init__.py — re-exports for convenience.
video_utils (cv2-dependent) is imported lazily to avoid errors in test environments.
"""


def _lazy_import_video_utils():
    from .video_utils import get_video_meta, frame_generator, resize_frame, frames_to_rgb
    return get_video_meta, frame_generator, resize_frame, frames_to_rgb

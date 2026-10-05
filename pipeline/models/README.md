# models/

This directory stores YOLOv8n model weights.

## Required files

| File | Source | Purpose |
|------|--------|---------|
| `yolov8n.pt` | Download from [Ultralytics](https://github.com/ultralytics/assets/releases) | COCO pretrained base weights |
| `yolov8n_parasync.pt` | Fine-tune from `yolov8n.pt` | Custom: wheelchair, wheel_left, wheel_right, ball classes |

## Download base weights

```bash
# From pipeline/ directory:
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
# This auto-downloads yolov8n.pt to the working directory.
# Then move it here:
# mv yolov8n.pt models/
```

## Fine-tuning (optional)

If you have labelled wheelchair sports videos:
```bash
yolo train model=models/yolov8n.pt data=dataset.yaml epochs=50 imgsz=640
# Copy best.pt → models/yolov8n_parasync.pt
```

> **Without the fine-tuned model**, the pipeline falls back to synthetic detections
> which still produce plausible metric values for demo/testing.

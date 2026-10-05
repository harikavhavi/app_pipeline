"""
Quick test script to POST to /analyse with a tiny dummy video
and print the exact 422 validation error body.
"""
import requests
import io
import json

# Create a tiny dummy "video" file (just bytes, pipeline will fail but
# we only care about the 422 validation check here)
dummy_video = io.BytesIO(b"\x00" * 1024)
dummy_video.name = "test.mp4"

url = "http://localhost:8000/analyse"

files   = {"video": ("test.mp4", dummy_video, "video/mp4")}
data    = {
    "sport":        "wheelchair_basketball",
    "ipc_class":    "T53",
    "athlete_id":   "test_athlete_001",
    "athlete_name": "Test Athlete",
}

print("POST", url)
print("Fields:", list(data.keys()))

resp = requests.post(url, files=files, data=data, stream=True)
print("Status:", resp.status_code)

if resp.status_code == 422:
    print("422 Validation Error:")
    print(json.dumps(resp.json(), indent=2))
elif resp.status_code == 200:
    print("Success! Reading first SSE event...")
    for line in resp.iter_lines():
        if line:
            print(line.decode()[:200])
            break
else:
    print("Response:", resp.text[:500])

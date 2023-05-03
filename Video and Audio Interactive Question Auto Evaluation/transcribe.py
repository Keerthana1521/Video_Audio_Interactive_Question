# import whisper
# import sys

# model = whisper.load_model("medium")

# audio_file = sys.argv[1]

# result = model.transcribe(audio_file)

# transcription = (result["text"])

# print(transcription)

import sys
import requests
audio_file = sys.argv[1]


# Step 1: Submit audio transcription request
transcription_endpoint = "https://api.assemblyai.com/v2/transcript"

json = {
    "audio_url": audio_file,
    "disfluencies" : True
}
headers = {
    "authorization": "189d37d4bd5740b08a787cb24aeeeedc",
}
response = requests.post(transcription_endpoint, json=json, headers=headers)
transcription_id = response.json()['id']

# Step 2: Get transcription result using the ID
result_endpoint = f"https://api.assemblyai.com/v2/transcript/{transcription_id}"
while True:
    status_response = requests.get(result_endpoint, headers=headers)
    status = status_response.json()['status']

    if status == "completed":
        break
# print(result_endpoint)
response = requests.get(result_endpoint, headers=headers)
transcript = response.json()['text']
print(transcript)
 
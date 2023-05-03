import librosa
import numpy as np
from sklearn.cluster import KMeans

# Load the audio file
import sys

# #Load the audio file from stdin
audio_file = sys.stdin.readline().strip()
audio_data, sr = librosa.load(audio_file)

# audio_file = 'E:/Activity_1/video_to_text/audio/audio.wav'
# audio_data, sr = librosa.load(audio_file)

# Preprocess the audio data
audio_data = librosa.effects.trim(audio_data, top_db=20)[0]
audio_data = librosa.util.normalize(audio_data)
segments = librosa.effects.split(audio_data, top_db=25, frame_length=2048, hop_length=512)

# Extract features from the audio data
features = []
for start, end in segments:
    segment = audio_data[start:end]
    mfccs = librosa.feature.mfcc(y=segment, sr=sr, n_mfcc=13)
    features.append(np.mean(mfccs, axis=1))

# Cluster the features using K-means
if len(features) < 2:
    num_voices = 1
else:
    kmeans = KMeans(n_clusters=2, random_state=0).fit(features)
    num_voices = len(np.unique(kmeans.labels_))

print(num_voices)


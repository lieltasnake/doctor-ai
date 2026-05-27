import sounddevice as sd
import numpy as np
from faster_whisper import WhisperModel
import scipy.io.wavfile as wav

model = WhisperModel("base", compute_type="int8")

def listen():
    print("🎤 Listening...")

    fs = 16000
    seconds = 5

    audio = sd.rec(int(seconds * fs), samplerate=fs, channels=1, dtype='float32')
    sd.wait()

    file = "temp.wav"
    wav.write(file, fs, (audio * 32767).astype(np.int16))

    segments, _ = model.transcribe(file)

    text = " ".join([seg.text for seg in segments]).strip()

    if text:
        print("🗣️ You said:", text)
        return text

    return None
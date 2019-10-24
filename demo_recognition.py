import subprocess
path = """python ./whiteboard_vision/clova_recognition/demo.py --Transformation TPS --FeatureExtraction ResNet --SequenceModeling BiLSTM --Prediction Attn --image_folder bbox_results/ --saved_model ./whiteboard_vision/clova_recognition/weights/TPS-ResNet-BiLSTM-Attn.pth"""
with open("output.txt", "w") as f:
    subprocess.call(path, shell=True, stdout=f)
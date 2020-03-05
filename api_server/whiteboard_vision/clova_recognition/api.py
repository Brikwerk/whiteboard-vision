import string
import argparse
from types import SimpleNamespace
import os

import torch
import torch.backends.cudnn as cudnn
import torch.utils.data
import torch.nn.functional as F

from .utils import CTCLabelConverter, AttnLabelConverter
from .dataset import RawDataset, AlignCollateNoLabels, ImageDataset
from .model import Model
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def recognize_text(images, 
    workers=4, 
    batch_size=192, 
    saved_model=None,
    batch_max_length=25,
    imgH=32, imgW=100, rgb=False,
    character='0123456789abcdefghijklmnopqrstuvwxyz',
    sensitive=False,
    PAD=False,
    Transformation="TPS",
    FeatureExtraction="ResNet",
    SequenceModeling="BiLSTM",
    Prediction="Attn",
    num_fiducial=20,
    input_channel=1, output_channel=512,
    hidden_size=256):

    """Recognizes text in a given set of images
    
    :param images: An array of loaded images (can be from Pillow, OpenCV, etc)
    :param workers: Number of data loading workers
    :param batch_size: Input batch size
    :param saved_model: Path to the saved model
    :param batch_max_length: Maximum label length
    :param imgH: The height of the input image
    :param imgW: The width of the input image
    :param rgb: Use RGB input
    :param character: Chars that used for identification
    :param sensitive: For upper/lower case sensitive mode
    :param PAD: Whether to keep ratio then pad for image resize
    :param Transformation: Transformation stage: Transformation stage: None | TPS
    :param FeatureExtraction: Feature Extraction stage: VGG | RCNN | ResNet
    :param SequenceModeling: Sequence Modeling stage: None | BiLSTM
    :param Prediction: Prediction stage: CTC | Attn
    :param num_fiducial: Number of fiducial points of TPS-STN
    :param input_channel: The number of input channels of the feature extractor
    :param output_channel: The number of output channels of the feature extractor
    :param hidden_size: The size of the LSTM hidden state
    """
    torch.multiprocessing.freeze_support()
    if saved_model == None:
        # Getting model path
        saved_model = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)),
            "weights/TPS-ResNet-BiLSTM-Attn.pth"))

    # Assembling options
    opt_json = {
        "images": images,
        "workers": workers,
        "batch_size": batch_size,
        "saved_model": saved_model,
        "batch_max_length": batch_max_length,
        "imgH": imgH,
        "imgW": imgW,
        "rgb": rgb,
        "character": character,
        "sensitive": sensitive,
        "PAD": PAD,
        "Transformation": Transformation,
        "FeatureExtraction": FeatureExtraction,
        "SequenceModeling": SequenceModeling,
        "Prediction": Prediction,
        "num_fiducial": num_fiducial,
        "input_channel": input_channel,
        "output_channel": output_channel,
        "hidden_size": hidden_size
    }
    opt = SimpleNamespace(**opt_json)

    if 'CTC' in opt.Prediction:
        converter = CTCLabelConverter(opt.character)
    else:
        converter = AttnLabelConverter(opt.character)
    opt.num_class = len(converter.character)

    if opt.rgb:
        opt.input_channel = 3
    model = Model(opt)
    print('model input parameters', opt.imgH, opt.imgW, opt.num_fiducial, opt.input_channel, opt.output_channel,
          opt.hidden_size, opt.num_class, opt.batch_max_length, opt.Transformation, opt.FeatureExtraction,
          opt.SequenceModeling, opt.Prediction)
    model = torch.nn.DataParallel(model).to(device)

    # load model
    print('loading pretrained model from %s' % opt.saved_model)
    if torch.cuda.is_available():
        model.load_state_dict(torch.load(opt.saved_model))
    else:
        model.load_state_dict(torch.load(opt.saved_model, map_location=torch.device('cpu')))

    AlignCollate_images = AlignCollateNoLabels(imgH=opt.imgH, imgW=opt.imgW, keep_ratio_with_pad=opt.PAD)
    image_data = ImageDataset(images, opt.rgb)
    image_loader = torch.utils.data.DataLoader(
        image_data, batch_size=opt.batch_size,
        shuffle=False,
        num_workers=int(opt.workers),
        collate_fn=AlignCollate_images, pin_memory=True)

    # predict
    model.eval()
    with torch.no_grad():
        for image_tensors in image_loader:
            batch_size = image_tensors.size(0)
            image = image_tensors.to(device)
            # For max length prediction
            length_for_pred = torch.IntTensor([opt.batch_max_length] * batch_size).to(device)
            text_for_pred = torch.LongTensor(batch_size, opt.batch_max_length + 1).fill_(0).to(device)

            if 'CTC' in opt.Prediction:
                preds = model(image, text_for_pred).log_softmax(2)

                # Select max probabilty (greedy decoding) then decode index to character
                preds_size = torch.IntTensor([preds.size(1)] * batch_size)
                _, preds_index = preds.permute(1, 0, 2).max(2)
                preds_index = preds_index.transpose(1, 0).contiguous().view(-1)
                preds_str = converter.decode(preds_index.data, preds_size.data)

            else:
                preds = model(image, text_for_pred, is_train=False)

                # select max probabilty (greedy decoding) then decode index to character
                _, preds_index = preds.max(2)
                preds_str = converter.decode(preds_index, length_for_pred)

            print('-' * 80)
            print('predicted_label\tConfidence Score')
            print('-' * 80)
            preds_prob = F.softmax(preds, dim=2)
            preds_max_prob, _ = preds_prob.max(dim=2)
            for pred, pred_max_prob in zip(preds_str, preds_max_prob):
                if 'Attn' in opt.Prediction:
                    pred_EOS = pred.find('[s]')
                    pred = pred[:pred_EOS]  # prune after "end of sentence" token ([s])
                    pred_max_prob = pred_max_prob[:pred_EOS]

                # calculate confidence score (= multiply of pred_max_prob)
                confidence_score = pred_max_prob.cumprod(dim=0)[-1]

                print(f'{pred}\t{confidence_score}')

class CraftRecognition:
    def __init__(self, workers=4, 
    batch_size=192, 
    saved_model=None,
    batch_max_length=25,
    imgH=32, imgW=100, rgb=False,
    character='0123456789abcdefghijklmnopqrstuvwxyz',
    sensitive=False,
    PAD=False,
    Transformation="TPS",
    FeatureExtraction="ResNet",
    SequenceModeling="BiLSTM",
    Prediction="Attn",
    num_fiducial=20,
    input_channel=1, output_channel=512,
    hidden_size=256):
        torch.multiprocessing.freeze_support()
        if saved_model == None:
            # Getting model path
            saved_model = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                "weights/TPS-ResNet-BiLSTM-Attn.pth"))

        # Assembling options
        opt_json = {
            "workers": workers,
            "batch_size": batch_size,
            "saved_model": saved_model,
            "batch_max_length": batch_max_length,
            "imgH": imgH,
            "imgW": imgW,
            "rgb": rgb,
            "character": character,
            "sensitive": sensitive,
            "PAD": PAD,
            "Transformation": Transformation,
            "FeatureExtraction": FeatureExtraction,
            "SequenceModeling": SequenceModeling,
            "Prediction": Prediction,
            "num_fiducial": num_fiducial,
            "input_channel": input_channel,
            "output_channel": output_channel,
            "hidden_size": hidden_size
        }
        self.opt = SimpleNamespace(**opt_json)

        if 'CTC' in self.opt.Prediction:
            self.converter = CTCLabelConverter(self.opt.character)
        else:
            self.converter = AttnLabelConverter(self.opt.character)
        self.opt.num_class = len(self.converter.character)

        if self.opt.rgb:
            self.opt.input_channel = 3
        self.model = Model(self.opt)
        self.model = torch.nn.DataParallel(self.model).to(device)

        # load model
        print('Loading Craft Recognition Model from %s' % self.opt.saved_model)
        if torch.cuda.is_available():
            self.model.load_state_dict(torch.load(self.opt.saved_model))
        else:
            self.model.load_state_dict(torch.load(self.opt.saved_model, map_location=torch.device('cpu')))
        
        self.model.eval()
    

    def recognize_text(self, images):
        AlignCollate_images = AlignCollateNoLabels(imgH=self.opt.imgH, imgW=self.opt.imgW, keep_ratio_with_pad=self.opt.PAD)
        image_data = ImageDataset(images, self.opt.rgb)
        image_loader = torch.utils.data.DataLoader(
            image_data, batch_size=self.opt.batch_size,
            shuffle=False,
            num_workers=int(self.opt.workers),
            collate_fn=AlignCollate_images, pin_memory=True)

        with torch.no_grad():
            for image_tensors in image_loader:
                batch_size = image_tensors.size(0)
                image = image_tensors.to(device)
                # For max length prediction
                length_for_pred = torch.IntTensor([self.opt.batch_max_length] * batch_size).to(device)
                text_for_pred = torch.LongTensor(batch_size, self.opt.batch_max_length + 1).fill_(0).to(device)

                if 'CTC' in self.opt.Prediction:
                    preds = self.model(image, text_for_pred).log_softmax(2)

                    # Select max probabilty (greedy decoding) then decode index to character
                    preds_size = torch.IntTensor([preds.size(1)] * batch_size)
                    _, preds_index = preds.permute(1, 0, 2).max(2)
                    preds_index = preds_index.transpose(1, 0).contiguous().view(-1)
                    preds_str = self.converter.decode(preds_index.data, preds_size.data)

                else:
                    preds = self.model(image, text_for_pred, is_train=False)

                    # select max probabilty (greedy decoding) then decode index to character
                    _, preds_index = preds.max(2)
                    preds_str = self.converter.decode(preds_index, length_for_pred)

                preds_prob = F.softmax(preds, dim=2)
                preds_max_prob, _ = preds_prob.max(dim=2)
                results = []
                for pred, pred_max_prob in zip(preds_str, preds_max_prob):
                    if 'Attn' in self.opt.Prediction:
                        pred_EOS = pred.find('[s]')
                        pred = pred[:pred_EOS]  # prune after "end of sentence" token ([s])
                        pred_max_prob = pred_max_prob[:pred_EOS]

                    # calculate confidence score (= multiply of pred_max_prob)
                    confidence_score = pred_max_prob.cumprod(dim=0)[-1]

                    results.append([pred, confidence_score])
                
                return results

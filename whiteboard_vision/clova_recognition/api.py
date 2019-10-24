import string
import argparse
from types import SimpleNamespace
import os

import torch
import torch.backends.cudnn as cudnn
import torch.utils.data

from .utils import CTCLabelConverter, AttnLabelConverter
from .dataset import RawDataset, AlignCollate, ImageDataset
from .model import Model
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def recognize_text(images, 
    workers=4, 
    batch_size=192, 
    saved_model=None,
    batch_max_length=25,
    imgH=32, imgW=100, rgb=True,
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

    parser = argparse.ArgumentParser()
    parser.add_argument('--images', help='path to image_folder which contains text images')
    parser.add_argument('--workers', type=int, help='number of data loading workers', default=4)
    parser.add_argument('--batch_size', type=int, default=64, help='input batch size')
    parser.add_argument('--saved_model', help="path to saved_model to evaluation")
    """ Data processing """
    parser.add_argument('--batch_max_length', type=int, default=25, help='maximum-label-length')
    parser.add_argument('--imgH', type=int, default=32, help='the height of the input image')
    parser.add_argument('--imgW', type=int, default=100, help='the width of the input image')
    parser.add_argument('--rgb', action='store_true', help='use rgb input')
    parser.add_argument('--character', type=str, default='0123456789abcdefghijklmnopqrstuvwxyz', help='character label')
    parser.add_argument('--sensitive', action='store_true', help='for sensitive character mode')
    parser.add_argument('--PAD', action='store_true', help='whether to keep ratio then pad for image resize')
    """ Model Architecture """
    parser.add_argument('--Transformation', type=str, default="TPS", help='Transformation stage. None|TPS')
    parser.add_argument('--FeatureExtraction', type=str, default="ResNet", help='FeatureExtraction stage. VGG|RCNN|ResNet')
    parser.add_argument('--SequenceModeling', type=str, default="BiLSTM", help='SequenceModeling stage. None|BiLSTM')
    parser.add_argument('--Prediction', type=str, default="Attn", help='Prediction stage. CTC|Attn')
    parser.add_argument('--num_fiducial', type=int, default=20, help='number of fiducial points of TPS-STN')
    parser.add_argument('--input_channel', type=int, default=1, help='the number of input channel of Feature extractor')
    parser.add_argument('--output_channel', type=int, default=512,
                        help='the number of output channel of Feature extractor')
    parser.add_argument('--hidden_size', type=int, default=256, help='the size of the LSTM hidden state')

    opt = parser.parse_args()
    opt.saved_model = saved_model
    opt.images = images

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
    model.load_state_dict(torch.load(saved_model))

    AlignCollate_demo = AlignCollate(imgH=opt.imgH, imgW=opt.imgW, keep_ratio_with_pad=opt.PAD)
    demo_data = RawDataset(root="/test_images", opt=opt)
    demo_loader = torch.utils.data.DataLoader(
        demo_data, batch_size=opt.batch_size,
        shuffle=False,
        num_workers=int(opt.workers),
        collate_fn=AlignCollate_demo, pin_memory=True)

    # predict
    model.eval()
    with torch.no_grad():
        for image_tensors, image_path_list in demo_loader:
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

            for pred in preds_str:
                if 'Attn' in opt.Prediction:
                    pred = pred[:pred.find('[s]')]  # prune after "end of sentence" token ([s])

                print(f'{img_name}\t{pred}')

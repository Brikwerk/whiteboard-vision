"""  
Copyright (c) 2019-present NAVER Corp.
Modification (c) 2019-present Reece Walsh
MIT License
"""

# -*- coding: utf-8 -*-
import sys
import os
import uuid

import torch
import torch.nn as nn
import torch.backends.cudnn as cudnn
from torch.autograd import Variable

from PIL import Image

import cv2
from skimage import io
import numpy as np
from . import file_utils
from . import craft_utils
from . import imgproc
from . import file_utils
import json
import zipfile

from .craft import CRAFT

from collections import OrderedDict

def copyStateDict(state_dict):
    if list(state_dict.keys())[0].startswith("module"):
        start_idx = 1
    else:
        start_idx = 0
    new_state_dict = OrderedDict()
    for k, v in state_dict.items():
        name = ".".join(k.split(".")[start_idx:])
        new_state_dict[name] = v
    return new_state_dict


def run_net(net, image, text_threshold=0.7, link_threshold=0.4, low_text=0.4,
cuda=True, poly=False, refine_net=None, canvas_size=1280, mag_ratio=1.5):
    # resize
    img_resized, target_ratio, size_heatmap = imgproc.resize_aspect_ratio(
        image, canvas_size, interpolation=cv2.INTER_LINEAR, mag_ratio=mag_ratio
    )
    ratio_h = ratio_w = 1 / target_ratio

    # preprocessing
    x = imgproc.normalizeMeanVariance(img_resized)
    x = torch.from_numpy(x).permute(2, 0, 1)    # [h, w, c] to [c, h, w]
    x = Variable(x.unsqueeze(0))                # [c, h, w] to [b, c, h, w]
    if cuda:
        x = x.cuda()

    # forward pass
    with torch.no_grad():
         y, feature = net(x)

    # make score and link map
    score_text = y[0,:,:,0].cpu().data.numpy()
    score_link = y[0,:,:,1].cpu().data.numpy()

    # refine link
    if refine_net is not None:
        with torch.no_grad():
             y_refiner = refine_net(y, feature)
        score_link = y_refiner[0,:,:,0].cpu().data.numpy()

    # Post-processing
    boxes, polys = craft_utils.getDetBoxes(score_text, score_link, text_threshold, link_threshold, low_text, poly)

    # coordinate adjustment
    boxes = craft_utils.adjustResultCoordinates(boxes, ratio_w, ratio_h)
    polys = craft_utils.adjustResultCoordinates(polys, ratio_w, ratio_h)
    for k in range(len(polys)):
        if polys[k] is None: polys[k] = boxes[k]

    # render results (optional)
    render_img = score_text.copy()
    render_img = np.hstack((render_img, score_link))
    ret_score_text = imgproc.cvt2HeatmapImg(render_img)

    return boxes, polys, ret_score_text


class CraftDetection:
    def __init__(self, use_refiner=False, debug=False):
        self.debug = debug
        # load net
        self.net = CRAFT()     # initialize
        self.cuda = torch.cuda.is_available()

        # Loading weights from pre-trained models
        model_path = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)),
            "weights/craft_mlt_25k.pth"))
        print("Loading Craft Detection Model from %s" % model_path)
        if self.cuda:
            self.net.load_state_dict(copyStateDict(torch.load(model_path)))
        else:
            self.net.load_state_dict(copyStateDict(torch.load(model_path, map_location='cpu')))

        if self.cuda:
            self.net = self.net.cuda()
            self.net = torch.nn.DataParallel(self.net)
            cudnn.benchmark = False

        self.net.eval()

        # LinkRefiner
        self.refine_net = None
        if use_refiner:
            from .refinenet import RefineNet
            self.refine_net = RefineNet()
            # Loading weights from pre-trained refiner
            refiner_path = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                "weights/craft_refiner_CTW1500.pth"))
            if cuda:
                self.refine_net.load_state_dict(copyStateDict(torch.load(refiner_path)))
                self.refine_net = self.refine_net.cuda()
                self.refine_net = torch.nn.DataParallel(self.refine_net)
            else:
                self.refine_net.load_state_dict(copyStateDict(torch.load(refiner_path, map_location='cpu')))

            self.refine_net.eval()


    def detect_text(self, image):
        if self.cuda:
            bboxes, polys, score_text = run_net(self.net, image, refine_net=self.refine_net)
        else:
            bboxes, polys, score_text = run_net(self.net, image, refine_net=self.refine_net, cuda=False)
        
        if self.debug:
            # Saving drawn bounding boxes
            image_path = "results_" + str(uuid.uuid4())[:4] + ".png"
            file_utils.saveResult(image_path, image[:,:,::-1], polys, dirname="./results/")

        return bboxes, polys

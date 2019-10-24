# Whiteboard Vision Project Reporting

## Sept 12

### Progress

- No items of note from previous week

### Minutes

- Create Github repo
- Re-established project base:
  - Detect and transcribe text written on a whiteboard. Project will start assuming perfect conditions (no obstructions, whiteboard is square, in-focus, etc).
- Create README on repo
  - Features of system
  - Roadmap
  - Challenges
- Detail week-by-week in reports. What's been done, what to do next.
- Create a place to store meeting notes
- Rough plan for project, ensure to leave time at end for report/docs.

### Next Week

- Research handwritten text recognition (HTR) strategies and avenues
- Begin testing potential HTR strategies against gathered data (Eg: photos of whiteboard)
- Search for potential datasets with relevant data

## Sept 17

### Progress

#### Existing Projects with Promising HTR

https://github.com/githubharald/SimpleHTR
- Good starter project
- Only works on the IAM dataset, could extend
- Not super accurate, however, pre-processing and further tips could improve this approach

https://github.com/Breta01/handwriting-ocr
- Very in-depth approach
- Lots of examples, however, the text recognition segment has poor performance
- Good reference models

#### Potential Datasets for Usage

#### Breta's data
https://drive.google.com/file/d/0Bw95a8U_pp2aakE0emZraHpHczA/view?usp=sharing
- 5000 images of words
- Labelled
- MIT license

#### IAM Handwriting dataset
http://www.fki.inf.unibe.ch/databases/iam-handwriting-database
- Largest handwriting dataset publically available
- Lines, words, and characters labelled
- Public domain

#### CVL v3
https://zenodo.org/record/1492267
- 84000 images
- Public domain

#### ORAND CAR 2014
http://www.orand.cl/en/icfhr2014-hdsr/#datasets
- 11700 images
- Public domain

Cambridge Handwriting dataset
- 5200 images
- Public domain

#### Testing out Existing Projects

- Tested SimpleHTR
- Poor performance, generally. Seems to have a penchat towards cursive detection. Bad with printed text.
- Could be extended by training on further datasets and larger dictionaries with Beam search

- Tested Breta's algorithm
- Okay performance with default template
- Awful performance with alternative algorithm. Claims it needs more training.
- Word detection is poor.
- Page detection functions well. Could look into how they do that for whiteboard detection.

#### Work into improving Pre-processing and Word Detection

- Began investigating pre-processing alogrithms + word detection for handwritten text
- Most detection strategies were for rigid text in natural scenes

- Reapplied SWT and got fairly good results
- Manually processed with photoshop and achieved better results
- Looked into achieving something similar with OpenCV. Surface blur + b&w + threshold
- OpenCV -> Bilateral filter, Otsu's method
http://shellandslate.com/fastmedian.html

- pyswt is very slow. Takes up to 5s to processing 800x600 image. Could continue attempt to parallelize? Worth continuing with or could a more trivial strategy be used?
- Encountered issues with glare. Could be solved with adaptive thresholding

- Achieved better results after usage of pre-processing in other projects

### Minutes

- Assume perfect image, no reflections
- Word detection needs to be worked on
- Ensure whiteboard text look like training sets
- In the future, should look into normalizing text further. Eg: correcting for tilt.

### Next Week

- Text detection as main focus
  - Evaluate different techniques
  - Re-evaluate Breta's text detection
  - Training a new text detection algorithm? Possibility?

## Sept 26

### Progress

#### Evaluation of Different Text Detection Methodologies

1. Handwriting OCR Text Detection
   - Pre-processing is applied:
   - Apply a light gaussian blur to the image
   - Sobel operator is applied to each channel of an RGB image.
   - The max results from each channel are collated into a single 2D array
   - An absolute threshold of 50 is applied to the image
   - The image is closed with a 15x15px square
   - Text-detection begins:
   - A small image is generated from the original
   - OpenCV is used to find contours from the previously processed image
   - Contours are iterated over and manually checked. Absolute values are used to throw out large bounding rectangles.
   - Rectangles within a certain range of values are kept.
   - These are drawn and displayed returned as words.
2. Primitive Blob Detection
    - Provided good results with sample images, however, proved unwieldy with tight text or low resolution photos.
3. CNN Text Detection
    - Very promising results on text. Detected words in adverse conditions.
    - Need to try on dense board as well as future scenarios.
    - Speed? Takes about 2s per image for large images. 1s for small.
4. Self-Taught CNN
    - Started in on attempt at training a similar neural network.
    - Pulled down datasets mentioned earlier
    - Started trying to collate them into a similar format to begin learning off of, encountered difficulties formatting for regions only

Best results were achieved from method #3, further investigation with a larger variety of images will be needed.

### Minutes

- Use #3, experiment with pre-processing
- Line vs Word detection
- Search to see if someone has done pre-prcoessing for text on whiteboard

### Next Week

- Continue tweaking and testing Text detection
- Test with further whiteboard images and pre-processing
- Investigate line vs word detection. Could one better?
- Search for any resources on whiteboard-specific text detection

## Oct 3

### Progress

#### Continued Tweaking and Testing of Text Detection Algorithms

- Continued evaluation of the CPTN Text Detection framework
  - Tested on a variety of images. Results were alright with uncomplicated whiteboard scenarios. Started to run into trouble with more complicated scenes.
  - Framework as attempting to string sentences together which resulted in lots of overlapping bounding boxes
  - Could potentially be bad since boxes weren't oriented, thus, would result in a poor crop when attempting to extract words.
  - Pre-processing images (Eg: removing background, thresholding, adjusting for brightness, etc) had minimal impact on results.
- Tested out a new text detection framework: CRAFT
  - CRAFT selects single words and attempts to orient bounding box to the word. This would result in better crops for word recognition.
  - Results were promising and competitive with CPTN. Performed potentially better in more complicated boards.
  - Tested with pre-processed images. They made little difference.

#### Line vs. Word Recognition

- Far more word recognition than line recognition algorithms
- Word recognition is easier since a dictionary can be used to support choices.

#### Whiteboard-specific Text Detection/Recognition

- Only on-line whiteboard detection research/algorithms were available.
- Whiteboard text detection/recognition seems to be handled as an on-line problem when approached.
- Examples include: Camera-pen systems, smart-board research, and smart-pen research.

#### Concerns

- How will the existing text detection frameworks be implemented into the project? Both are MIT, however, a supplementary model is downloaded which can be quite large -- Not a good thing to commit into a repo.
- Are pretrained models also under the license of the project? The CRAFT model won't supply the code that the pretrained model was trained with, for instance. OpenAI published a model and excluded the data too. It seems to be common practicd to link the model in the README so I would assume they mean for it to be included under the license? This needs more research.

### Minutes

- Spend more time looking for off-line whiteboard detection
- Continue tweaking text-detection
- If I have time, evaluate OCR algorithm
- Research underlying technology
- Look into licensing a bit more - specifically Apache

## Oct 10

### Progress

#### Off-line Whiteboard Detection in Existing Literature

- Plötz, Thomas, Christian Thurau, and Gernot A. Fink. "Camera-based whiteboard reading: New approaches to a challenging task." International Conference on Frontiers in Handwriting Recognition. 2008.
    - First comprehensive research done on end-to-end whiteboard notes to text
    - Uses Hidden Markov Models for text detection
    - Assumes text is well-formed and uses a more simplistic text detection method
    - Good info on normalization and extraction of whiteboard images

- Dickson, Paul E., et al. "Improved Whiteboard Processing for Lecture Capture." 2016 IEEE International Symposium on Multimedia (ISM). IEEE, 2016.
    - Fairly up-to-date study that looks into detecting whiteboard notes from a video feed
    - Attempts to remove lecturers and other moving objects through averaging techniques
    - Has novel methods for improving contrast and ledgibility for whiteboard notes

- Jia, Wei, et al. "A CNN-based approach to detecting text from images of whiteboards and handwritten notes." 2018 16th International Conference on Frontiers in Handwriting Recognition (ICFHR). IEEE, 2018.
    - One of the most modern studies that involved whiteboards in some way
    - Discuss CNN usage in detecting text in handwritten notes and on whiteboards
    - Strategy involves connected component analysis
    - Outperformed by other similar frameworks in text detection

- Kota, Bhargava Urala, et al. "Generalized framework for summarization of fixed-camera lecture videos by detecting and binarizing handwritten content." International Journal on Document Analysis and Recognition (IJDAR) (2019): 1-13.
    - Contains a summary postulating different theories and best practices for whiteboard text extraction, detection, and recognition.

#### CRAFT Progress

- Argument Usage
    - **text_threshold:** Certainty that something is a letter. Ranges from 0 to 1.0 with 1.0 being 100% certain. Default threshold is 0.7.
    - **link_threshold:** the amount of distance between characters to be considered a single word. Value ranges from 0 to 1.0. Defaults to 0.4.
    - **low_text:** The amount of space padding letters, words, and lines within a bounding box. The larger the values, the smaller the space. Raising this value can have an effect on the link threshold.

- Found disparities between the web demo and the text detection model provided. IP protection, possibly? Could be tweaking arguments with another model?

- Got linking to work correctly. Lines of text can now be identified, however, a per word basis might be better. Test with Clova OCR on performance?

#### CRAFT Detection Model

- Utilizes batch normalization (like VVG-16, a CNN for detection) and skips the decoding step to generate two output channels which are utilized as score-maps.
- Two channels are region score and affinity score. Both are 2D, isotropic gaussian maps. The region score maps where characters are likely while the affinity score maps how likely two characters are to be part of the same line of text.
- Another small network is trained and used to refine the concatenation of the affinity score and the region score. This new score is used like normal for the rest of the CRAFT network, however, this enables better linking when attempting to detect lines of text.

#### Licensing - Apache 2.0 vs. MIT

- Both licenses are fairly similar in that they are quite permissive, however, the Apache license has a couple of extra clauses:
    - Your product cannot present that it is endorsed by the Apache Foundation in any way.
    - Any modifications of the original source code must be explicitly noted. All modifications must be preserved in the source.

### Next Week

- Look into auto-optimization of arguments. Is this possible?
- Text detection + OCR with text file output. Output on 10-15 images.

## Oct 17

### Progress

#### Text Detection & OCR

- Created project infrastructure
- Added both the detection and recognition framework into the project
- Reconfigured the detection framework for usage within the project as an API
- Bounding boxes are being output per passed image path
- Should reconfigure to take in loaded image so we're not loading the image twice
- Currently stuck at extracting text from the image relative to the angle of the bounding boxes
- The detection framework still needs to be configured for usage within the project (exposing an API)

#### Auto-Optimization of Arguments

- Looked into more and our parameters seem more intuition/situation based
- I was thinking of hyper-parameter tuning last week. This refers to tuning a parameter such as k in the k-nearest neighbors algorithm
- Not super applicable to our project. Can probably set ours based off of intuition.

#### Ideas for the Project

- Could possibly integrate spellcheck into the recognition stage to make up for poor performance in recognition algorithm (being a few chars off).

### Next Week

- Continue implementation of text output for the project

## Oct 24

### Progress

#### Implementation of Text Output

- Text output is now function
- Bounding box cropping function is now functioning
- The recognition algorithm does not include orientation data, thus, bounding box cropping only attempts to align images to the nearest straight line.
- Image recognition is separate due to GPU memory bugs that need to be worked through

#### Next Week

- Correcting for orientation is the next big step
- If orientation is fixed quickly, try with non-ideal whiteboard
    - Handwriting vs printing on whiteboard. Results?
    - Glare, poor lighting, etc -- To be handled later

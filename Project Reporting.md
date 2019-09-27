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
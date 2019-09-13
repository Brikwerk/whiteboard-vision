# Whiteboard Vision

## Description

This project aims to detect and transcribe text written on a whiteboard in a classroom environment.

## Roadmap

### Base Features

*The minimum functionality*

- Text detection
- Word Segmentation
- Character detection

### Extended Features

*Features to begin working on after base functionality is achieved*

- Better Whiteboard Identification within a Scene
- Obstacle Robustness (Eg: Student obstructing a portion of a photo or the professor is standing in front of the whiteboard)
- Better output (Eg: Outputting text in a similar position to the input as a highlightable PDF)
- Accepting video as input

### Stretch Goals

*Potential features that could be investigated/implemented*

- Syncing audio with extracted text (could be implemented as a web app or powerpoint with audio)
  - To aid with this, erasure of the whiteboard could be detected to aid in context, slide transition, etc.
- Client (and possibly server?) that facilitates processing video of a whiteboard lecture and outputs an interactive lecture. Eg: Virtual whiteboard that updates with highlightable text in realtime.
- Diagram Detection and Extraction

## Challenges

- The largest challenge within this project will likely stem from creating a robust handwritten text recognition (HTR) system. Potential problems could include: Poor neural network planning, overfitting, underfitting, and lack of training data.

## Project Development Documentation

Progress reports for this project will be published weekly (every Wednesday) in the form of markdown files. These markdown files can be found in the "reports" folder located at the project's root.

Items discussed within meetings held about this project will be published within the "Minutes" markdown file, located within the "reports" folder.
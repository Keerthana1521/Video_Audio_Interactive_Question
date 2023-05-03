import cv2
import numpy as np
import sys

# Load the model


net = cv2.dnn.readNetFromCaffe('E:/Video & Audio Interactive Question Auto Evaluation/source/deploy.prototxt', 'E:/Video & Audio Interactive Question Auto Evaluation/source/res10_300x300_ssd_iter_140000.caffemodel')


video_file = sys.argv[1]

# Open the video capture object
video_capture = cv2.VideoCapture(video_file)
# video_capture = cv2.VideoCapture('https://github.com/Keerthana1521/KEEEEER/blob/main/keywords.mp4?raw=true')

total_faces_detected = 0
unique_faces_detected = []

fps = video_capture.get(cv2.CAP_PROP_FPS)


while True:
    ret, frame = video_capture.read()
    if not ret:
        break

    # Resize the frame to half of its original size
    frame = cv2.resize(frame, (int(frame.shape[1]/2), int(frame.shape[0]/2)))

    # Get the dimensions of the frame
    (h, w) = frame.shape[:2]

    # Create a blob from the image
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0,
        (300, 300), (104.0, 177.0, 123.0))

    # Set the input to the model
    net.setInput(blob)

    # Make detections
    detections = net.forward()

    # Loop over the detections
    for i in range(0, detections.shape[2]):
        confidence = detections[0, 0, i, 2]

        # Filter out weak detections
        if confidence > 0.7:
            # Get the bounding box coordinates
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            (x, y, x2, y2) = box.astype("int")

            # Draw the bounding box around the face
            cv2.rectangle(frame, (x, y), (x2, y2), (0, 255, 0), 2)

            # Check if this is a new face
            face_detected = False
            for (fx, fy, fw, fh) in unique_faces_detected:
                if abs(fx-x) < 50 and abs(fy-y) < 50:
                    face_detected = True
                    break

            if not face_detected:
                unique_faces_detected.append((x, y, x2-x, y2-y))
                total_faces_detected += 1

            # Draw the total number of faces detected on the frame
            cv2.putText(frame, "Total Faces: {}".format(total_faces_detected), (10, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 65, 255), 1)

    # Show the frame
    
    # cv2.imshow("Frame", frame)

    # Wait for 'q' to be pressed to exit the loop
    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

# Release the video capture object and destroy the windows
video_capture.release()
cv2.destroyAllWindows()

# Output the total number of unique faces detected to the console
print( total_faces_detected)

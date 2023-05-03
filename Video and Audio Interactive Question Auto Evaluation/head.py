import cv2
import dlib
import math
import sys

# Load the face detector and landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("E:/Video & Audio Interactive Question Auto Evaluation/source/shape_predictor_68_face_landmarks.dat")


video_file = sys.argv[1]

# # # Open the video capture object
# video_file = 'E:/Activity_1/video_to_text/audio/video1.mp4'
cap = cv2.VideoCapture(video_file)

# Initialize the eye positions for the first frame
left_eye = [(263, 344), (269, 325), (283, 315), (297, 313), (313, 320), (321, 332)]
right_eye = [(387, 330), (401, 319), (418, 314), (435, 316), (450, 326), (455, 339)]

# Set the threshold for eye movement
threshold = 50
not_looking_camera = 0

fps = cap.get(cv2.CAP_PROP_FPS)


# Process each frame of the video
while True:
    # Read the next frame
    ret, frame = cap.read()
    if not ret:
        break

    # Convert the frame to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces in the grayscale frame
    faces = detector(gray)

    # Process each face in the frame
    for face in faces:
        # Detect the landmarks for the face
        landmarks = predictor(gray, face)

        # Get the positions of the left and right eyes
        left_eye_new = [(landmarks.part(36).x, landmarks.part(36).y),
                         (landmarks.part(37).x, landmarks.part(37).y),
                         (landmarks.part(38).x, landmarks.part(38).y),
                         (landmarks.part(39).x, landmarks.part(39).y),
                         (landmarks.part(40).x, landmarks.part(40).y),
                         (landmarks.part(41).x, landmarks.part(41).y)]
        right_eye_new = [(landmarks.part(42).x, landmarks.part(42).y),
                         (landmarks.part(43).x, landmarks.part(43).y),
                         (landmarks.part(44).x, landmarks.part(44).y),
                         (landmarks.part(45).x, landmarks.part(45).y),
                         (landmarks.part(46).x, landmarks.part(46).y),
                         (landmarks.part(47).x, landmarks.part(47).y)]

        # Calculate the movement of the left eye
        left_eye_movement = 0
        for j in range(6):
            left_eye_movement += math.sqrt((left_eye_new[j][0] - left_eye[j][0]) ** 2 +
                                           (left_eye_new[j][1] - left_eye[j][1]) ** 2)

        # Calculate the movement of the right eye
        right_eye_movement = 0
        for j in range(6):
            right_eye_movement += math.sqrt((right_eye_new[j][0] - right_eye[j][0]) ** 2 +
                                            (right_eye_new[j][1] - right_eye[j][1]) ** 2)

        # Check if the person is looking at the camera
        if left_eye_movement < threshold and right_eye_movement < threshold:
            count=0
        else:
            
            not_looking_camera += 1

        # Update the positions of the eyes for the next frame
        left_eye = left_eye_new
        right_eye = right_eye_new

    # Display the video frame
   
    

    # Wait for 'q' to be pressed to exit the loop
    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

# Release the video capture object and destroy the windows
cap.release()
cv2.destroyAllWindows()

print(not_looking_camera)


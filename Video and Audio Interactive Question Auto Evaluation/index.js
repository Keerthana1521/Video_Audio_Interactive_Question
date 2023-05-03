const { spawn } = require('child_process');
const { PythonShell } = require('python-shell');
const { Sequelize } = require('sequelize');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: '3306',
  database: 'video',
  username: 'root',
  password: '1521',
  pool: {
    max: 10,
    min: 0,
    idle: 10000
  }
});

let user_video;
let user_key;
let text;
let globalAudioPath;
let fillerCounts;
let malmarks = 0;
let grammarcount;

class User extends Model { }
User.init({
  sample_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: DataTypes.INTEGER,
  url: DataTypes.STRING,
  transcribed_text: DataTypes.STRING,
  keywords: DataTypes.STRING,
  marks: DataTypes.INTEGER,
  malpractice_marks: DataTypes.INTEGER
}, { sequelize, modelName: 'evaluations', tablename: 'evaluations', updatedAt: false });

async function fetchUserData() {
  try {
    console.log("Getting the video_url of the user from the database...");
    const users = await sequelize.query('SELECT * FROM evaluations WHERE user_id = :id', {
      replacements: { id: 7 },
      type: Sequelize.QueryTypes.SELECT
    });
    user_video = users[0].url;
   
    //face detection

    let options = {
      mode: 'text',
      pythonPath: 'python',
      pythonOptions: ['-u'],
      scriptPath: 'E:/Video & Audio Interactive Question Auto Evaluation',
      args: [user_video] 
    };

    console.log("Number of faces is detecting...");
    PythonShell.run('./face.py', options).then((result) => {
      // console.log("Number of faces is detecting...");
      console.log("Number of faces detected", result);
      const numFacesDetected = parseInt(result[0]);

      // head pose detection
      console.log("Number of times not looking into the camera is detecting...");
      PythonShell.run('./head.py', options).then((results) => {
        // console.log("Number of times not looking into the camera is detecting...");
        console.log("Number of times not looking into the camera:", results);
        const NotLooking = parseInt(results[0]);


        //Video To Audio Conversion
        const path = require('path');
        const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
        const ffmpeg = require('fluent-ffmpeg');
        ffmpeg.setFfmpegPath(ffmpegPath);

        const userId = '7'; 
        const timestamp = Date.now(); 

        const inputFilePath = user_video;
        const audioFileName = `${userId}_${timestamp}.wav`;
        const audioPath = path.join('E:/Video & Audio Interactive Question Auto Evaluation/Audio', audioFileName);

        
        ffmpeg(inputFilePath)
          .output(audioPath)
          .audioCodec('pcm_s16le')
          .audioChannels(1)
          .on('end', () => {
            console.log('Audio is succesfully converted from the video...!');
          })
          .on('error', (err) => {
            console.error('Error converting file:', err);
          })
          .run();
        this.globalAudioPath = audioPath



        //Voice Detection
        let audio = this.globalAudioPath;
        console.log("Number of voice is detecting...");
        const pythonProcess = spawn('python', ['./voice.py']);
        pythonProcess.stdout.on('data', (data) => {
          // console.log("Number of voice is detecting...");
          console.log(`Number of voice detected: ${data}`);
          const num = `${data}`;
         

          // malpractice marks calculation

          let negative_mark_1 = 0;
          let negative_mark_2 = 0;
          let negative_mark_3 = 0;

          if ((numFacesDetected > 1) || (numFacesDetected == 0)) {
            console.log("Malpractice is detected in face detection...");
            negative_mark_1 = 10
          }
          else{
            negative_mark_1=0;
          }
          if (NotLooking > 10) {
            console.log("Malpractice is detected in not looking camera...");
            negative_mark_2 = 10
          }
          else{
            negative_mark_2=0;
          }
          if (num > 1)  {
            console.log("Malpractice is detected by multiple voice...");
            negative_mark_3 = 10
            
          }
          else{
            negative_mark_3=0;
          }
          
          // let malmarks = 0;
          
          malmarks = negative_mark_1 + negative_mark_2 + negative_mark_3;
          if(malmarks>0){
          console.log("Malpractice marks:", malmarks)
          }
          else{
            console.log("THERE IS NO MALPRACTICE DETECTED...");
          }
          
          transcribe();

        });
        pythonProcess.stdin.write(`${audio}\n`);

        // Transcribing 

        async function transcribe() {
          console.log("Audio is transcribing...");
          const Process = spawn('python', ['./transcribe.py', user_video]);

          Process.stdout.on('data', (data) => {
            // console.log("Audio is transcribing...");
            console.log(`Transcription: ${data}`);
            const transcription = `${data}`;

            Process.stderr.on('data', (data) => {
              console.error(`Error: ${data}`);
            });

            const fillers = ['uh', 'um', 'mmm', 'ah'];
            const words_1 = transcription.match(/\b\w+\b/g);
            const repeatedWords = {};

            let fillerCount = 0;
            let currentWord = null;
            let currentWordCount = 0;

            for (let i = 0; i < words_1.length; i++) {
              const word = words_1[i].toLowerCase().replace(',', '').replace('.', '').replace('?', '');

              if (fillers.includes(word)) {
                fillerCount++;
              }

              if (word === currentWord) {
                currentWordCount++;
              } else {
                if (currentWordCount > 1) {
                  repeatedWords[currentWord] = currentWordCount;
                }

                currentWord = word;
                currentWordCount = 1;
              }
            }

            if (currentWordCount > 1) {
              repeatedWords[currentWord] = currentWordCount;
            }

            const consecutiveWords = {};
            let consecutiveCount = 0;
            for (let word in repeatedWords) {
              if (repeatedWords[word] > 1) {
                consecutiveCount++;
              } else {
                consecutiveCount = 0;
              }

              if (consecutiveCount > 0) {
                consecutiveWords[word] = consecutiveCount;
              }
            }
            const numRepeatedWords = Object.keys(consecutiveWords).length;

          //Evaluating the grammer

            const apiKey = '2A4Q4BYFHY3VO0U8PTNYMV6NN57T4N2T';
            
            import('@saplingai/sapling-js/client').then((sapling) => {
              const client = new sapling.Client(apiKey);
              client.edits(transcription)
                .then(function (response) {
                  //console.log(response.data);
                  const errorCount = response.data.edits.length;
                  grammarcount = errorCount
                  console.log(`Number of  grammatical errors: ${errorCount}`);
                  if (fillerCounts < 2 && numRepeatedWords < 4 && grammarcount < 4) {
                    console.log("The Audio is fluent");
                  }
                  else {
                    console.log("The Audio is not fluent");
                  }
                  

           // To evaluate the text using keywords

            user_key = users[0].keywords;
            const keywords = [];

            const words = user_key.split(',');
            words.forEach(word => {
              keywords.push(word);
            });
            keyword_length = keywords.length;

            const regex = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'gi');
            const result = transcription.match(regex)

            let keyword_match = 0;
            if (result) {
              const uniqueMatches = [...new Set(result)]; // filter out duplicate matches
              keyword_match = uniqueMatches.length;
            }
            try {
              bonus = 100 / keyword_length;;
              mark = bonus * keyword_match;
              console.log("Keywords matched:", keyword_match);

            } catch (error) {
              console.log("No Matches");
            }

            let totalMarks =0;
            // console.log(grammarcount,mark)
            totalMarks = mark - (2*(grammarcount));
            console.log("Total marks...=",totalMarks);

            console.log("Updating the Malpractice_marks, Transcribed_text, and Total marks in the database...");
            User.update({
              malpractice_marks: malmarks,
              transcribed_text: transcription,
              marks: totalMarks
            }, {
              where: {
                user_id: 7
              }
            });
                })
                .catch(function (error) {
                  console.error(error);
                });
            });
            


          });

        }
      });
    });
  }
  catch (err) {
    console.error(err);
  }

}
fetchUserData(); 








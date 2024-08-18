import express from "express";
// import ffmpeg from "fluent-ffmpeg";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectiories, uploadProcessedVideo } from "./storage";
import { isVideoNew, setVideo } from "./firestore";

setupDirectiories();

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// console.log(ffmpegInstaller.path, ffmpegInstaller.version);

module.exports = ffmpeg;

const app = express();
app.use(express.json());

app.post("/process-video", async (req, res) => {
  // Get the bucket and filename from the Cloud Pub/Sub message
  let data;
  
  // Why try catch? Isnt throwing an error here uneccesary?
  // Because the .parse itself could throw an error
  try {
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
    data = JSON.parse(message); //what if invalid parse?

    if (!data.name) {
      throw new Error('Invalid message payload received.');
    }

  } catch (error) {
    console.error(error);
    return res.status(400).send('Bad Request: missing filename.');
  }

  const inputFileName = data.name; // <UID>-<Date>.<Extension>
  const outputFileName = `processed-${inputFileName}`;

  const videoId = inputFileName.split('.')[0];

  // Redundant processing check
  if (!isVideoNew(videoId)) {
    return res.status(400).send('Bad Request: video already processing or processed');

  } else {
   setVideo(videoId, {
    id: videoId,
    uid: inputFileName.split('-')[0],
    status: 'processing'
   });
  }

  // Download the raw video from Cloud storage
  await downloadRawVideo(inputFileName);

  //Convert video to 360p
  try {
    await convertVideo(inputFileName, outputFileName);

  } catch (err) {
    await Promise.all([deleteRawVideo(inputFileName), deleteProcessedVideo(outputFileName)]);
    // ^ slightly more parallelized
    // await deleteRawVideo(inputFileName);
    // await deleteProcessedVideo(outputFileName);

    console.error(err);
    return res.status(500).send('Internal Server Error: video processing failed.');
  }

  // Download the processed video to Cloud storage
  await uploadProcessedVideo(outputFileName);

  // Post-processing metadata update
  setVideo(videoId, {
    status: 'processed',
    filename: outputFileName
  })

  await Promise.all([deleteRawVideo(inputFileName), deleteProcessedVideo(outputFileName)]);

  return res.status(200).send('Processing finished successfully.')


  /* Previous alternative version */
  // const inputFilePath = req.body.inputFilePath;
  // const outputFilePath = req.body.outputFilePath;

  // if (!inputFilePath) {
  //   res.status(400).send("Bad Request: Missing input file path.")
  // }

  // if (!outputFilePath) {
  //   res.status(400).send("Bad Request: Missing output file path.")
  // }

  // ffmpeg(inputFilePath)
  //   .outputOption("-vf", "scale=-1:360")
  //   .on("end", () => {
  //     res.status(200).send("Video processing finished successfully.");
  //   })
  //   .on("error", (err: any) => {
  //     console.log(`An error occured: ${err.message}`);
  //     res.status(500).send(`Internal Server Error: ${err.message}`);
  //   })
  //   .save(outputFilePath);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Video processing service listening at http://localhost:${port}`);
});
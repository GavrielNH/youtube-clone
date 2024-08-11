import express from "express";
import ffmpeg from "fluent-ffmpeg";

const app = express();
app.use(express.json);


app.post("/process-video", (req, res) => {
  const inputFilePath = req.body.inputFilePath;
  const outputFilePath = req.body.outputFilePath;

  if (!inputFilePath) {
    res.status(200).send("Bad Request: Missing input file path.")
  }

  if (!outputFilePath) {
    res.status(200).send("Bad Request: Missing output file path.")
  }

  ffmpeg(inputFilePath)
    .outputOption("-vf", "scale=-1:360")
    .on("end", () => {
      res.status(200).send("Video processing finished successfully.");
    })
    .on("error", (err) => {
      console.log(`An error occured: ${err.message}`);
      res.status(500).send(`Internal Server Error: ${err.message}`);
    })
    .save(outputFilePath);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Video processing service listening at http://localhost:${port}`);
});
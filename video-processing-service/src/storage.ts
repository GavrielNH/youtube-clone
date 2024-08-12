// 1. GCS File interactions
// 2. Local File interactions

import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';


const storage = new Storage();

const rawVideoBucketName = "gnh-yt-raw-videos";
const processedVideoBucketName = "gnh-yt-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

/**
 * Creates the local directories for raw & processed videos
 */
export function setupDirectiories() {
  ensureDirectoryExistence(localRawVideoPath);
  ensureDirectoryExistence(localProcessedVideoPath);
}


/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}
 * @returns A promise that resolves when video has been converted
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
    .outputOption("-vf", "scale=-1:360")
    .on("end", () => {
      console.log("Processing finished successfully");
      resolve();
    })
    .on("error", (err: any) => {
      console.log(`An error occured: ${err.message}`);
      reject(err);
    })
    .save(`${localProcessedVideoPath}/${processedVideoName}`);
  }); 
}


/**
 * @param fileName - The name of file to download from the {@link rawVideoBucketName} bucket 
 *                   into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded.
 */
export async function downloadRawVideo(fileName: string) {
  await storage.bucket(rawVideoBucketName)
    .file(fileName)
    .download({destination: `${localRawVideoPath}/${fileName}`});

  console.log(`gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`);
}


/**
 * @param fileName - The name of file to upload from the {@link localProcessedVideoPath}
 *                   folder into the {@link processedVideoBucketName} bucket.
 * @returns A promise that resolves when the file has been downloaded.
 */
export async function uploadProcessedVideo(fileName: string) {
  const bucket = storage.bucket(processedVideoBucketName);

  await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {destination: fileName});

  console.log(`${localProcessedVideoPath}/${fileName} has been uploaded to gs://${processedVideoBucketName}/${fileName}`);

  // Private by default, so make it public
  await bucket.file(fileName).makePublic;
}


/**
 * @param filePath - The path of the file to delete.
 * @returns A promise that resolves when file has been deleted.
 */
function deleteFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(`Failed to delete file at ${filePath}`, err);
          reject(err);

        } else {
          console.log(`File deleted at ${filePath}.`)
          resolve();
        }
      })

    } else {
      console.log(`File not found at ${filePath}, skipping the delete.`);
      reject(); // reject with what?
    }

  })
}


/**
 * @param fileName - The name of file to delete from the {@link localRawVideoPath} folder.
 * @returns - A promise that resolves when the file has been deleted.
 */
export function deleteRawVideo(fileName: string) {
  return deleteFile(`${localRawVideoPath}/${fileName}`);
}


/**
 * @param fileName - The name of file to delete from the {@link localProcessedVideoPath} folder.
 * @returns - A promise that resolves when the file has been deleted.
 */
export function deleteProcessedVideo(fileName: string) {
  return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/**
 * Ensures a directory exists, creates it if necessary.
 * @param {string} dirPath - The directory path to check.
 */
function ensureDirectoryExistence(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {recursive: true});
    console.log(`Directory created at ${dirPath}`);
  }
}
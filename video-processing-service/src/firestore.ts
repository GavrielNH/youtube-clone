import { credential } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { Firestore } from "firebase-admin/firestore";

initializeApp({credential: credential.applicationDefault()});

const firestore = new Firestore();

// Code to test out Firestore operations locally
// Note: Requires setting an env variable in Cloud Run
/**
 * if (process.env.NODE_ENV !== 'production') {
 *  firestore.settings({
 *    host: "localhost:8080", // Default port for FS emulator
 *    ssl: false
 *  });
 * }
 */

const videoCollectionId = 'videos';

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: 'processing' | 'processed',
  title?: string,
  description?: string
}

/**
 * Gets a video based on the unique video identifier
 * @param videoId - Video identifier (key)
 */
async function getVideo(videoId:string) {
  const snapshot = await firestore.collection(videoCollectionId).doc(videoId).get();
  return (snapshot.data() as Video) ?? {}
}


/**
 * Sets a video object in Firestore
 * @param videoId - Video identifier (key)
 * @param video - video JSON object that contains metadata
 */
export function setVideo(videoId:string, video: Video) {
  firestore
    .collection(videoCollectionId)
    .doc(videoId)
    .set(video, { merge: true }) // avoids overwriting whole objects, just modified data
}


/**
 * @param videoId - Video identifier (key)
 */
export async function isVideoNew(videoId: string) {
  const video = await getVideo(videoId);
  return video?.status === undefined;
}
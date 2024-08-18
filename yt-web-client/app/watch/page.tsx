'use client';

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";


export default function Watch() {
  const videoPrefix = 'https://storage.cloud.google.com/gnh-yt-processed-videos/';
  
  return (
    <Suspense>
      <div>
        <h1>Watch Page!</h1>
        { 
          <video controls src={videoPrefix + useSearchParams().get('v')}/> 
        }
      </div>
    </Suspense>
  );
}
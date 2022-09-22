import "./App.css";
import { useState } from "react";

const { createFFmpeg, fetchFile } = window.FFmpeg;
const ffmpeg = createFFmpeg({
  log: true,
  mainName: "main",
  corePath: "https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js",
});

async function extractThumbnail(file, target = "target.png") {
  if (!ffmpeg.isLoaded()) await ffmpeg.load();
  const source = file.name;
  ffmpeg.FS("writeFile", source, await fetchFile(file));
  await ffmpeg.run("-i", source, "-vf", "thumbnail", "-frames:v", "1", target);
  const data = ffmpeg.FS("readFile", target);
  const image = URL.createObjectURL(
    new Blob([data.buffer], { type: "image/png" })
  );
  await ffmpeg.exit();
  return image;
}

async function compressVideo(file, target = "target.mp4") {
  if (!ffmpeg.isLoaded()) await ffmpeg.load();
  const source = file.name;
  ffmpeg.FS("writeFile", source, await fetchFile(file));
  await ffmpeg.run(
    "-i",
    source,
    "-vf",
    `scale='min(640,iw)':'min(-1,ih)',crop='iw-mod(iw,2)':'ih-mod(ih,2)'`,
    "-c:v",
    "libx264",
    // For more information about -tune and -preset, read here
    // https://trac.ffmpeg.org/wiki/Encode/H.264
    "-tune",
    "fastdecode", // allows faster decoding by disabling certain filters.
    "-preset",
    "ultrafast", // Using fast saves about 10% encoding time, faster 25%. ultrafast will save 55% at the expense of much lower quality.
    target
  );
  const data = ffmpeg.FS("readFile", target);
  const video = URL.createObjectURL(
    new Blob([data.buffer], {
      type: "video/mp4",
    })
  );
  await ffmpeg.exit();
  return video;
}

function App() {
  const [videoSrc, setVideoSrc] = useState();
  const [imageSrc, setImageSrc] = useState();

  async function handleChange(evt) {
    const files = evt.currentTarget.files;
    if (!files.length) return;

    const file = files[0];
    const t0 = performance.now();
    setImageSrc(await extractThumbnail(file));
    setVideoSrc(await compressVideo(file));
    const t1 = performance.now();
    window.alert(`took ${t1 - t0}ms`);
  }

  return (
    <div className="App">
      <input type="file" onChange={handleChange} />

      {imageSrc && <img alt="thumbnail" src={imageSrc} />}
      {videoSrc && (
        <video controls>
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

export default App;

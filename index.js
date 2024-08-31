import express from "express"
import cors from "cors"
import multer from "multer"
import {v4 as uuidv4} from "uuid"
import path from "path"
import fs from "fs"
import {exec} from "child_process"
import { error } from "console"
import { stderr, stdin, stdout } from "process"

const app=express()

app.use(
    cors({
        origin: ["http://localhost:3000","http://localhost:5173"],
        credentials:true
    })
)

app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*")
    res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept,Content-Type");
    next()
})

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use("/uploads",express.static("upload"))

//multer middleware
const storage=multer.diskStorage(
    {
        destination:function(req,file,cb){
            cb(null,"./upload")
        },
        filename:function(req,file,cb){
            cb(null,file.fieldname+"-"+uuidv4()+path.extname
        (file.originalname))
    }
}
)

const upload=multer({storage:storage});







app.get('/',function(req,res){
    res.json({message:"Hello Chai aur code"})
})
 app.post('/uploads',upload.single('file'),function(req,res){
    console.log("file uploaded");
    const lessonId=uuidv4()
    const videoPath=req.file.path;
    const outputPath=`./upload/courses/${lessonId}`;
    const hlsPath=`${outputPath}/index.m3u8`
    console.log("hisPath",hlsPath) 

    if(!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath,{recursive:true});
    }

    //ffmpeg

    //1. ffmpeg
// ffmpeg is the command-line tool you're invoking. It can handle a wide range of multimedia tasks, such as converting formats, compressing files, and streaming.
// 2. -i ${videoPath}
// -i specifies the input file. The ${videoPath} is the variable you defined earlier, which contains the path to the uploaded video file. This tells ffmpeg which video file it should process.
// 3. -codec:v libx264
// -codec:v specifies the video codec to use. A codec is a method for compressing and decompressing video files.
// libx264 is a very popular and efficient video codec that ffmpeg uses to encode the video into the H.264 format, which is widely used for streaming.
// 4. -codec:a aac
// -codec:a specifies the audio codec to use.
// aac is a common audio codec that's known for good quality at lower bitrates, making it suitable for streaming.
// 5. -hls_time 10
// -hls_time defines the length of each segment in seconds.
// 10 means that each video segment in the HLS stream will be approximately 10 seconds long.
// 6. -hls_playlist_type vod
// -hls_playlist_type vod tells ffmpeg to generate an HLS playlist for Video on Demand (VOD). This is different from live streaming and is used when the entire video is available from the start (like a typical video file).
// 7. -hls_segment_filename "${outputPath}/segment%03d.ts"
// -hls_segment_filename specifies the naming convention for the HLS segments (the small video files created from the original video).
// ${outputPath}/segment%03d.ts:
// ${outputPath} is the directory where the segments will be saved.
// segment%03d.ts:
// segment is the prefix for each file.
// %03d is a placeholder that will be replaced with the segment number, padded to three digits (e.g., 001, 002, etc.).
// .ts is the file extension for the segment files, which are in MPEG-2 Transport Stream format, commonly used in HLS.
// 8. -start_number 0
// -start_number sets the starting index for the segment filenames.
// 0 means that the first segment will be named segment000.ts, the next one segment001.ts, and so on.
// 9. ${hlsPath}
// Finally, ${hlsPath} specifies where the HLS playlist file (index.m3u8) will be saved. This file will reference all the segments created and allow a video player to stream the video.


    const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;
   
    exec(ffmpegCommand,(error,stderr,stdout)=>{
        if(error){
            console.log(`exec error:${error}`)

        }
        console.log(`stderror:${stderr}`)
        console.log(`stdout:${stdout}`)

        const videourl=`http://localhost:8000/upload/courses/${lessonId}/index.m3u8`;

        res.json({
            message:"File is uploaded Sucessfully",
            Videourl:videourl,
            videoid:lessonId
        })


    })




  
 })
app.listen(8000,function(){
    console.log("App is listening at port 8000")
})
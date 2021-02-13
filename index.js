'use strict';

const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const youtubedl = require("youtube-dl");
const PDFDocument = require("pdfkit");
const fetch = require("node-fetch");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var sesAccessKey = '***';
var sesSecretKey = '***';

let title1;
let title2;

const fetchImage = async (src) => {
  const response = await fetch(src);
  const image = await response.buffer();

  return image;
};
const createPDF = async (res1,res2) => {
  const logo1 = await fetchImage(
    res1
  );
  const logo2 = await fetchImage(
    res2
  );

  let pdfDoc = new PDFDocument();
  pdfDoc.pipe(fs.createWriteStream("./tmp/images.pdf"));

  pdfDoc.text("Latest news from NBC: "+title1);
  pdfDoc.image(logo1, {width: 350, height: 350});
pdfDoc.moveDown(0.5)

pdfDoc.text("Latest news from the CDC: "+title2);
  pdfDoc.image(logo2, {width: 350, height: 350});

  pdfDoc.end();

  var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
        user: sesAccessKey,
        pass: sesSecretKey
    }
  }));


  var mailOptions = {
    from: sesAccessKey,
	    to: '***',
        subject: 'images',
	    attachments: [{
            filename: 'images.pdf',
            path: './tmp/images.pdf'
        }]
  };
  console.log("sendemail");
  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      const response = {
        statusCode: 500,
        body: JSON.stringify({
          error: error.message,
        }),
      };
      console.log(response);
      return;
      //callback(null, response);
    }
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: `Email processed succesfully!`
      }),
    };
    console.log(response);
    //callback(null, response);
  });
};

const printYoutube = async () => {
  console.log("start print youtube");
  const form = new FormData();
  form.append("type", "upload");
  form.append("file_video", fs.createReadStream("./tmp/myvideo1.mp4"));
  form.append("key", "***");
  form.append("email", "***");
  form.append("target_type", 2);
  form.append("hologram_type", 0); //1

  const res = await axios({
    method: "post",
    url: "https://console.echoAR.xyz/upload",
    data: form,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${form._boundary}`,
    },
  });

    const form2 = new FormData();
  form2.append("type", "upload");
  form2.append("file_video", fs.createReadStream("./tmp/myvideo2.mp4"));
  form2.append("key", "***");
  form2.append("email", "***");
  form2.append("target_type", 2);
  form2.append("hologram_type", 0); //1

  const res2 = await axios({
    method: "post",
    url: "https://console.echoAR.xyz/upload",
    data: form2,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${form2._boundary}`,
    },
  });
  await createPDF("https://console.echoar.xyz/query?key= *** &file=" +
  res.data.additionalData.qrARjsMarkerStorageID,"https://console.echoar.xyz/query?key= *** &file=" +
  res2.data.additionalData.qrARjsMarkerStorageID);
};

const KEY = "***";

const getLinks = async () => {
  console.log("getLinks");
  const response1 = await axios.get(
    `https://www.googleapis.com/youtube/v3/search?key=${KEY}&channelId=UCeY0bbntWzzVIaj2z3QigXg&part=snippet,id&order=date&maxResults=1&type=video&videoDuration=short`
  );
  console.log(response1);
  const response2 = await axios.get(
    `https://www.googleapis.com/youtube/v3/search?key=${KEY}&channelId=UCiMg06DjcUk5FRiM3g5sqoQ&part=snippet,id&order=date&maxResults=1&type=video&videoDuration=short`
  );
  title1=response1.data.items[0].snippet.title;
  title2=response2.data.items[0].snippet.title;
  let vid1 = response1.data.items[0].snippet.thumbnails.default.url.split("/")[4];
  let vid2 = response2.data.items[0].snippet.thumbnails.default.url.split("/")[4];
  await downloadVideoAsync(vid1,'./tmp/myvideo1.mp4');
  await downloadVideoAsync(vid2,'./tmp/myvideo2.mp4');
  await printYoutube();
};

const downloadVideoAsync = (url,dir) => {

  return new Promise((resolve, reject) => {
    console.log("start video");
      const video = youtubedl(url,['--format=18'],{ cwd: __dirname }); 
      if(!video)
          return reject(new Error('Video is empty...'));

       video.on('error', reject);

       video.on('info', function(info) {
           console.log('Download started');
           console.log('filename: ' + info._filename);
           console.log('size: ' + info.size);
           const videoName = info.fulltitle.replace(/\s+/g, '-').toLowerCase();
           if(dir==='./tmp/myvideo1.mp4'){
            title1=videoName;
          } else {
            title2=videoName;
          }
           if(!videoName)
                return reject(new Error('Empty name'));

           video.pipe(fs.createWriteStream(dir));
           video.on('end', function() {
                console.log(`this is the videoName in async ${videoName}`);
                resolve(true);
           });


       });

  });
}

var awsIot = require('aws-iot-device-sdk');

var device = awsIot.device({
  keyPath: '***',
  certPath: '***',
  caPath: '***',
  host: '***',
  clientId: 'VirtualThing',
  region: 'us-east-1',
});

device
  .on('connect', function() {
    console.log('connect');
    device.subscribe('arduino/outgoing');
    //device.publish('topic_2', JSON.stringify({ test_data: 1}));
  });

device
  .on('message', function(topic, payload) {
    getLinks();
  });

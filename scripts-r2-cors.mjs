import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://448d4dd3038c49369350d4976b7a038d.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "f4d58ee762625e2a65ec43fbc156e0c7",
    secretAccessKey: "525cc00464530ea890d7c4b6f3af2fbe198b911ef64fc014254a742af03f0e47",
  },
});
await s3.send(new PutBucketCorsCommand({
  Bucket: "footballevents",
  CORSConfiguration: {
    CORSRules: [{
      AllowedOrigins: ["https://footballevents.eu","https://www.footballevents.eu","http://localhost:6969"],
      AllowedMethods: ["GET","PUT","POST","DELETE","HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    }],
  },
}));
console.log("CORS set OK");
const cur = await s3.send(new GetBucketCorsCommand({ Bucket: "footballevents" }));
console.log(JSON.stringify(cur.CORSRules, null, 2));

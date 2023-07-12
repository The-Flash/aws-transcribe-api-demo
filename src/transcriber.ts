import crypto from "crypto";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { TranscribeClient, StartTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type Readable } from "stream";

const transcribeClient = new TranscribeClient({});
const s3Client = new S3Client({});

async function transcribeAudio(filename: string) {
    const bucketName = "fl-demo-transcription-bucket";
    const jobName = crypto.randomUUID();

    const getobjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: filename,
    });

    const response = await s3Client.send(getobjectCommand);
    const responseBody = response.Body as Readable;
    //    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
    //        const chunks: Buffer[] = [];
    //        responseBody.on("data", (chunk: Buffer) => chunks.push(chunk));
    //        responseBody.on("end", () => resolve(Buffer.concat(chunks)));
    //        responseBody.on("error", (error: any) => reject(error));
    //    });
    //    console.log(audioBuffer);
    const startTranscriptionJobCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: "en-US",
        MediaFormat: "mp3",
        Media: {
            MediaFileUri: `https://fl-demo-transcription-bucket.s3.us-east-1.amazonaws.com/${filename}`,
        },
        OutputBucketName: "fl-demo-transcribed-audio",
        OutputKey: `${jobName}.json`,
    });
    await transcribeClient.send(startTranscriptionJobCommand);
    return jobName;
}

interface TranscribeRequestBody {
    filekey: string;
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const body: TranscribeRequestBody = JSON.parse(event.body as string);
    const filekey = body.filekey;
    const job = await transcribeAudio(filekey);
    //    console.log("filekey", filekey);
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            job,
        }),
    };
};

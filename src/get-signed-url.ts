import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3Client = new S3Client({});

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let fileID = crypto.randomUUID();

    const command = new PutObjectCommand({
        Bucket: "fl-demo-transcription-bucket",
        Key: fileID,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return {
        statusCode: 200,
        body: JSON.stringify({
            url,
        }),
    };
};

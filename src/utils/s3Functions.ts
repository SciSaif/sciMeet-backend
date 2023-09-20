import S3 from "aws-sdk/clients/s3.js";

const s3 = new S3({
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    signatureVersion: "v4",
});

const bucketName = "scimeet";

// function to upload files and images to R2 storage
// can store jpeg, png, pdf only
export async function putObject(
    fullPath: string,
    data: ArrayBuffer,
    bucket = bucketName
) {
    let contentType;
    if (fullPath.endsWith(".webm")) {
        contentType = "audio/webm";
    }

    console.log("size of file", data.byteLength);
    try {
        const response = await s3
            .putObject({
                Bucket: bucket,
                Key: fullPath,
                Body: data,
                ContentType: contentType,
                // ContentEncoding: "base64",
            })
            .promise();

        return response;
    } catch (error) {
        console.log(error);
        throw new Error("r2 error in putObject");
    }
}

// function to getSingedUrl for files and images from R2 storage

export async function getSignedUrl(
    fullPath: string,
    neverExpire = false,
    bucket = bucketName
): Promise<string> {
    try {
        const signedUrl = await s3.getSignedUrlPromise("getObject", {
            Bucket: bucket,
            Key: fullPath,
            // Expires: 60 * 60 * 24 * 7, // 7 days
            Expires: neverExpire ? 60 * 60 * 24 * 365 * 10 : 60 * 60 * 24 * 7,
        });

        return signedUrl;
    } catch (error) {
        console.log(error);
        throw new Error("r2 error in getSignedUrl");
    }
}

// function to delete files and images from R2 storage
export async function deleteObject(fullPath: string, bucket = bucketName) {
    try {
        const response = await s3
            .deleteObject({
                Bucket: bucket,
                Key: fullPath,
            })
            .promise();

        return response;
    } catch (error) {
        console.log(error);
        throw new Error("r2 error in deleteObject");
    }
}

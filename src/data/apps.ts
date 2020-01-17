import { S3 } from "aws-sdk";
import IApplication from "../model/application";

const configBucket = process.env.CONFIG_BUCKET!;
const appsObjectKey = process.env.APPS_OBJECT_KEY!;

const s3 = new S3();

export default async function getApps() {
  const obj = await s3
    .getObject({
      Bucket: configBucket,
      Key: appsObjectKey
    })
    .promise();
  const apps = JSON.parse(obj.Body?.toString("utf-8") ?? "{}") as {
    [appId: string]: IApplication;
  };
  return apps;
}

export async function getAppIds() {
  return getApps().then(apps => Object.keys(apps));
}

export async function getApp(applicationId: string) {
  return getApps().then(apps => apps[applicationId]);
}

import Application from "../model/Application";
import { S3 } from "aws-sdk";
import pMemoize from "p-memoize";

const configBucket = process.env.CONFIG_BUCKET!;
const appsObjectKey = process.env.APPS_OBJECT_KEY!;

const s3 = new S3();

async function getApps() {
  const obj = await s3
    .getObject({
      Bucket: configBucket,
      Key: appsObjectKey,
    })
    .promise();
  const apps = JSON.parse(obj.Body?.toString("utf-8") ?? "{}") as {
    [appId: string]: Application;
  };
  return apps;
}

const getAppsWithCache = pMemoize(getApps, {
  maxAge: 30 * 60 * 1000,
});

export async function getAppIds(): Promise<string[]> {
  return getAppsWithCache().then((apps) => Object.keys(apps));
}

export async function getApp(applicationId: string): Promise<Application> {
  return getAppsWithCache().then((apps) => apps[applicationId]);
}

export function clearAppsCache(): void {
  pMemoize.clear(getAppsWithCache);
}

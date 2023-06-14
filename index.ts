import axios from "axios";
import { urlencoded } from "body-parser";
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import { TokenResponse } from "./TokenResponse";

dotenv.config();

const app: Express = express();
const port = process.env.PORT ?? 3000;

const twitchOauthUrl = `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`;
const igdbBaseUrl = "https://api.igdb.com";

let tokenResponse: TokenResponse;
let tokenExpiryDateUnix = Date.now() / 1000;

app.all("*", urlencoded(), async (req: Request, res: Response) => {
  if (req.header("Authorization")?.split(' ')[1] !== process.env.APP_API_TOKEN && process.env.NODE_ENV !== "development"){
    return res.status(401).send("Unauthorized");
  }

  console.log(`[server] -------------------`);
  console.log(`[server] --- New Request ---`);
  console.log(`[server] URL`, req.url);
  console.log(`[server] Body`, req.body);
  console.log(`[server] Query`, req.query);
  console.log(`[server] Params`, req.params);
  console.log(`[server] Content-Type`, req.headers["content-type"]);
  console.log(`[server] Method`, req.method);


  if (Date.now() / 1000 > tokenExpiryDateUnix) {
    console.log(`[server] Token expired`);
    await refreshToken();
  }

  try {
    let str = ""
    let keys = Object.keys(req.body);
    let values = Object.values(req.body);
    for(let i = 0; i < keys.length; i++){
      str += keys[i] + "=" + values[i];
    }
    console.log("str", str)
    const response = await axios.request({
      url: igdbBaseUrl + req.url,
      method: req.method,
      headers: {
        "Content-Type": "text/plain",
        ...getHeaders()
      },
      data: str,
      responseType: req.url.endsWith(".pb") ? "arraybuffer" : undefined,
      transformResponse: (r) => r,
    });
    const rawBody = response.data;

    console.log("[server] Response: ", rawBody);
    res.contentType(req.url.endsWith(".pb") ? "application/protobuf" : "application/json");
    res.send(rawBody);
  } catch (err) {
    console.log("[server] Error: " + err);
    res.send(err);
  }
  console.log(`[server] -------------------`);
});

app.listen(port, async () => {
  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.APP_API_TOKEN) {
    console.log("[server] Missing environment variables");
    return;
  }

  console.log(`[server]: Server is running at http://localhost:${port}`);

  // await refreshToken()
});

async function refreshToken() {
  console.log("[Twitch] Refreshing token");
  let _tokenResponse = await refreshTokenResponse();
  if (!_tokenResponse) {
    console.log("[Twitch] Failed to get token response");
    return;
  }
  tokenResponse = _tokenResponse;
  tokenExpiryDateUnix = Date.now() / 1000 + tokenResponse.expires_in;
  console.log("[Twitch] Got token response");
  console.log("[server] App API Token: " + process.env.APP_API_TOKEN);
}

async function refreshTokenResponse(): Promise<TokenResponse | undefined> {
  const response = await fetch(twitchOauthUrl, {
    method: "POST",
  });
  if (!response.ok) {
    console.log(response.statusText);
    return;
  }
  const text = await response.text();
  return JSON.parse(text) as TokenResponse;
}

function getHeaders(): Record<string, string> {
  return {
    "Client-ID": process.env.CLIENT_ID!,
    Authorization: `Bearer ${tokenResponse.access_token}`,
  };
}

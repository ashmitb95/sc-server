import dotenv from "dotenv";

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import lyricsFinder from "lyrics-finder";
import SpotifyWebApi from "spotify-web-api-node";
import axios from "axios";
import fs from "fs";

// curlirize(axios);

// const curlirize = require("axios-curlirize");
// curlirize(axios);
dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// const authToken = `Bearer BQB0OH5Db0_IZ1wZiYi5axcN4oPHI_wGZKZP-NvG3_Y9_dW0A70O0d2NhMXCvycMKTztPP0US9JHbWITUAQrmGv_U3eLabBQvMKwoHVEIueFldewWvLnt8_LYvrTNxvN9ya-NTFqkulZcxweqtnet5l9LgliiaN5Y-qyshf3NEZXU_9PuXQ40oYi5ouhfJmvTapGyZTiIclvEYxuBg8tR-J4oLGc1x4U3gPBBrN-SOD0sdvAQl7v5W38qvB1j4wkPbNm94ZJoVnx6ScslkpRR7tb`;

const API_PATHS = {
  getTopItems: (type = "tracks") => `v1/me/top/${type}`,
  getRecommendedTracks: "v1/recommendations",
};

const API_INSTANCE = axios.create({
  baseURL: "https://api.spotify.com/",
});

app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      res.json({
        accessToken: data.body.accessToken,
        expiresIn: data.body.expiresIn,
      });
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

app.post("/login", (req, res) => {
  const code = req.body.code;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      console.log("New access token: ", data.body.access_token);
      // // write access token to a json file
      // fs.writeFile("access_token2.json", JSON.stringify(data.body), (err) => {
      //   if (err) throw err;
      //   console.log("The file was saved!");
      // });

      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch((err) => {
      res.sendStatus(400);
    });
});

async function getTopItems(_token, itemType) {
  // const token =
  // "BQAku8wZ_hF2qPxAmL2yN0_HxC_uO8QkvXPDls04jpORXEHy1429tRkko73kWq89ZInlXcy3L8lImUhJweqxpSERHMkeZaTMnfWPoMLkxPaS3DHA0HosrRuawWLwwaw50Of_rifEUG49QRGwXkIZIh9K2JAgyMSVG-Klg38Mfx1YBfzz8jrXVZ_yenlDfOl695hWxvKgXI9N0u8Q49xRdHLYbxN3ixE4XnAnPxwRjTfSmFEAsxN7";
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return API_INSTANCE.get(API_PATHS.getTopItems(itemType), {
    headers: {
      Authorization: `Bearer ${_token}`,
    },
    params: {
      limit: 5,
      time_range: "short_term",
    },
  });
}

async function getRecommendedTracks(token, trackIDs) {
  console.log("Fectching Tracks: ", trackIDs);
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return API_INSTANCE.get(API_PATHS.getRecommendedTracks, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: { seed_tracks: trackIDs.join(","), limit: 50 },
  });
}

app.post("/recommend", (req, res) => {
  try {
    console.log("Fetching recommendations");
    const trackIDs = req.body.trackIDs;
    const tracks = trackIDs?.split(",");
    const accessToken = req.query.accessToken;
    console.log("Access token for recommend: " + accessToken);
    // console.log("Tracks: ", trackIDs);
    getRecommendedTracks(accessToken, tracks).then((response) => {
      // console.log("received data", data);
      // console.log(response.data);
      // return { data: data };
      res.json(response.data);
    });
  } catch (e) {
    // console.log("Error: " + e);
    res.send({ data: null });
  }
});

app.get("/recent/:itemType", (req, res) => {
  try {
    const itemType = ["tracks", "artists"]?.includes(req.query.itemType)
      ? req.query.itemType
      : "tracks";
    const accessToken = req.query.accessToken;
    getTopItems(accessToken, itemType)
      .then((response) => {
        // console.log("received data", data);
        // console.log(response.data);
        // return { data: data };
        console.log("Here");
        console.log("Sending back response data for recent tracks");
        res.json(response.data.items);
      })
      .catch((e) => {
        console.log("Error fetching top tracks: " + e);
      });
  } catch (e) {
    console.log("Error fetching Top Tracks: ");
    res.json({ data: null });
  }
});

// console.log(
//   topTracks?.map(
//     ({ name, artists }) =>
//       `${name} by ${artists.map((artist) => artist.name).join(", ")}`
//   )
// );

app.get("/lyrics", async (req, res) => {
  const lyrics =
    (await lyricsFinder(req.query.artist, req.query.track)) ||
    "No Lyrics Found";
  res.json({ lyrics });
});

console.log(
  "--------------------------------Starting server--------------------------------"
);
app.listen(3001);

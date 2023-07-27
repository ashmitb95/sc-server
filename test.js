// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
const token =
  "BQDBN2qGU0o8pwZ9syFWqQqSIXXPjOJkpbrutIPnuVK_ndQ0XX66f1ygEsj3jMkAos2hu-zp0t6JlXXOr30m_UZzcRQ8cmr27d2sXwCx9buVLaC_UKbQb8vmmaM4cr7IIMccGMb60scGFqo3eZYed2UC3IwcSOxUjsjxl90veP29VO8jjeMsimJib0zdWWm5VJ0JFqCOsQQzRRwXQBbl-b84R2Sbox0hDXemlF17FDd_njqpulDQ5aAibgIYdkpNZCtxH5DlBXelUF7xiYyNLw43";
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function getTopTracks() {
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (
    await fetchWebApi("v1/me/top/tracks?time_range=short_term&limit=5", "GET")
  ).items;
}

const topTracks = await getTopTracks();
console.log(
  topTracks?.map(
    ({ name, artists }) =>
      `${name} by ${artists.map((artist) => artist.name).join(", ")}`
  )
);

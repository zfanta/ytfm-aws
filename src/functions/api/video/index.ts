const videoHttpGet = {
  handler: 'src/functions/api/video/http.get',
  events: [{
    http: {
      cors: true,
      method: 'get',
      path: 'api/video/{videoId}'
    }
  }]
}

export default { videoHttpGet }

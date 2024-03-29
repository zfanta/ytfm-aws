import React from 'react'
import ReactDOM from 'react-dom'
import EmailTemplate from './EmailTemplate'

const props = {
  videoLink: 'https://dev.ytfm.app/watch/jNQXAC9IVRw',
  videoTitle: 'Me at the zoo',
  channelId: 'UC4QobU6STFB0P71PMvOGN5A',
  channelTitle: 'jawed',
  channelThumbnail: 'https://yt3.ggpht.com/ytc/AAUvwni3r7liUF18s1wqRK_rrHKzb508s9mQWxI-3g=s88-c-k-c0x00ffffff-no-rj',
  thumbnail: {
    width: 480,
    height: 360,
    url: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg'
  },
  duration: '0:19',
  description: 'The first video on YouTube. While you wait for Part 2, listen to this great song: https://www.youtube.com/watch?v=zj82_v2R6ts',
  unsubscribeLink: 'https://dev.ytfm.app/subscriptions/UC4QobU6STFB0P71PMvOGN5A?token=ujmSrXpT16UUom2ppOthDeoZ9ycV-8erawR_5a3W_9P5V7MYPdlFnH7ItwQNEbVg6Qu-LQUlSfm480GBA5tkCy3dpmZ1_th0sYjE0XI2iR9NYNq-iZZS81h2uwXjfnSQ_ECxu1s1BDLzKkmwWywpJSW7OP4&action=unsubscribe',
  debug: "{\"video\":{\"kind\":\"youtube#video\",\"etag\":\"H-G1b7QGQLjZUtN15YrWG6aUGDE\",\"id\":\"jNQXAC9IVRw\",\"snippet\":{\"publishedAt\":\"2005-04-24T03:31:52Z\",\"channelId\":\"UC4QobU6STFB0P71PMvOGN5A\",\"title\":\"Me at the zoo\",\"description\":\"The first video on YouTube. While you wait for Part 2, listen to this great song: https://www.youtube.com/watch?v=zj82_v2R6ts\",\"thumbnails\":{\"default\":{\"url\":\"https://i.ytimg.com/vi/jNQXAC9IVRw/default.jpg\",\"width\":120,\"height\":90},\"medium\":{\"url\":\"https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg\",\"width\":320,\"height\":180},\"high\":{\"url\":\"https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg\",\"width\":480,\"height\":360}},\"channelTitle\":\"jawed\",\"tags\":[\"me at the zoo\",\"jawed karim\",\"first youtube video\"],\"categoryId\":\"1\",\"liveBroadcastContent\":\"none\",\"defaultLanguage\":\"en\",\"localized\":{\"title\":\"Me at the zoo\",\"description\":\"The first video on YouTube. While you wait for Part 2, listen to this great song: https://www.youtube.com/watch?v=zj82_v2R6ts\"},\"defaultAudioLanguage\":\"en\"},\"contentDetails\":{\"duration\":\"PT19S\",\"dimension\":\"2d\",\"definition\":\"sd\",\"caption\":\"true\",\"licensedContent\":true,\"contentRating\":{},\"projection\":\"rectangular\"},\"status\":{\"uploadStatus\":\"processed\",\"privacyStatus\":\"public\",\"license\":\"creativeCommon\",\"embeddable\":true,\"publicStatsViewable\":false,\"madeForKids\":false},\"player\":{\"embedHtml\":\"<iframe width=\\\"480\\\" height=\\\"360\\\" src=\\\"//www.youtube.com/embed/jNQXAC9IVRw\\\" frameborder=\\\"0\\\" allow=\\\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\\\" allowfullscreen></iframe>\"}},\"xml\":\"<?xml version='1.0' encoding='UTF-8'?>\\n<feed xmlns:yt=\\\"http://www.youtube.com/xml/schemas/2015\\\" xmlns=\\\"http://www.w3.org/2005/Atom\\\">\\n  <link rel=\\\"hub\\\" href=\\\"https://pubsubhubbub.appspot.com\\\"/>\\n  <link rel=\\\"self\\\" href=\\\"https://www.youtube.com/xml/feeds/videos.xml?channel_id=UCV0_nChmSVzdv4W1HDVvw1Q\\\"/>\\n  <title>YouTube video feed</title>\\n  <updated>2021-04-24T14:32:03.748484548+00:00</updated>\\n  <entry>\\n    <id>yt:video:jNQXAC9IVRw</id>\\n    <yt:videoId>jNQXAC9IVRw</yt:videoId>\\n    <yt:channelId>UC4QobU6STFB0P71PMvOGN5A</yt:channelId>\\n    <title>[𝐿𝐼𝒱𝐸] 24/7 입구에서 '서시비' - 90-2000s K-City Pop, Dance Music</title>\\n    <link rel=\\\"alternate\\\" href=\\\"https://www.youtube.com/watch?v=kERzAFPGeZ4\\\"/>\\n    <author>\\n      <name>Seoul City BEAT</name>\\n      <uri>https://www.youtube.com/channel/UCV0_nChmSVzdv4W1HDVvw1Q</uri>\\n    </author>\\n    <published>2021-04-24T14:30:37+00:00</published>\\n    <updated>2021-04-24T14:32:03.748484548+00:00</updated>\\n  </entry>\\n</feed>\\n\"}"
}

ReactDOM.render(<EmailTemplate {...props}/>, document.getElementById('template'))

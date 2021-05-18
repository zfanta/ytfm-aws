interface VideoFromPubsubhubbub {
  id: string
  title: string
  channelId: string
  channelName: string
  published: string
  updated: string
}

interface VideoResponse {
  'kind': string
  'etag': string
  'items': VideoFromGoogleApis[]
  'pageInfo': {
    'totalResults': number
    'resultsPerPage': number
  }
}

interface VideoFromGoogleApis {
  'kind': string
  'etag': string
  'id': string
  'snippet': {
    'publishedAt': string
    'channelId': string
    'title': string
    'description': string
    'thumbnails': {
      [key: string]: {
        'url': string
        'width': number
        'height': number
      }
    }
    'channelTitle': string
    'tags': string[]
    'categoryId': string
    'liveBroadcastContent': 'live' | 'none' | 'upcoming'
    'defaultLanguage': string
    'localized': {
      'title': string
      'description': string
    }
    'defaultAudioLanguage': string
  }
  'contentDetails': {
    'duration': string // https://en.wikipedia.org/wiki/ISO_8601#Durations
    'dimension': string
    'definition': string
    'caption': string
    'licensedContent': boolean
    'contentRating': {}
    'projection': string
    'regionRestriction'?: {
      'blocked'?: string[]
      'allowed'?: string[]
    }
  }
  'status': {
    'uploadStatus': string
    'privacyStatus': string
    'license': string
    'embeddable': boolean
    'publicStatsViewable': boolean
    'madeForKids': boolean
  }
  'player': {
    'embedHtml': string
  }
  'liveStreamingDetails'?: {
    'actualStartTime': string
    'actualEndTime': string
    'scheduledStartTime': string
    'scheduledEndTime': string
    'concurrentViewers': number
    'activeLiveChatId': string
  }
}

interface Token {
  'access_token': string
  'token_type': 'Bearer'
  'expires_in': number
  'refresh_token'?: string
  'scope': string
  'error'?: string
  'error_description'?: string
}

export type {
  VideoFromPubsubhubbub,
  VideoResponse,
  VideoFromGoogleApis,
  Token
}

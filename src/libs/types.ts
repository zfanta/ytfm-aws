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
    'contentRating': {
      'acbRating'?: string
      'agcomRating'?: string
      'anatelRating'?: string
      'bbfcRating'?: string
      'bfvcRating'?: string
      'bmukkRating'?: string
      'catvRating'?: string
      'catvfrRating'?: string
      'cbfcRating'?: string
      'cccRating'?: string
      'cceRating'?: string
      'chfilmRating'?: string
      'chvrsRating'?: string
      'cicfRating'?: string
      'cnaRating'?: string
      'cncRating'?: string
      'csaRating'?: string
      'cscfRating'?: string
      'czfilmRating'?: string
      'djctqRating'?: string
      'djctqRatingReasons'?: string[]
      'ecbmctRating'?: string
      'eefilmRating'?: string
      'egfilmRating'?: string
      'eirinRating'?: string
      'fcbmRating'?: string
      'fcoRating'?: string
      'fmocRating'?: string
      'fpbRating'?: string
      'fpbRatingReasons'?: string[]
      'fskRating'?: string
      'grfilmRating'?: string
      'icaaRating'?: string
      'ifcoRating'?: string
      'ilfilmRating'?: string
      'incaaRating'?: string
      'kfcbRating'?: string
      'kijkwijzerRating'?: string
      'kmrbRating'?: string
      'lsfRating'?: string
      'mccaaRating'?: string
      'mccypRating'?: string
      'mcstRating'?: string
      'mdaRating'?: string
      'medietilsynetRating'?: string
      'mekuRating'?: string
      'mibacRating'?: string
      'mocRating'?: string
      'moctwRating'?: string
      'mpaaRating'?: string
      'mpaatRating'?: string
      'mtrcbRating'?: string
      'nbcRating'?: string
      'nbcplRating'?: string
      'nfrcRating'?: string
      'nfvcbRating'?: string
      'nkclvRating'?: string
      'oflcRating'?: string
      'pefilmRating'?: string
      'rcnofRating'?: string
      'resorteviolenciaRating'?: string
      'rtcRating'?: string
      'rteRating'?: string
      'russiaRating'?: string
      'skfilmRating'?: string
      'smaisRating'?: string
      'smsaRating'?: string
      'tvpgRating'?: string
      'ytRating'?: string
    }
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

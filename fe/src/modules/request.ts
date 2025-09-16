import { ApiResponse } from '../interfaces'

class TiichermateRequest extends Request {
  constructor (baseUrl: string, apiKey: string, token: string) {
    super(baseUrl, {
      headers: {
        'x-api-key': apiKey,
        authorization: `Bearer ${token}`,
      },
    })
  }
}

export class TiichermateApi {
  static API_KEY = ''
  static TOKEN = ''

  static setApiKey (apiKey: string) {
    this.API_KEY = apiKey
  }

  static setToken (token: string) {
    this.TOKEN = token
  }

  static fetch<T> (baseUrl: string) {
    const request = new TiichermateRequest(baseUrl, TiichermateApi.API_KEY, TiichermateApi.TOKEN)
    const response = fetch(request)
    return {
      unwrap: async () => {
        const data = await response.then(r => r.json()) as ApiResponse<T>
        return [
          data.result,
          data.code,
          data.msg,
        ]
      },
    }
  }
}

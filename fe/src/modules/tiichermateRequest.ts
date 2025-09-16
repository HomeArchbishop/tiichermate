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

  private static buildUnwrap<T> (dataPromise: Promise<ApiResponse<T>>) {
    return async () => {
      const data: ApiResponse<T> = await dataPromise
      if (data.code === 0) {
        return [data.result, undefined] as const
      }
      return [undefined, data] as const
    }
  }

  static fetch<T> (baseUrl: string) {
    const request = new TiichermateRequest(baseUrl, TiichermateApi.API_KEY, TiichermateApi.TOKEN)
    const dataPromise = fetch(request).then<ApiResponse<T>>(r => r.json())
    return {
      unwrap: this.buildUnwrap(dataPromise),
    }
  }
}

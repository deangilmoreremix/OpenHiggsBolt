import { Handler } from '@netlify/functions'
import axios from 'axios'

const MUAPI_API_KEY = process.env.MUAPI_API_KEY

export const handler: Handler = async (event, context) => {
  const { httpMethod, path, queryStringParameters, body } = event

  if (!MUAPI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'MuAPI key not configured' }) }
  }

  const muapi = axios.create({
    baseURL: 'https://api.muapi.ai/v1',
    headers: { Authorization: `Bearer ${MUAPI_API_KEY}` }
  })

  try {
    if (httpMethod === 'POST' && path === '/muapi/video') {
      const params = JSON.parse(body || '{}')
      const response = await muapi.post('/video/generate', params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'GET' && path.startsWith('/muapi/models/')) {
      const category = path.split('/').pop()
      const response = await muapi.get(`/models?category=${category}`)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) }
  } catch (error: any) {
    return { statusCode: error.response?.status || 500, body: JSON.stringify({ error: error.message }) }
  }
}
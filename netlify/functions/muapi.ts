import { Handler } from '@netlify/functions'
import axios from 'axios'

const MUAPI_API_KEY = process.env.MUAPI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export const handler: Handler = async (event, context) => {
  const { httpMethod, path, queryStringParameters, body } = event

  const muapi = axios.create({
    baseURL: 'https://api.muapi.ai/v1',
    headers: { Authorization: `Bearer ${MUAPI_API_KEY}` }
  })

  try {
    if (!MUAPI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'MuAPI key not configured' }) }
    }

    if (httpMethod === 'POST' && path === '/muapi/video') {
      const params = JSON.parse(body || '{}')
      const response = await muapi.post('/video/generate', params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path === '/muapi/image') {
      const params = JSON.parse(body || '{}')
      const response = await muapi.post('/image/generate', params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path === '/muapi/audio') {
      const params = JSON.parse(body || '{}')
      const response = await muapi.post('/audio/generate', params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path === '/muapi/text') {
      const params = JSON.parse(body || '{}')
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: params.model || 'gpt-4',
          messages: [
            ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
            { role: 'user', content: params.prompt }
          ],
          max_tokens: params.maxTokens || 1000,
          temperature: params.temperature || 0.7
        },
        { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
      )
      return {
        statusCode: 200,
        body: JSON.stringify({
          id: response.data.id,
          text: response.data.choices[0].message.content,
          model: response.data.model,
          createdAt: new Date().toISOString()
        })
      }
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
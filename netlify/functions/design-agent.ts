import { Handler } from '@netlify/functions'
import axios from 'axios'

const MUAPI_API_KEY = process.env.MUAPI_API_KEY

const muapi = axios.create({
  baseURL: 'https://api.muapi.ai/v1/creative-agent',
  headers: { Authorization: `Bearer ${MUAPI_API_KEY}` }
})

export const handler: Handler = async (event, context) => {
  if (!MUAPI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'MuAPI key not configured' }) }
  }

  const { httpMethod, path, queryStringParameters, body } = event

  try {
    if (httpMethod === 'GET' && path === '/sessions') {
      const response = await muapi.get('/sessions')
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path === '/sessions') {
      const params = JSON.parse(body || '{}')
      const response = await muapi.post('/sessions', params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'GET' && path?.match(/^\/sessions\/[^/]+$/)) {
      const sessionId = path.split('/')[2]
      const response = await muapi.get(`/sessions/${sessionId}`)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'PATCH' && path?.match(/^\/sessions\/[^/]+$/)) {
      const sessionId = path.split('/')[2]
      const params = JSON.parse(body || '{}')
      const response = await muapi.patch(`/sessions/${sessionId}`, params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'DELETE' && path?.match(/^\/sessions\/[^/]+$/)) {
      const sessionId = path.split('/')[2]
      await muapi.delete(`/sessions/${sessionId}`)
      return { statusCode: 204, body: '' }
    }

    if (httpMethod === 'GET' && path?.match(/^\/sessions\/[^/]+\/assets$/)) {
      const sessionId = path.split('/')[2]
      const response = await muapi.get(`/sessions/${sessionId}/assets`)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path?.match(/^\/sessions\/[^/]+\/assets$/)) {
      const sessionId = path.split('/')[2]
      const params = JSON.parse(body || '{}')
      const response = await muapi.post(`/sessions/${sessionId}/assets`, params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path?.match(/^\/sessions\/[^/]+\/chat$/)) {
      const sessionId = path.split('/')[2]
      const params = JSON.parse(body || '{}')
      const response = await muapi.post(`/sessions/${sessionId}/chat`, params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'GET' && path?.match(/^\/sessions\/[^/]+\/messages$/)) {
      const sessionId = path.split('/')[2]
      const response = await muapi.get(`/sessions/${sessionId}/messages`)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'PATCH' && path?.match(/^\/sessions\/[^/]+\/messages$/)) {
      const sessionId = path.split('/')[2]
      const params = JSON.parse(body || '{}')
      const response = await muapi.patch(`/sessions/${sessionId}/messages`, params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path?.match(/^\/sessions\/[^/]+\/run-skill$/)) {
      const sessionId = path.split('/')[2]
      const params = JSON.parse(body || '{}')
      const response = await muapi.post(`/sessions/${sessionId}/run-skill`, params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'GET' && path === '/agent-skills') {
      const response = await muapi.get('/agent-skills')
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'GET' && path?.match(/^\/jobs\/[^/]+\/events$/)) {
      const jobId = path.split('/')[2]
      const response = await muapi.get(`/jobs/${jobId}/events`, {
        params: queryStringParameters
      })
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'GET' && path?.match(/^\/sessions\/[^/]+\/jobs$/)) {
      const sessionId = path.split('/')[2]
      const response = await muapi.get(`/sessions/${sessionId}/jobs`)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path?.match(/^\/jobs\/[^/]+\/approve$/)) {
      const jobId = path.split('/')[2]
      const response = await muapi.post(`/jobs/${jobId}/approve`)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path?.match(/^\/jobs\/[^/]+\/reject$/)) {
      const jobId = path.split('/')[2]
      const params = JSON.parse(body || '{}')
      const response = await muapi.post(`/jobs/${jobId}/reject`, params)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'POST' && path?.match(/^\/jobs\/[^/]+\/cancel$/)) {
      const jobId = path.split('/')[2]
      const response = await muapi.post(`/jobs/${jobId}/cancel`)
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    if (httpMethod === 'GET' && path?.match(/^\/get-file-upload-url$/)) {
      const response = await muapi.get('/api/app/get_file_upload_url', {
        params: { filename: queryStringParameters?.filename }
      })
      return { statusCode: 200, body: JSON.stringify(response.data) }
    }

    return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) }
  } catch (error: any) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    }
  }
}
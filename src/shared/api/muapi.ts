import axios from 'axios'
import { VideoGenerationParams, VideoResult, ImageGenerationParams, ImageResult, AudioGenerationParams, AudioResult, TextGenerationParams, TextResult } from '@/types/api'

const MUAPI_BASE_URL = '/.netlify/functions/muapi'

export async function generateVideo(params: VideoGenerationParams): Promise<VideoResult> {
  const response = await axios.post(`${MUAPI_BASE_URL}/video`, params)
  return response.data
}

export async function generateImage(params: ImageGenerationParams): Promise<ImageResult> {
  const response = await axios.post(`${MUAPI_BASE_URL}/image`, params)
  return response.data
}

export async function generateAudio(params: AudioGenerationParams): Promise<AudioResult> {
  const response = await axios.post(`${MUAPI_BASE_URL}/audio`, params)
  return response.data
}

export async function generateText(params: TextGenerationParams): Promise<TextResult> {
  const response = await axios.post(`${MUAPI_BASE_URL}/text`, params)
  return response.data
}

export async function getVideoStatus(id: string): Promise<{ status: 'pending' | 'completed' | 'failed'; result?: VideoResult }> {
  const response = await axios.get(`${MUAPI_BASE_URL}/video/${id}`)
  return response.data
}

export async function getModels(category: 'video' | 'image' | 'audio'): Promise<string[]> {
  const response = await axios.get(`${MUAPI_BASE_URL}/models/${category}`)
  return response.data
}
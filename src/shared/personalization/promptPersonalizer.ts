/**
 * Prompt Personalizer
 *
 * Rewrites the original prompt to include client-specific details while
 * preserving the creative concept, camera movement, lighting, pacing, etc.
 *
 * Uses the existing callOpenAIChat infrastructure from the AiAssistant.
 */

import { callOpenAIChat } from '@/shared/api/openai'
import type { ClientProfile, AssetLibrary } from './types'

export interface PersonalizePromptInput {
  originalPrompt: string
  client: ClientProfile
  assets: AssetLibrary
  outputType: string
}

export async function personalizePrompt({
  originalPrompt,
  client,
  assets,
  outputType,
}: PersonalizePromptInput): Promise<string> {
  const identity = assets.primaryIdentity?.name || assets.identities[0]?.name || ''
  const logo = assets.primaryLogo?.name || ''
  const products = assets.products.map((p) => p.name).join(', ')
  const brandRefs = assets.brandReferences.map((b) => b.name).join(', ')

  const systemPrompt = `You are a professional video/image prompt personalization engine for SmartVideo.
Your job is to PERSONALIZE an existing creative prompt for a specific client while preserving EVERY creative detail.

RULES:
1. PRESERVE: creative concept, camera movement, shot composition, lighting, pacing, visual style, scene structure, technical model instructions, aspect-ratio guidance, important motion instructions.
2. ONLY REPLACE generic/placeholder details with the client's actual information.
3. Do NOT invent missing facts. If a field is empty, skip it or keep the original generic reference.
4. Return ONLY the complete personalized prompt — no commentary, no quotes, no markdown.
5. The output must be a fully-formed generation prompt ready to send to an AI model.`

  const userPrompt = `ORIGINAL PROMPT:
${originalPrompt}

CLIENT INFORMATION:
${client.businessName ? `Business: ${client.businessName}` : ''}
${client.industry ? `Industry: ${client.industry}` : ''}
${client.location ? `Location: ${client.location}` : ''}
${client.productService ? `Product/Service: ${client.productService}` : ''}
${client.offer ? `Offer: ${client.offer}` : ''}
${client.ctaHeadline ? `CTA Headline: ${client.ctaHeadline}` : ''}
${client.callToAction ? `Button / Action: ${client.callToAction}` : ''}
${client.phone ? `Phone: ${client.phone}` : ''}
${client.website ? `Website: ${client.website}` : ''}
${client.brandDescription ? `Brand Description: ${client.brandDescription}` : ''}
${client.name ? `Contact Name: ${client.name}` : ''}

ASSETS AVAILABLE:
${identity ? `Presenter Identity: ${identity}` : ''}
${logo ? `Logo: ${logo}` : ''}
${products ? `Products/Services: ${products}` : ''}
${brandRefs ? `Brand References: ${brandRefs}` : ''}

OUTPUT TYPE: ${outputType}

PERSONALIZE THE PROMPT:
Replace generic references with the client's actual details. Keep the entire creative structure intact. Return ONLY the personalized prompt.`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ]

  try {
    const result = await callOpenAIChat(messages)
    return result.trim()
  } catch (error) {
    console.error('Prompt personalization failed:', error)
    let personalized = originalPrompt
    if (client.businessName) personalized = personalized.replace(/\{business_name\}/gi, client.businessName)
    if (client.productService) personalized = personalized.replace(/\{product\}/gi, client.productService)
    if (client.location) personalized = personalized.replace(/\{location\}/gi, client.location)
    if (client.offer) personalized = personalized.replace(/\{offer\}/gi, client.offer)
    if (client.ctaHeadline) personalized = personalized.replace(/\{cta_headline\}/gi, client.ctaHeadline)
    if (client.callToAction) personalized = personalized.replace(/\{cta_button\}/gi, client.callToAction)
    if (client.website) personalized = personalized.replace(/\{website\}/gi, client.website)
    if (client.phone) personalized = personalized.replace(/\{phone\}/gi, client.phone)
    return personalized
  }
}

export async function regeneratePrompt(
  originalPrompt: string,
  client: ClientProfile,
  assets: AssetLibrary,
  outputType: string,
): Promise<string> {
  return personalizePrompt({ originalPrompt, client, assets, outputType })
}

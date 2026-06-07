import { LayoutTemplate, ArrowLeft, Image as ImageIcon } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
}

const templates: Template[] = [
  { id: '3d-logo-animation', name: '3D Logo Animation', description: 'Transform a 2D logo into a premium 3D version and animate it with professional cinematic effects.', category: 'Motion' },
  { id: 'action-figure-generator', name: 'Action Figure Generator', description: 'Convert a photo of a person into a custom 3D action figure, complete with collectible toy packaging.', category: 'Generative' },
  { id: 'ad-creative', name: 'Ad Creative', description: 'Generate a high-converting ad creative set — hero image, ad copy variations, and platform-optimized crops.', category: 'Marketing' },
  { id: 'amazon-product-listing', name: 'Amazon Product Listing', description: 'Generate a complete Amazon product listing image set — hero image, lifestyle shot, infographic.', category: 'E-commerce' },
  { id: 'animal-video-generator', name: 'Animal Video Generator', description: 'Create a hilarious and ultra-realistic video of an anthropomorphic animal acting like a human vlogger.', category: 'Motion' },
  { id: 'blog-header', name: 'Blog Header', description: 'Create a professional, eye-catching blog post header image sized for web (1200×628).', category: 'Content' },
  { id: 'brand-kit', name: 'Brand Kit', description: 'Generate a cohesive brand visual kit — logo concept, color palette moodboard, typography pairing.', category: 'Branding' },
  { id: 'brochures', name: 'Brochures', description: 'Generate a professional multi-page brochure design — cover, inner spread, back cover.', category: 'Print' },
  { id: 'cartoon-dance-animation', name: 'Cartoon Dance Animation', description: 'Convert a photo into a Pixar-style 3D cartoon character, then animate it dancing.', category: 'Motion' },
  { id: 'character-story-video', name: 'Character Story Video', description: 'Create a multi-part animated story video by first establishing a consistent character.', category: 'Motion' },
  { id: 'couple-grid-creator', name: 'Couple Grid Creator', description: 'Create a stylized 6-box grid featuring a couple in various romantic poses and outfits.', category: 'Social' },
  { id: 'design-guide', name: 'Design Guide', description: 'Create a comprehensive brand design guide — color palette, typography, UI components.', category: 'Branding' },
  { id: 'drone-style-video', name: 'Drone Style Video', description: 'Generate aerial drone-perspective footage — sweeping bird\'s-eye views, orbit shots.', category: 'Motion' },
  { id: 'fashion-try-on', name: 'Fashion Try On', description: 'Virtually try on different outfits by combining a person\'s photo and a clothing item.', category: 'E-commerce' },
  { id: 'floor-plan-rendering', name: 'Floor Plan Rendering', description: 'Design a 2D floor plan and convert it into a realistic, high-quality 3D architectural rendering.', category: 'Architecture' },
  { id: 'giant-product-showcase', name: 'Giant Product Showcase', description: 'Create a dramatic "Giant Product" visual with a person next to a building-sized item.', category: 'Marketing' },
  { id: 'instagram-post', name: 'Instagram Post', description: 'Create a polished, on-brand Instagram post — square or portrait hero image.', category: 'Social' },
  { id: 'interior-design-visualizer', name: 'Interior Design Visualizer', description: 'Visualize interior design — empty room filled with stylish furniture, or redesign existing room.', category: 'Architecture' },
  { id: 'jewelry-product-video', name: 'Jewelry Product Video', description: 'Create a luxury jewelry advertisement with high-end commercial cinematography.', category: 'E-commerce' },
  { id: 'keyboard-art-maker', name: 'Keyboard Art Maker', description: 'Generate artistic top-down photos of keyboard keycaps arranged to spell out custom text.', category: 'Creative' },
  { id: 'logo-branding', name: 'Logo Branding', description: 'Design a professional logo with full branding package — variations, color palette, mockups.', category: 'Branding' },
  { id: 'logo-generator', name: 'Logo Generator', description: 'Quickly generate a single polished logo for any brand.', category: 'Branding' },
  { id: 'multi-angle-reshoot', name: 'Multi Angle Reshoot', description: 'Re-render a subject or scene from multiple dramatic camera angles.', category: 'Product' },
  { id: 'music-video', name: 'Music Video', description: 'Build a short music video from a song theme — N keyframes, animate each, generate music.', category: 'Motion' },
  { id: 'one-shot-video', name: 'One Shot Video', description: 'Generate a single continuous cinematic shot video — no cuts, one seamless scene.', category: 'Motion' },
  { id: 'product-ad-cinematic', name: 'Product Ad Cinematic', description: 'Cinematic 5–10s product ad from a product photo + brand brief.', category: 'Marketing' },
  { id: 'product-showcase-video', name: 'Product Showcase Video', description: 'Create a dynamic product showcase with explosive ingredient arrangements.', category: 'Marketing' },
  { id: 'rednote-cover', name: 'RedNote Cover', description: 'Create a Xiaohongshu (RedNote) style cover image — vibrant, lifestyle-focused.', category: 'Social' },
  { id: 'selfie-with-celebrities', name: 'Selfie With Celebrities', description: 'Generate a realistic behind-the-scenes selfie with a celebrity, followed by video.', category: 'Creative' },
  { id: 'social-pack', name: 'Social Pack', description: 'Re-render a hero image into Instagram, TikTok, YouTube-shorts and Twitter/X ratios.', category: 'Social' },
  { id: 'storyboard', name: 'Storyboard', description: 'Generate N keyframes for a short story or scene sequence.', category: 'Creative' },
  { id: 'talking-baby-video', name: 'Talking Baby Video', description: 'Create a viral-style video of a talking baby with custom costumes and scripts.', category: 'Motion' },
  { id: 'ugc-ads-workflow', name: 'UGC Ads Workflow', description: 'Create a User-Generated Content video ad from selfie and product image.', category: 'Marketing' },
  { id: 'url-to-design', name: 'URL To Design', description: 'Analyze a website URL and generate a redesigned, improved UI.', category: 'UI/UX' },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', description: 'Design a high-CTR YouTube thumbnail — striking imagery, bold text placement.', category: 'Content' },
]

export default function Templates() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Template Library</h1>
        <a href="/design-agent" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft size={16} />
          Back
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <div key={template.id} className="glass p-5 rounded-xl hover:bg-[var(--border-color)] transition-all cursor-pointer">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <LayoutTemplate size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{template.name}</h3>
                <span className="text-xs text-[var(--text-secondary)]">{template.category}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
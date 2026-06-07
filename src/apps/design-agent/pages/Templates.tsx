import { useState, useEffect } from 'react'
import { LayoutTemplate, ArrowLeft, Send, Loader2 } from 'lucide-react'
import { getAgentSkills } from '../../../shared/api/designAgent'
import { Skill } from '../../../shared/types/designAgent'

export default function Templates() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadSkills()
  }, [])
  
  const loadSkills = async () => {
    setLoading(true)
    try {
      const skillsList = await getAgentSkills()
      setSkills(skillsList)
    } catch (error) {
      console.error('Failed to load skills:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleUseTemplate = (skillName: string) => {
    window.location.href = `/design-agent/chat?template=${encodeURIComponent(skillName)}`
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    )
  }

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
        {skills.map(skill => (
          <div 
            key={skill.name} 
            className="glass p-5 rounded-xl hover:bg-[var(--border-color)] transition-all cursor-pointer"
            onClick={() => handleUseTemplate(skill.name)}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <LayoutTemplate size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{skill.name}</h3>
                <span className="text-xs text-[var(--text-secondary)]">{skill.category || 'Agent Skill'}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-3">{skill.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-primary text-xs">
                <Send size={14} />
                <span>Use Template</span>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{skill.estimated_credits} credits</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
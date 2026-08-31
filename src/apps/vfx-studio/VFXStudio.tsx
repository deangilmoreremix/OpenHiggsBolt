import { Routes, Route } from 'react-router-dom'
import VFXGenerate from './pages/VFXGenerate'

export default function VFXStudio({ apiKey, onRequestApiKey, onDismissApiKey, templateData }: { 
  apiKey?: string; 
  onRequestApiKey?: () => void;
  onDismissApiKey?: () => void;
  templateData?: { prompt?: string; aspectRatio?: string; [key: string]: any };
}) {
  return (
    <Routes>
      <Route path="/" element={<VFXGenerate apiKey={apiKey} onRequestApiKey={onRequestApiKey} onDismissApiKey={onDismissApiKey} templateData={templateData} />} />
    </Routes>
  )
}
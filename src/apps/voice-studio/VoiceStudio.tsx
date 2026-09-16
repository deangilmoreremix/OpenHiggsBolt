import { Routes, Route } from 'react-router-dom';
import VoiceStudio from '../../../packages/studio/src/components/VoiceStudio';

export default function VoiceStudioApp() {
  return (
    <Routes>
      <Route path="/" element={<VoiceStudio />} />
      <Route path="/overview" element={<VoiceStudio />} />
      <Route path="/from-audio" element={<VoiceStudio />} />
      <Route path="/by-design" element={<VoiceStudio />} />
      <Route path="/convert" element={<VoiceStudio />} />
      <Route path="/dub" element={<VoiceStudio />} />
      <Route path="/stories" element={<VoiceStudio />} />
      <Route path="/audiobook" element={<VoiceStudio />} />
      <Route path="/voices" element={<VoiceStudio />} />
      <Route path="/transcriptions" element={<VoiceStudio />} />
      <Route path="/projects" element={<VoiceStudio />} />
    </Routes>
  );
}

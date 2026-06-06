import { Routes, Route } from 'react-router-dom'

function ScriptWriterHome() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Script Writer</h1></div>
}

export default function ScriptWriter() {
  return (
    <Routes>
      <Route path="/" element={<ScriptWriterHome />} />
    </Routes>
  )
}
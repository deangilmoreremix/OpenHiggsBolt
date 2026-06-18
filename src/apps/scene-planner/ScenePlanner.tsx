import { Routes, Route } from 'react-router-dom'
import WorkflowBuilder from './pages/WorkflowBuilder'
import NodeTemplates from './pages/NodeTemplates'
import WorkflowHistory from './pages/WorkflowHistory'

export default function ScenePlanner() {
  return (
    <Routes>
      <Route path="/" element={<WorkflowBuilder />} />
      <Route path="/templates" element={<NodeTemplates />} />
      <Route path="/history" element={<WorkflowHistory />} />
    </Routes>
  )
}
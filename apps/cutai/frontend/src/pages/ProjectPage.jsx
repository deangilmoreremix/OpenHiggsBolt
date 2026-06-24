import { useParams } from 'react-router-dom';

export default function ProjectPage() {
  const { id } = useParams();
  return (
    <div className="flex h-screen items-center justify-center text-cutai-muted">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-cutai-text mb-2">Project {id}</h1>
        <p>Project page scaffold — implementation in later phases.</p>
      </div>
    </div>
  );
}

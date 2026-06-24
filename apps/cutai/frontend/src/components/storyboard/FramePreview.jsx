import { useState } from 'react';
import { motion } from 'framer-motion';

export default function FramePreview({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cutai-bg text-cutai-muted">
        <div className="h-full w-full animate-pulse bg-cutai-border/60" />
      </div>
    );
  }

  return (
    <motion.img
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      src={src}
      alt={alt || 'Frame'}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

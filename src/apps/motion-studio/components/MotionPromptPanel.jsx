'use client';

import { useState } from 'react';
import MotionPromptBar from './MotionPromptBar';

/**
 * 工作台里的提示词条 —— 自己管输入状态（画幅 / 时长 / 文案），
 * Generate 交给调用方（工作台里是把描述落成时间轨上的一张文字卡）。
 */
export default function MotionPromptPanel({ onGenerate }) {
  const [value, setValue] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);

  return (
    <MotionPromptBar
      value={value}
      onChange={setValue}
      aspectRatio={aspectRatio}
      onAspectRatioChange={setAspectRatio}
      duration={duration}
      onDurationChange={setDuration}
      onGenerate={onGenerate}
    />
  );
}

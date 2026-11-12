// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import Inspector from '@/components/social-publishing/thumbnail/designer/Inspector';
import { createProject, makeShapeLayer, makeTextLayer } from '@/components/social-publishing/thumbnail/designer/model';

afterEach(cleanup);
const P = createProject(1280, 720);

describe('Inspector', () => {
  it('shows the highlight words again when they change from outside (undo)', () => {
    const t = { ...makeTextLayer(P, 'FREE stuff'), highlight: { words: ['FREE'], color: '#ff0' } };
    const { rerender } = render(<Inspector layer={t} onChange={vi.fn()} />);
    const field = () => screen.getByPlaceholderText(/FREE, new/) as HTMLInputElement;
    expect(field().value).toBe('FREE');
    rerender(<Inspector layer={{ ...t, highlight: { words: ['stuff'], color: '#ff0' } }} onChange={vi.fn()} />);
    expect(field().value).toBe('stuff');
  });

  it('keeps unfinished input such as a trailing comma while the words match', () => {
    const t = makeTextLayer(P, 'a b');
    const onChange = vi.fn();
    const { rerender } = render(<Inspector layer={t} onChange={onChange} />);
    const field = screen.getByPlaceholderText(/FREE, new/) as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'a,' } });
    rerender(<Inspector layer={{ ...t, highlight: { ...t.highlight, words: ['a'] } }} onChange={onChange} />);
    expect(field.value).toBe('a,');
  });

  it('a rectangle can be unfilled and filled again: the checkbox follows its fill', () => {
    const r = makeShapeLayer(P, 'rect');
    const onChange = vi.fn();
    const { rerender } = render(<Inspector layer={r} onChange={onChange} />);
    const box = () => screen.getByLabelText('Filled') as HTMLInputElement;
    expect(box().checked).toBe(true);
    rerender(<Inspector layer={{ ...r, fill: 'rgba(0,0,0,0)' }} onChange={onChange} />);
    expect(box().checked).toBe(false);
    fireEvent.click(box());
    expect(onChange).toHaveBeenLastCalledWith({ fill: '#ef4444' });
  });
});

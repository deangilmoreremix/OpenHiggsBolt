'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

type Faq = { question: string; answer: string };

/**
 * FAQ list with Motion height/opacity transitions in place of the instant
 * <details> toggle. Keeps button + region semantics for keyboard and screen
 * reader users.
 */
export default function FaqAccordion({ faqs, idPrefix = 'faq' }: { faqs: Faq[]; idPrefix?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  // Static ids: useId() produced different ids on the server and the client
  // on this page, which broke hydration.
  const baseId = idPrefix;

  return (
    <div className="mt-10 space-y-4">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <motion.div
            key={faq.question}
            layout
            className={`landing-card rounded-2xl transition-colors ${isOpen ? 'border-cyan-400/30' : ''}`}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left font-bold text-white"
              >
                {faq.question}
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-lg leading-none text-cyan-200"
                >
                  +
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 leading-7 text-white/60">{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

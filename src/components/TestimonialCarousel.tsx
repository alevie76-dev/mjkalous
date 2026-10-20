import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';

export interface Testimonial {
  quote: string;
  attribution: string;
}

interface Props {
  testimonials: Testimonial[];
  /** Milliseconds between automatic slide changes. */
  interval?: number;
}

const SWIPE_THRESHOLD = 50;

function Stars() {
  return (
    <div className="flex justify-center gap-1 text-gold" role="img" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function Arrow({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
    </svg>
  );
}

export default function TestimonialCarousel({ testimonials, interval = 5000 }: Props) {
  const count = testimonials.length;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = (i: number) => setIndex((i + count) % count);
  const prev = () => go(index - 1);
  const next = () => go(index + 1);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const playing = !hovered && !focused && !reducedMotion && count > 1;

  // Keyed on index so a manual change restarts the countdown.
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), interval);
    return () => window.clearTimeout(t);
  }, [playing, index, count, interval]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  }

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  }

  const navBtn =
    'inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-sage-dark text-sage-dark transition-colors hover:bg-sage-dark hover:text-white';

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Reader reviews"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-5 md:gap-x-8"
    >
      <div
        aria-live={playing ? 'off' : 'polite'}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="col-span-3 row-start-1 grid rounded-2xl border border-line bg-white/70 px-5 py-10 shadow-sm sm:px-10 md:col-span-1 md:col-start-2 lg:px-16 lg:py-14"
      >
        {/* Slides share one grid cell so the card keeps the height of the longest quote. */}
        {testimonials.map((t, i) => {
          const active = i === index;
          return (
            <figure
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`col-start-1 row-start-1 flex flex-col items-center text-center transition-opacity duration-300 motion-reduce:transition-none ${
                active ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <span aria-hidden="true" className="font-serif text-7xl leading-none text-gold/70 select-none lg:text-8xl">
                &ldquo;
              </span>
              <blockquote className="-mt-4 max-w-3xl font-serif text-lg leading-relaxed font-medium text-ink sm:text-xl lg:-mt-6 lg:text-2xl">
                <p>{t.quote}</p>
              </blockquote>
              <div className="mt-6">
                <Stars />
              </div>
              <figcaption className="mt-3 text-sm font-semibold tracking-[0.14em] text-muted uppercase">
                &mdash; {t.attribution}
              </figcaption>
            </figure>
          );
        })}
      </div>

      <button type="button" onClick={prev} aria-label="Previous review" className={`${navBtn} col-start-1 row-start-2 md:row-start-1`}>
        <Arrow dir="prev" />
      </button>

      <div className="col-start-2 row-start-2 flex flex-col items-center">
        <div className="flex">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show review ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className="group inline-flex h-11 w-8 items-center justify-center"
            >
              <span
                className={`block h-2.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-clay' : 'w-2.5 bg-line group-hover:bg-sage'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-sm text-muted" aria-hidden="true">
          {index + 1} of {count}
        </p>
      </div>

      <button type="button" onClick={next} aria-label="Next review" className={`${navBtn} col-start-3 row-start-2 md:row-start-1`}>
        <Arrow dir="next" />
      </button>
    </div>
  );
}

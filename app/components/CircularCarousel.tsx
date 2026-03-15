'use client';

import { useState, useEffect, useRef } from 'react';
import './CircularCarousel.css';

const SIDE_OFFSET = 280;
const SIDE_OFFSET_MOBILE = 200;

export interface CircularCarouselCard {
  icon: string;
  title: string;
  description: string;
}

const DEFAULT_CARDS: CircularCarouselCard[] = [
  {
    icon: '📦',
    title: 'Stress-Free & Convenient',
    description: 'No trucks, no storage units, no hassle. We pick up and deliver to your door.',
  },
  {
    icon: '🔒',
    title: 'Secure & Climate-Controlled',
    description: '24/7 monitoring, climate control, and full insurance protection for your belongings.',
  },
  {
    icon: '💰',
    title: 'Transparent Student Pricing',
    description: 'Affordable rates built for students. No hidden fees, no surprises.',
  },
  {
    icon: '🚚',
    title: 'Door-to-Door Pickup & Return',
    description: 'We come to you. Schedule online and track your items anytime.',
  },
];

interface CircularCarouselProps {
  cards?: CircularCarouselCard[];
  autoPlayInterval?: number;
}

export function CircularCarousel({ cards = DEFAULT_CARDS, autoPlayInterval = 5000 }: CircularCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sideOffset, setSideOffset] = useState(SIDE_OFFSET);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setSideOffset(mq.matches ? SIDE_OFFSET_MOBILE : SIDE_OFFSET);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, autoPlayInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cards.length, autoPlayInterval]);

  const resetInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % cards.length);
      }, autoPlayInterval);
    }
  };

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
    resetInterval();
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % cards.length);
    resetInterval();
  };

  const goTo = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    resetInterval();
  };

  const getCardStyle = (index: number) => {
    const n = cards.length;
    const rel = (index - activeIndex + n) % n;
    const relLeft = rel <= n / 2 ? rel : rel - n;

    let translateX = 0;
    let translateZ = -200;
    let scale = 0.85;
    let opacity = 0.6;

    if (index === activeIndex) {
      translateX = 0;
      translateZ = 0;
      scale = 1.1;
      opacity = 1;
    } else if (rel === 1 || (rel === n - 1 && n > 2)) {
      translateX = rel === 1 ? sideOffset : -sideOffset;
      translateZ = -200;
      scale = 0.85;
      opacity = 0.6;
    } else {
      opacity = 0;
      translateZ = -400;
      scale = 0.7;
      translateX = relLeft > 0 ? sideOffset + 120 : -sideOffset - 120;
    }

    const zIndex = index === activeIndex ? 50 : rel === 1 ? 45 : rel === n - 1 ? 45 : 30;
    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`,
      opacity,
      zIndex,
    };
  };

  return (
    <div className="circular-carousel">
      <div className="circular-carousel__row">
        <button
          type="button"
          className="circular-carousel__arrow circular-carousel__arrow--left"
          onClick={goPrev}
          aria-label="Previous card"
        >
          ‹
        </button>

        <div className="circular-carousel__viewport">
        <div className="circular-carousel__track">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`circular-carousel__card ${index === activeIndex ? 'circular-carousel__card--active' : ''}`}
              style={getCardStyle(index)}
            >
              <div className="circular-carousel__card-inner">
                <div className="circular-carousel__card-icon">{card.icon}</div>
                <h3 className="circular-carousel__card-title">{card.title}</h3>
                <p className="circular-carousel__card-description">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
        </div>

        <button
          type="button"
          className="circular-carousel__arrow circular-carousel__arrow--right"
          onClick={goNext}
          aria-label="Next card"
        >
          ›
        </button>
      </div>

      <div className="circular-carousel__dots" role="tablist" aria-label="Carousel pagination">
        {cards.map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Go to card ${index + 1}`}
            className={`circular-carousel__dot ${index === activeIndex ? 'circular-carousel__dot--active' : ''}`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  );
}

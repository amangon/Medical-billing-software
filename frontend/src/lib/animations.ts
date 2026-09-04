import { Variants, Transition } from 'framer-motion'

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeOut' },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export const letterVariants: Variants = {
  hidden: { opacity: 0, y: 20, rotateX: -40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export const floatingAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

export const pulseGlow = {
  scale: [1, 1.02, 1],
  boxShadow: [
    '0 0 0 0 rgba(18, 18, 18, 0)',
    '0 0 20px 4px rgba(18, 18, 18, 0.08)',
    '0 0 0 0 rgba(18, 18, 18, 0)',
  ],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

export const hoverLift = {
  y: -6,
  scale: 1.01,
  boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.12), 0 8px 16px -8px rgba(0, 0, 0, 0.06)',
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const magneticVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.15 },
  },
}

export const navbarVariants: Variants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  scrolled: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

export const defaultTransition: Transition = {
  duration: 0.3,
  ease: 'easeOut',
}

export const sectionTransition: Transition = {
  duration: 0.8,
  ease: [0.25, 0.46, 0.45, 0.94],
}

export const heroZoomIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export const card3DTilt = {
  y: -8,
  scale: 1.02,
  rotateX: 2,
  rotateY: -2,
  boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 12px 24px -8px rgba(0, 0, 0, 0.08)',
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const meshGradientAnimation = {
  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
  transition: {
    duration: 15,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

export const lightReflectionAnimation = {
  opacity: [0, 0.3, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

export const floatingButton = {
  y: [0, -6, 0],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

export const staggerFadeIn: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export const viewportTransition: Transition = {
  duration: 0.8,
  ease: [0.25, 0.46, 0.45, 0.94],
}

export const fastTransition: Transition = {
  duration: 0.3,
  ease: 'easeOut',
}

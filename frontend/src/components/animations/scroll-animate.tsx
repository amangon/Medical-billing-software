'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode, useEffect, useRef } from 'react'
import { fadeInUp, scaleIn, sectionTransition } from '@/lib/animations'

interface ScrollAnimateProps {
  children: ReactNode
  className?: string
  delay?: number
  variant?: 'fadeInUp' | 'scaleIn'
}

export function ScrollAnimate({ children, className = '', delay = 0, variant = 'fadeInUp' }: ScrollAnimateProps) {
  const variants = variant === 'scaleIn' ? scaleIn : fadeInUp

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-15%' }}
      variants={variants}
      transition={{ ...sectionTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

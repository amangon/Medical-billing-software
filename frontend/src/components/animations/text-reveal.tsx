'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'
import { letterVariants, fadeIn, sectionTransition } from '@/lib/animations'

interface TextRevealProps {
  text: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  delay?: number
}

export function TextReveal({ text, className = '', as = 'h1', delay = 0 }: TextRevealProps) {
  const letters = text.split('')

  const Tag = motion[as]

  return (
    <Tag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      className={className}
      style={{ perspective: 1000 }}
    >
      {letters.map((char, i) => (
        <motion.span
          key={i}
          custom={i + delay * 10}
          variants={letterVariants}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </Tag>
  )
}

interface FadeInTextProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function FadeInText({ children, className = '', delay = 0 }: FadeInTextProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      variants={fadeIn}
      transition={{ ...sectionTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

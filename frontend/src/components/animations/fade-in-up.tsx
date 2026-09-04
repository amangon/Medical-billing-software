'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'
import { fadeInUp, sectionTransition } from '@/lib/animations'

interface FadeInUpProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeInUp({ children, delay = 0, className = '' }: FadeInUpProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20%' }}
      variants={fadeInUp}
      transition={{ ...sectionTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

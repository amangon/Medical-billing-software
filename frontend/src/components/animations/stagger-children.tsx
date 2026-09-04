'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'
import { staggerContainer, staggerItem, sectionTransition } from '@/lib/animations'

interface StaggerChildrenProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerChildren({ children, className = '', staggerDelay = 0.12 }: StaggerChildrenProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      variants={staggerContainer}
      transition={{ staggerChildren: staggerDelay, delayChildren: 0.2, ...sectionTransition }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className = '' }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

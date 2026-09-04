'use client'

import { motion } from 'framer-motion'
import { meshGradientAnimation, lightReflectionAnimation } from '@/lib/animations'

export function MeshGradient() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(at 40% 20%, rgba(246,200,224,1) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(191,216,255,1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(255,242,243,1) 0px, transparent 50%), radial-gradient(at 80% 50%, rgba(207,236,199,1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(248,217,107,1) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(217,198,255,1) 0px, transparent 50%)',
          backgroundSize: '200% 200%',
        }}
        animate={meshGradientAnimation}
      />
    </div>
  )
}

export function LightReflections() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${300 + i * 100}px`,
            height: `${300 + i * 100}px`,
            top: `${20 + i * 25}%`,
            left: `${10 + i * 30}%`,
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          animate={lightReflectionAnimation}
          transition={{ delay: i * 1.5 }}
        />
      ))}
    </div>
  )
}

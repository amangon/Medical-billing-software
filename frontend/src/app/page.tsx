'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Receipt, BarChart3, Users, Zap } from 'lucide-react'
import { FloatingParticles, GradientBlobs, MeshGradient, LightReflections } from '@/components/animations'
import { TextReveal, FadeInText, StaggerChildren, StaggerItem, MagneticButton, RippleButton } from '@/components/animations'
import { heroZoomIn, floatingButton, card3DTilt } from '@/lib/animations'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const { scrollY } = useScroll()
  const navbarBackground = useTransform(scrollY, [0, 100], ['rgba(243, 235, 221, 0)', 'rgba(243, 235, 221, 0.85)'])
  const navbarBlur = useTransform(scrollY, [0, 100], ['0px', '16px'])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F7F1E7]">
        <div className="h-20" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F1E7] relative overflow-hidden">
      <MeshGradient />
      <FloatingParticles />
      <GradientBlobs />
      <LightReflections />

      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: navbarBackground,
          backdropFilter: `blur(${navbarBlur}px)`,
          borderBottom: '1px solid rgba(229, 216, 195, 0.3)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="w-10 h-10 bg-[#121212] rounded-2xl flex items-center justify-center">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#121212]">MyBill</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            >
              <Link href="/login" className="nav-link text-sm font-medium text-[#121212] hidden sm:block">
                Sign in
              </Link>
              <Link href="/signup">
                <Button className="rounded-full bg-[#121212] text-white hover:bg-[#2a2a2a] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <motion.div
          variants={heroZoomIn}
          initial="hidden"
          animate="visible"
          className="text-center mb-8"
        >
          <TextReveal
            text="Modern Billing & Inventory Management"
            className="landing-hero-title block"
            delay={0}
          />
        </motion.div>

        <FadeInText delay={0.4}>
          <p className="landing-subtitle max-w-2xl mx-auto mb-12">
            Streamline your business operations with our comprehensive billing, inventory, and analytics platform.
          </p>
        </FadeInText>

        <motion.div
          className="flex justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
        >
          <motion.div animate={floatingButton}>
            <MagneticButton strength={0.2}>
              <Link href="/signup">
                <RippleButton className="rounded-full bg-[#121212] text-white hover:bg-[#2a2a2a] h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  Start Free Trial <ArrowRight className="h-5 w-5 inline-block ml-2" />
                </RippleButton>
              </Link>
            </MagneticButton>
          </motion.div>
          <motion.div
            animate={floatingButton}
            transition={{ delay: 0.5 }}
          >
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-[#121212] text-[#121212] hover:bg-[#121212]/5 h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <StaggerChildren className="grid md:grid-cols-4 gap-8 mt-24" staggerDelay={0.15}>
          {[
            { icon: Receipt, title: 'Smart Billing', desc: 'Fast POS and invoice generation' },
            { icon: BarChart3, title: 'Analytics', desc: 'Real-time business insights' },
            { icon: Users, title: 'CRM', desc: 'Customer and supplier management' },
            { icon: Zap, title: 'Automation', desc: 'Streamline repetitive tasks' },
          ].map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.div
                className="landing-card card-tilt soft-glow p-8 cursor-default"
                whileHover={card3DTilt}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <motion.div
                  className="w-14 h-14 bg-[#121212] rounded-2xl flex items-center justify-center mb-6"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon className="h-7 w-7 text-white" />
                </motion.div>
                <h3 className="landing-card-title mb-3">{feature.title}</h3>
                <p className="landing-card-desc">{feature.desc}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </main>
    </div>
  )
}

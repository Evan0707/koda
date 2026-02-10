'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export function AuthBackground() {
 const ref = useRef(null)

 // Subtle parallax effect based on scroll, though auth pages might not scroll much
 const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start start", "end end"]
 })

 const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])

 return (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-background" ref={ref}>
   {/* Grid pattern background */}
   <motion.div style={{ y: backgroundY }} className="absolute inset-0">
    <div
     className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
     style={{
      backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
      backgroundSize: '60px 60px'
     }}
    />
   </motion.div>

   {/* Gradient orbs */}
   <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
   <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />

   {/* Additional subtle gradient for depth */}
   <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
  </div>
 )
}

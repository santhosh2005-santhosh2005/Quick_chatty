"use client"

import { useEffect, useState } from "react"
import { useThemeStore } from "@/store/useThemeStore"
import { Particles } from "@/components/ui/particles"

export function ParticlesDemo() {
  const { theme } = useThemeStore()
  const [color, setColor] = useState("#ffffff")

  useEffect(() => {
    // Map theme to appropriate particle color
    const isDarkTheme = [
      'dark', 'business', 'synthwave', 'halloween', 'forest', 'black', 
      'luxury', 'dracula', 'night', 'coffee'
    ].includes(theme)
    
    setColor(isDarkTheme ? "#ffffff" : "#000000")
  }, [theme])

  return (
    <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
      <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-8xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
        Particles
      </span>
      <Particles
        className="absolute inset-0"
        quantity={100}
        ease={80}
        color={color}
        refresh
      />
    </div>
  )
}
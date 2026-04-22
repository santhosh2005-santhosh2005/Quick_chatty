import { ParticlesDemo } from "@/components/ui/particles-demo"

const ParticlesTestPage = () => {
  return (
    <div className="h-screen bg-base-200">
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h1 className="text-3xl font-bold mb-8">Particles Component Demo</h1>
        <div className="w-full max-w-4xl">
          <ParticlesDemo />
        </div>
        <div className="mt-8 text-center">
          <p className="text-base-content/70">
            This is a demo of the Particles component. Move your mouse around to interact with the particles.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ParticlesTestPage
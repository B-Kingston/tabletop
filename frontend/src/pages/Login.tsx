import { SignIn } from '@/lib/clerk'
import { motion } from 'framer-motion'

export function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <h1 className="text-center text-3xl font-bold tracking-tight text-neutral-900 mb-8">
          Tabletop
        </h1>
        <SignIn />
      </motion.div>
    </div>
  )
}

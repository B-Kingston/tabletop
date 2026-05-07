import { SignIn } from '@/lib/clerk'
import { motion } from 'framer-motion'

export function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md px-4"
      >
        <h1 className="text-center text-3xl font-bold tracking-tight text-text mb-8">
          Tabletop
        </h1>
        <div className="soft-card max-w-md mx-auto">
          <SignIn />
        </div>
      </motion.div>
    </div>
  )
}

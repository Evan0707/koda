import { Badge } from '@/components/ui/badge'
import { Crown, Zap, LucideIcon } from 'lucide-react'

type PlanConfig = {
 label: string
 className: string
 icon: LucideIcon | null
}

type PlanType = 'free' | 'starter' | 'pro'

const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
 free: {
  label: 'Free',
  className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  icon: null,
 },
 starter: {
  label: 'Starter',
  className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  icon: Zap,
 },
 pro: {
  label: 'Pro',
  className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  icon: Crown,
 },
}

export function PlanBadge({ plan }: { plan: string }) {
 const planType = (plan || 'free') as PlanType
 const config = PLAN_CONFIGS[planType] || PLAN_CONFIGS.free
 const Icon = config.icon

 return (
  <Badge className={config.className}>
   {Icon && <Icon className="w-3 h-3 mr-1" />}
   {config.label}
  </Badge>
 )
}

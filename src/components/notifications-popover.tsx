'use client'

import { useState, useEffect } from 'react'
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Check, Info, AlertTriangle, AlertCircle, XCircle } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/actions/automation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

type Notification = {
 id: string
 type: string
 title: string
 body: string | null
 link: string | null
 isRead: boolean | null
 createdAt: Date
}

const icons = {
 info: Info,
 success: Check,
 warning: AlertTriangle,
 error: AlertCircle,
} as const

const colors = {
 info: 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
 success: 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
 warning: 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
 error: 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
} as const

export function NotificationsPopover() {
 const [notifications, setNotifications] = useState<Notification[]>([])
 const [unreadCount, setUnreadCount] = useState(0)
 const [isOpen, setIsOpen] = useState(false)

 const fetchNotifications = async () => {
  const res = await getNotifications()
  if (res.notifications) {
   setNotifications(res.notifications as Notification[])
   setUnreadCount(res.unreadCount || 0)
  }
 }

 useEffect(() => {
  fetchNotifications()
  // Poll every minute
  const interval = setInterval(fetchNotifications, 60000)
  return () => clearInterval(interval)
 }, [])

 const handleMarkAsRead = async (id: string) => {
  await markAsRead(id)
  setNotifications(prev =>
   prev.map(n => n.id === id ? { ...n, isRead: true } : n)
  )
  setUnreadCount(prev => Math.max(0, prev - 1))
 }

 const handleMarkAllAsRead = async () => {
  await markAllAsRead()
  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  setUnreadCount(0)
  toast.success('Tout marqué comme lu')
 }

 return (
  <Popover open={isOpen} onOpenChange={setIsOpen}>
   <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
     <Bell className="h-5 w-5 text-muted-foreground" />
     {unreadCount > 0 && (
      <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 dark:bg-red-500 border-2 border-background" />
     )}
    </Button>
   </PopoverTrigger>
   <PopoverContent align="end" className="w-80 p-0">
    <div className="flex items-center justify-between p-4 border-b">
     <h4 className="font-semibold text-sm">Notifications</h4>
     {unreadCount > 0 && (
      <Button
       variant="ghost"
       size="sm"
       className="text-xs h-auto p-0 text-primary hover:text-primary/80 hover:bg-transparent"
       onClick={handleMarkAllAsRead}
      >
       Tout marquer comme lu
      </Button>
     )}
    </div>
    <ScrollArea className="h-[300px]">
     {notifications.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
       <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
       <p className="text-sm text-muted-foreground">Aucune notification</p>
      </div>
     ) : (
      <div className="divide-y">
       {notifications.map((notification) => {
        const type = (notification.type as keyof typeof icons) || 'info'
        const Icon = icons[type]
        const colorClass = colors[type]

        return (
         <div
          key={notification.id}
          className={cn(
           "p-4 hover:bg-muted transition-colors relative group",
           !notification.isRead && "bg-primary/5"
          )}
         >
          <div className="flex gap-3">
           <div className={cn("mt-1 p-1.5 rounded-full h-fit", colorClass)}>
            <Icon className="w-3.5 h-3.5" />
           </div>
           <div className="flex-1 space-y-1">
            <p className={cn("text-sm font-medium", !notification.isRead && "text-foreground font-semibold")}>
             {notification.title}
            </p>
            {notification.body && (
             <p className="text-xs text-muted-foreground line-clamp-2">
              {notification.body}
             </p>
            )}
            <div className="flex items-center gap-2 mt-2">
             <p className="text-[10px] text-muted-foreground">
              {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
               hour: '2-digit',
               minute: '2-digit'
              })}
             </p>
             {notification.link && (
              <Link
               href={notification.link}
               onClick={() => setIsOpen(false)}
               className="text-[10px] text-primary hover:underline"
              >
               Voir
              </Link>
             )}
            </div>
           </div>
          </div>
          {!notification.isRead && (
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
             e.stopPropagation()
             handleMarkAsRead(notification.id)
            }}
           >
            <Check className="w-3 h-3 text-muted-foreground" />
           </Button>
          )}
         </div>
        )
       })}
      </div>
     )}
    </ScrollArea>
   </PopoverContent>
  </Popover>
 )
}

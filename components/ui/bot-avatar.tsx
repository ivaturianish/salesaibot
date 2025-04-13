import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot } from "lucide-react"

export function BotAvatar() {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src="/robot-avatar.png" />
      <AvatarFallback>
        <Bot className="h-5 w-5" />
      </AvatarFallback>
    </Avatar>
  )
} 
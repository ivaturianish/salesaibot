"use client"

import { useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useChatStorage } from "@/hooks/use-chat-storage"
import ChatPage from "../page"
import mongoose from "mongoose"

export default function ChatWithId({ params }: { params: { chatId: string } }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const chatId = resolvedParams.chatId

  // Validate if the ID is a valid MongoDB ObjectId
  const isValidId = mongoose.Types.ObjectId.isValid(chatId)

  // If the ID is not valid, redirect to the main chat page
  useEffect(() => {
    if (!isValidId) {
      console.error("Invalid chat ID format:", chatId)
      router.push("/chat")
      return
    }
  }, [chatId, isValidId, router])

  // Only use the chat storage hook if the ID is valid
  const { loadChat, error, chat } = useChatStorage({
    chatId: isValidId ? chatId : undefined
  })

  // Log the chat data for debugging
  useEffect(() => {
    if (chat) {
      console.log('Loaded chat:', chat);
    }
  }, [chat])

  // If there's an error loading the chat, redirect to the main chat page
  useEffect(() => {
    if (error) {
      console.error("Error loading chat:", error)
      router.push("/chat")
    }
  }, [error, router])

  // Render the main chat page
  // The chat will be loaded by the useChatStorage hook
  return <ChatPage />
}

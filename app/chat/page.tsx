"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { AnimatedButton } from "@/components/ui/animated-button"
import AnimatedElement from "@/components/animated-element"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenUsage } from "@/components/token-usage"
import { extractTextFromPdf } from "@/lib/pdf-worker"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import {
  AlertCircle,
  FileText,
  Mic,
  Paperclip,
  Send,
  Video,
  X,
  MessageSquare,
  ThumbsUp,
  Clock,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useGemini } from "@/hooks/use-gemini"
import { BotAvatar } from "@/components/ui/bot-avatar"
import { MarkdownMessage } from "@/components/chat/markdown-message"
import { cn } from "@/lib/utils"
import { ErrorMessage } from "@/components/chat/error-message"
import { LoadingSpinner } from "@/components/chat/loading-spinner"
import { SuggestedPrompts } from "@/components/chat/suggested-prompts"
import { ChatSearch } from "@/components/chat/chat-search"
import { useChatErrors } from "@/hooks/use-chat-errors"
import { useFileProcessing } from "@/hooks/use-file-processing"
import { useFileValidation } from "@/hooks/use-file-validation"
import { useTokenUsage } from "@/hooks/use-token-usage"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  attachmentType?: "audio" | "video" | "text"
  attachmentName?: string
  isAnalysis?: boolean
  performanceData?: {
    overallScore: number
    metrics: {
      name: string
      score: number
    }[]
    strengths: string[]
    improvements: string[]
  }
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// ErrorState interface removed - not used

export default function ChatPage() {
  const {
    messages: geminiMessages,
    setMessages: setGeminiMessages,
    // isLoading not used
    sendMessage: sendGeminiMessage,
    analyzeContent: analyzeContentWithGemini,
  } = useGemini({
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi there! I'm your AI sales coach. You can chat with me about sales techniques, upload sales calls for analysis, or practice your pitch. How can I help you today?",
      },
    ],
  })

  const [messages, setMessages] = useState<Message[]>(geminiMessages)

  useEffect(() => {
    setGeminiMessages(messages)
  }, [messages, setGeminiMessages])

  const [input, setInput] = useState("")
  const [recordingComplete, setRecordingComplete] = useState(false)

  // Audio recorder hook
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording: cancelAudioRecording,
    // recordingBlob not used directly as it's handled in onRecordingComplete
  } = useAudioRecorder({
    onRecordingComplete: (audioBlob, _duration) => {
      // Create a File object from the Blob
      const file = new File([audioBlob], "recorded_audio.mp3", { type: "audio/mp3" })
      setSelectedFile(file)
      setRecordingComplete(true)
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Token usage tracking
  const { tokenUsage, addTokenUsage } = useTokenUsage({ sessionId: 'chat-session' })

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Message[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { error, handleFileError, handleMessageError, clearError } = useChatErrors()
  const {
    isProcessing,
    uploadProgress,
    uploading,
    error: processingError,
    startProcessing,
    updateProgress,
    finishProcessing,
    setError: setProcessingError,
    reset: resetProcessing,
  } = useFileProcessing()
  const { validateFile, getFileType } = useFileValidation()
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Search function
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      clearSearch()
      return
    }

    setIsSearching(true)
    setSearchQuery(query)

    // Simple search implementation - can be enhanced with semantic search
    const results = messages.filter(message =>
      message.content.toLowerCase().includes(query.toLowerCase())
    )

    setSearchResults(results)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedFile) || isLoading || isProcessing) return

    clearError()
    startProcessing()

    let userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    if (selectedFile) {
      // Validate file
      const validationError = validateFile(selectedFile)
      if (validationError) {
        handleFileError(new Error(validationError.message), () => {
          setSelectedFile(null)
          resetProcessing()
        })
        return
      }

      const fileType = getFileType(selectedFile)
      userMessage = {
        ...userMessage,
        attachmentType: fileType,
        attachmentName: selectedFile.name,
        content: input || `I've uploaded a ${fileType} file for analysis: ${selectedFile.name}`,
      }

      try {
        let fileContent = ""

        if (selectedFile.type === "application/pdf") {
          try {
            // Extract text from PDF using our utility function
            fileContent = await extractTextFromPdf(selectedFile)
            // Update progress to show user something is happening
            updateProgress(75)
          } catch (error) {
            console.error("PDF processing error:", error)
            fileContent = "[PDF content could not be extracted. Processing as a binary file.]"
            // Update progress to show user something is happening
            updateProgress(50)
            // Set a more specific error message
            setProcessingError("PDF processing error: The file might be corrupted or password-protected.")
          }
        } else if (fileType === "audio" || fileType === "video") {
          try {
            const buffer = await selectedFile.arrayBuffer()
            const base64 = btoa(
              new Uint8Array(buffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            )
            fileContent = `data:${selectedFile.type};base64,${base64}`
          } catch (error) {
            console.error("Media file processing error:", error)
            setProcessingError("Failed to process media file. The file might be corrupted or in an unsupported format.")
            handleFileError(error, () => {
              setSelectedFile(null)
              resetProcessing()
            })
            return
          }
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setSelectedFile(null)
        setRecordingComplete(false)
        setIsLoading(true)

        try {
          const analysisMessage = await analyzeContentWithGemini(
            fileType,
            fileContent,
            selectedFile.name,
            input
          )

          setCurrentAnalysis(analysisMessage)
          setShowAnalysisDialog(true)

          // Track token usage if available
          if (analysisMessage.tokenUsage) {
            addTokenUsage({
              promptTokens: analysisMessage.tokenUsage.promptTokens,
              completionTokens: analysisMessage.tokenUsage.completionTokens,
              totalTokens: analysisMessage.tokenUsage.totalTokens,
              estimatedCost: 0, // Will be calculated by the hook
              model: 'gemini-pro-vision' // Using vision model for content analysis
            })
          }
        } catch (error) {
          handleFileError(error, () => {
            setSelectedFile(null)
            resetProcessing()
          })
        } finally {
          setIsLoading(false)
          finishProcessing()
        }
      } catch (error) {
        handleFileError(error, () => {
          setSelectedFile(null)
          resetProcessing()
        })
      }
    } else {
      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        const result = await sendGeminiMessage(input)
        setMessages((prev) => [...prev, result])

        // Track token usage if available
        if (result.tokenUsage) {
          addTokenUsage({
            promptTokens: result.tokenUsage.promptTokens,
            completionTokens: result.tokenUsage.completionTokens,
            totalTokens: result.tokenUsage.totalTokens,
            estimatedCost: 0, // Will be calculated by the hook
            model: 'gemini-pro'
          })
        }
      } catch (error) {
        handleMessageError(() => {
          setIsLoading(false)
        })
      } finally {
        setIsLoading(false)
        finishProcessing()
      }
    }
  }

  // generateAnalysisMessage function removed - not used

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording
      setRecordingComplete(false)
      startRecording()
      console.log("Started recording")
    } else {
      // Stop recording
      stopRecording()
      console.log("Stopped recording")
    }
  }

  const cancelRecording = () => {
    cancelAudioRecording()
    setRecordingComplete(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setRecordingComplete(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const renderFilePreview = () => {
    if (!selectedFile) return null

    let icon = <FileText className="h-5 w-5 text-muted-foreground" />
    if (selectedFile.type.startsWith("audio/")) {
      icon = <Mic className="h-5 w-5 text-muted-foreground" />
    } else if (selectedFile.type.startsWith("video/")) {
      icon = <Video className="h-5 w-5 text-muted-foreground" />
    }

    const isRecordedAudio = selectedFile.name === "recorded_audio.mp3" && recordingComplete

    return (
      <AnimatedElement type="slide-up" duration={400}>
        {processingError && (
          <div className="flex items-center gap-2 p-3 border border-destructive rounded-xl bg-destructive/10 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{processingError}</p>
            <AnimatedButton
              variant="ghost"
              size="icon"
              className="h-7 w-7 ml-auto rounded-full hover:bg-destructive/20"
              onClick={() => resetProcessing()}
              animation="shake"
            >
              <X className="h-3.5 w-3.5" />
            </AnimatedButton>
          </div>
        )}
        <div className="flex items-center gap-2 p-3 border rounded-xl bg-accent/30 mb-3 hover:shadow-md transition-all duration-300">
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {isRecordedAudio
                ? `${formatDuration(recordingDuration)} recording`
                : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}
            </p>
          </div>
          {uploading ? (
            <div className="w-20">
              <Progress value={uploadProgress} className="h-1.5 rounded-full bg-secondary" />
            </div>
          ) : (
            <AnimatedButton
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-accent/50"
              onClick={clearSelectedFile}
              animation="shake"
            >
              <X className="h-3.5 w-3.5" />
            </AnimatedButton>
          )}
        </div>
      </AnimatedElement>
    )
  }

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user"

    return (
      <div
        key={message.id}
        className={cn(
          "flex w-full gap-3 p-4",
          isUser ? "bg-accent/30" : "bg-secondary/50"
        )}
      >
        {!isUser && <BotAvatar />}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isUser ? "You" : "AI Assistant"}
            </span>
            {message.attachmentType && (
              <span className="text-xs text-gray-500">
                ({message.attachmentType} file: {message.attachmentName})
              </span>
            )}
          </div>
          <MarkdownMessage
            content={message.content}
            performanceData={message.performanceData}
            attachmentName={message.attachmentName}
            attachmentType={message.attachmentType}
          />
        </div>
      </div>
    )
  }

  const renderAnalysisDialog = () => {
    if (!currentAnalysis || !currentAnalysis.performanceData) return null

    const { overallScore, metrics, strengths, improvements } = currentAnalysis.performanceData

    return (
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border-primary/20 bg-card/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              Performance Analysis
            </DialogTitle>
            <DialogDescription>Detailed breakdown of your sales performance</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3 rounded-full p-1 bg-accent">
              <TabsTrigger
                value="overview"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="metrics"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Metrics
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="flex flex-col items-center justify-center p-6 border border-primary/20 rounded-xl bg-accent/30 backdrop-blur-sm animate-pulse-glow">
                <div className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                  {overallScore}/100
                </div>
                <p className="text-muted-foreground">Overall Performance Score</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-green-500/20 bg-green-500/5 overflow-hidden">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3 flex items-center text-green-400">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-400 mr-2">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3 flex items-center text-amber-400">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-amber-400 mr-2">!</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4 mt-6">
              {metrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{metric.name}</span>
                    <span className="font-semibold">{metric.score}/100</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-secondary">
                      <div
                        style={{ width: `${metric.score}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-1000"
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4 mt-6">
              <Textarea
                className="min-h-[200px] rounded-xl bg-accent/30 border-primary/20 focus-visible:ring-primary"
                readOnly
                value={`Based on my analysis, here are some specific recommendations to improve your sales performance:

1. ${improvements[0]}
   - Try acknowledging customer concerns before addressing them
   - Focus on value proposition rather than defending price points
   - Use social proof to validate your offering

2. ${improvements[1] || "Work on your closing techniques"}
   - Practice more direct closing questions
   - Offer specific next steps at the end of your conversations
   - Create a sense of urgency when appropriate

Continue building on your strengths:
- ${strengths[0]}
- ${strengths[1] || "Your clear communication style"}

I recommend practicing these techniques in our chat interface. Would you like to role-play a scenario to practice these skills?`}
              />
              <AnimatedButton
                variant="gradient"
                className="w-full gap-2"
                animation="pulse"
                ripple
              >
                <MessageSquare className="h-4 w-4" />
                Practice with AI Coach
              </AnimatedButton>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    )
  }

  // Suggested prompts moved to a separate component

  return (
    <AppLayout>
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            AI Sales Coach
          </h1>
          <ChatSearch onSearch={handleSearch} onClear={clearSearch} />
        </div>
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
            {isSearching ? (
              <>
                <div className="p-2 mb-4 bg-accent/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Showing {searchResults.length} results for "{searchQuery}"
                  </p>
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map(renderMessage)
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">No messages found matching your search.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {messages.map(renderMessage)}
                {error && (
                  <ErrorMessage
                    message={error.message}
                    onRetry={error.retry}
                    className="mt-4"
                  />
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 p-4">
                    <LoadingSpinner text="Processing..." />
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <SuggestedPrompts onSelectPrompt={setInput} />
          )}

          {renderFilePreview()}

          {/* Token usage display */}
          <div className="mt-2">
            <TokenUsage
              tokensUsed={tokenUsage.session.totalTokens}
              tokensLimit={100000}
              estimatedCost={tokenUsage.session.estimatedCost}
            />
          </div>

          {isRecording ? (
            <AnimatedElement type="fade-in" duration={300} className="w-full">
              <div className="flex items-center gap-2 p-4 border rounded-xl bg-accent/30 mb-3 animate-pulse-glow">
                <div className="flex-1 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-lg font-medium">{formatDuration(recordingDuration)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Recording...</span>
                </div>
                <div className="flex gap-2">
                  <AnimatedButton variant="outline" size="sm" className="rounded-full" onClick={cancelRecording} animation="shake">
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton variant="gradient" size="sm" className="rounded-full" onClick={toggleRecording} animation="pulse">
                    Done
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedElement>
          ) : (
            <AnimatedElement type="slide-up" duration={500} className="w-full">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AnimatedButton
                        type="button"
                        variant={recordingComplete ? "gradient" : "outline"}
                        size="icon"
                        onClick={toggleRecording}
                        disabled={isLoading || !!selectedFile}
                        className="rounded-full"
                        animation={recordingComplete ? "pulse" : "none"}
                      >
                        {recordingComplete ? <Mic className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4" />}
                      </AnimatedButton>
                    </TooltipTrigger>
                    <TooltipContent>{recordingComplete ? "Recording complete" : "Record audio"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AnimatedButton
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={triggerFileInput}
                        disabled={isLoading || recordingComplete || !!selectedFile}
                        className="rounded-full"
                        animation="pop"
                      >
                        <Paperclip className="h-4 w-4" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="audio/*,video/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileSelect}
                        />
                      </AnimatedButton>
                    </TooltipTrigger>
                    <TooltipContent>Upload file (audio, video, or document)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Input
                  placeholder="Type your message or ask for sales advice..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 rounded-full border-primary/20 focus-visible:ring-primary bg-accent/30 backdrop-blur-sm transition-all duration-300 hover:shadow-inner"
                />

                <AnimatedButton
                  type="submit"
                  size="icon"
                  disabled={(!input.trim() && !selectedFile) || isLoading}
                  variant="gradient"
                  className="rounded-full"
                  animation="pop"
                  ripple
                >
                  <Send className="h-4 w-4" />
                </AnimatedButton>
              </form>
            </AnimatedElement>
          )}
        </div>
      </div>

      {renderAnalysisDialog()}
    </AppLayout>
  )
}


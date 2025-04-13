interface FileValidationError {
  message: string
  code: "SIZE" | "TYPE" | "CORRUPT"
}

export function useFileValidation() {
  const validateFile = (file: File): FileValidationError | null => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        message: "File size exceeds 10MB limit. Please upload a smaller file.",
        code: "SIZE",
      }
    }

    // Check file type
    const validTypes = {
      video: ["video/mp4", "video/webm", "video/ogg"],
      audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
      pdf: ["application/pdf"],
    }

    const isValidType = [
      ...validTypes.video,
      ...validTypes.audio,
      ...validTypes.pdf,
    ].includes(file.type)

    if (!isValidType) {
      return {
        message: "Unsupported file type. Please upload a video, audio, or PDF file.",
        code: "TYPE",
      }
    }

    return null
  }

  const getFileType = (file: File): "video" | "audio" | "text" => {
    if (file.type.startsWith("audio/")) return "audio"
    if (file.type.startsWith("video/")) return "video"
    return "text"
  }

  return {
    validateFile,
    getFileType,
  }
} 
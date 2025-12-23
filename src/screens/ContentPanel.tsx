import { Panel, Button, Group, Card, Snackbar, SegmentedControl } from '@vkontakte/vkui'
import bridge from '@vkontakte/vk-bridge'
import React, { useState } from 'react'

type ContentPanelProps = {
  id: string
}

type ImageCategory = 'nature' | 'city' | 'space' | 'abstract' | 'ocean'

const ContentPanel = ({ id }: ContentPanelProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [notification, setNotification] = useState<React.ReactNode>(null)
  const [quoteContent, setQuoteContent] = useState<string | null>(null)
  const [selectedImageCategory, setSelectedImageCategory] = useState<ImageCategory>('nature')
  const [previewData, setPreviewData] = useState<{ quote: string; background: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const imageCategories: { value: ImageCategory; label: string }[] = [
    { value: 'nature', label: 'Nature' },
    { value: 'city', label: 'City' },
    { value: 'space', label: 'Space' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'ocean', label: 'Ocean' }
  ]

  const generateBackgroundUrl = (category: ImageCategory = 'nature') => {
    const seed = Math.floor(Math.random() * 1000000)
    const time = Date.now()
    const prompts: Record<ImageCategory, string> = {
      nature: 'nature landscape wallpaper',
      city: 'modern city skyline at night',
      space: 'galaxy stars nebula cosmic',
      abstract: 'abstract colorful geometric pattern',
      ocean: 'ocean waves beach sunset'
    }
    const prompt = prompts[category]
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&nologo=true&seed=${seed}&t=${time}`
  }

  const fetchQuoteData = async (): Promise<string> => {
    try {
      const response = await fetch('https://dummyjson.com/quotes/random')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (!result.quote || !result.author) {
        throw new Error('Invalid quote data received')
      }
      return `${result.quote}\n\n— ${result.author}`
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Check your internet connection')
      }
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while fetching quote')
    }
  }

  const displayNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const color = type === 'error' ? 'var(--vkui--color_background_negative)' : undefined
    setNotification(
      <Snackbar 
        onClose={() => setNotification(null)}
        style={color ? { background: color } : undefined}
      >
        {message}
      </Snackbar>
    )
    setTimeout(() => setNotification(null), type === 'error' ? 5000 : 3000)
  }

  const renderTextOnCanvas = (textContent: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvasElement = document.createElement('canvas')
      const context = canvasElement.getContext('2d')
      if (!context) {
        resolve('')
        return
      }
      canvasElement.width = 1080
      canvasElement.height = 1080
      context.clearRect(0, 0, canvasElement.width, canvasElement.height)
      const textSize = 48
      context.font = `bold ${textSize}px sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      const availableWidth = canvasElement.width - 100
      const spacing = textSize * 1.4
      const centerX = canvasElement.width / 2
      let centerY = canvasElement.height / 2
      const textBlocks = textContent.split('\n')
      const textLines: string[] = []
      textBlocks.forEach(block => {
        const words = block.split(' ')
        let line = words[0]
        for (let i = 1; i < words.length; i++) {
          const nextWord = words[i]
          const measuredWidth = context.measureText(line + " " + nextWord).width
          if (measuredWidth < availableWidth) {
            line += " " + nextWord
          } else {
            textLines.push(line)
            line = nextWord
          }
        }
        textLines.push(line)
      })
      const totalTextHeight = textLines.length * spacing
      centerY = centerY - (totalTextHeight / 2) + (spacing / 2)
      context.shadowColor = 'black'
      context.shadowBlur = 8
      context.lineWidth = 4

      textLines.forEach((lineText, index) => {
        const lineY = centerY + (index * spacing)
        context.strokeStyle = 'black'
        context.strokeText(lineText, centerX, lineY)
        context.fillStyle = 'white'
        context.fillText(lineText, centerX, lineY)
      })
      resolve(canvasElement.toDataURL('image/png'))
    })
  }

  const loadQuote = async () => {
    setIsProcessing(true)
    setQuoteContent(null)
    try {
      const quote = await fetchQuoteData()
      setQuoteContent(quote)
      displayNotification('Quote loaded successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quote'
      displayNotification(`Error: ${errorMessage}`, 'error')
      console.error('Quote loading error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const generatePreview = async () => {
    setIsProcessing(true)
    try {
      const backgroundImageUrl = generateBackgroundUrl(selectedImageCategory)
      const quoteText = await fetchQuoteData()
      setPreviewData({ quote: quoteText, background: backgroundImageUrl })
      setShowPreview(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview'
      displayNotification(`Preview error: ${errorMessage}`, 'error')
      console.error('Preview generation error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const buildStory = async () => {
    setIsProcessing(true)
    setShowPreview(false)
    try {
      const backgroundImageUrl = previewData?.background || generateBackgroundUrl(selectedImageCategory)
      const quoteText = previewData?.quote || await fetchQuoteData()
      const quoteImageData = await renderTextOnCanvas(quoteText)
      
      if (!quoteImageData) {
        throw new Error('Failed to render quote image')
      }

      await bridge.send('VKWebAppShowStoryBox', {
        background_type: 'image',
        url: backgroundImageUrl,
        stickers: [
          {
            sticker_type: 'renderable',
            sticker: {
              content_type: 'image',
              url: quoteImageData,
              transform: {
                relation_width: 0.8,
                translation_y: 0,
                gravity: 'center'
              },
              clickable_zones: []
            }
          }
        ]
      } as never)
      displayNotification('Story created successfully')
      setPreviewData(null)
    } catch (err) {
      let errorMessage = 'Failed to create story'
      if (err instanceof Error) {
        if (err.message.includes('VKWebAppShowStoryBox')) {
          errorMessage = 'VK Bridge error: Story editor unavailable'
        } else {
          errorMessage = err.message
        }
      }
      displayNotification(`Error: ${errorMessage}`, 'error')
      console.error('Story creation error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Panel id={id}>
      <Group>
        <Card style={{ 
          padding: 32, 
          margin: 20, 
          textAlign: 'center',
          borderRadius: 16,
          background: 'var(--vkui--color_background)'
        }}>
          <div style={{ 
            marginBottom: 24,
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--vkui--color_text_primary)',
            letterSpacing: '-0.2px'
          }}>
            Random Story with Quote
          </div>

          <div style={{ marginBottom: 20 }}>
            <SegmentedControl
              value={selectedImageCategory}
              onChange={(value) => setSelectedImageCategory(value as ImageCategory)}
              options={imageCategories}
            />
          </div>

          {showPreview && previewData && (
            <div style={{
              marginBottom: 20,
              padding: 12,
              borderRadius: 12,
              background: 'var(--vkui--color_background_secondary)',
              border: '2px solid var(--vkui--color_accent)'
            }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                marginBottom: 8,
                color: 'var(--vkui--color_text_primary)'
              }}>
                Preview
              </div>
              <div style={{
                width: '100%',
                maxWidth: '200px',
                margin: '0 auto',
                aspectRatio: '9/16',
                borderRadius: 8,
                backgroundImage: `url(${previewData.background})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: 12
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 10,
                  textAlign: 'center',
                  whiteSpace: 'pre-wrap',
                  maxWidth: '85%',
                  animation: 'fadeIn 0.5s ease-in',
                  lineHeight: 1.3
                }}>
                  {previewData.quote}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <Button
                  size="s"
                  mode="tertiary"
                  onClick={() => setShowPreview(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="s"
                  onClick={buildStory}
                  loading={isProcessing}
                  disabled={isProcessing}
                >
                  Create Story
                </Button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button
              size="l"
              stretched
              onClick={generatePreview}
              loading={isProcessing}
              disabled={isProcessing || showPreview}
              style={{
                borderRadius: 12,
                height: 48
              }}
            >
              Preview Story
            </Button>
            <Button
              size="l"
              mode="secondary"
              stretched
              onClick={loadQuote}
              loading={isProcessing}
              disabled={isProcessing}
              style={{
                borderRadius: 12,
                height: 48
              }}
            >
              Get Random Quote
            </Button>
          </div>

          {quoteContent && !showPreview && (
            <div style={{
              marginTop: 24,
              padding: 20,
              borderRadius: 12,
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              fontSize: 16,
              lineHeight: 1.6,
              background: 'var(--vkui--color_background_secondary)',
              border: '1px solid var(--vkui--color_field_border_alpha)',
              color: 'var(--vkui--color_text_primary)',
              animation: 'fadeIn 0.3s ease-in'
            }}>
              {quoteContent}
            </div>
          )}
        </Card>
      </Group>
      {notification}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Panel>
  )
}

export default ContentPanel

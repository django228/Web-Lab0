import { Panel, Button, Group, Card, Snackbar } from '@vkontakte/vkui'
import bridge from '@vkontakte/vk-bridge'
import React, { useState } from 'react'

type ContentPanelProps = {
  id: string
}

const ContentPanel = ({ id }: ContentPanelProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [notification, setNotification] = useState<React.ReactNode>(null)
  const [quoteContent, setQuoteContent] = useState<string | null>(null)

  const generateBackgroundUrl = () => {
    const seed = Math.floor(Math.random() * 1000000)
    const time = Date.now()
    return `https://image.pollinations.ai/prompt/nature%20landscape%20wallpaper?width=1080&height=1920&nologo=true&seed=${seed}&t=${time}`
  }

  const fetchQuoteData = async () => {
    const response = await fetch('https://dummyjson.com/quotes/random')
    const result = await response.json()
    return `${result.quote}\n\n— ${result.author}`
  }

  const displayNotification = (message: string) => {
    setNotification(<Snackbar onClose={() => setNotification(null)}>{message}</Snackbar>)
    setTimeout(() => setNotification(null), 3000)
  }

  const renderTextOnCanvas = (textContent: string) => {
    const canvasElement = document.createElement('canvas')
    const context = canvasElement.getContext('2d')
    if (!context) return ''
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
    return canvasElement.toDataURL('image/png')
  }

  const loadQuote = async () => {
    setIsProcessing(true)
    setQuoteContent(null)
    try {
      const quote = await fetchQuoteData()
      setQuoteContent(quote)
    } catch (err) {
      displayNotification('Error fetching quote')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const buildStory = async () => {
    setIsProcessing(true)
    setQuoteContent(null)
    try {
      const backgroundImageUrl = generateBackgroundUrl()
      const quoteText = await fetchQuoteData()
      const quoteImageData = renderTextOnCanvas(quoteText)
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
    } catch (err) {
      console.error(err)
      displayNotification('Error creating story')
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button
              size="l"
              stretched
              onClick={buildStory}
              loading={isProcessing}
              disabled={isProcessing}
              style={{
                borderRadius: 12,
                height: 48
              }}
            >
              Create Story with Quote
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
          {quoteContent && (
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
              color: 'var(--vkui--color_text_primary)'
            }}>
              {quoteContent}
            </div>
          )}
        </Card>
      </Group>
      {notification}
    </Panel>
  )
}

export default ContentPanel


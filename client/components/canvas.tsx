import { css } from '@emotion/react'
import { Coordinate } from '@shared/types'
import { socket } from '@socket/io'
import { useCallback, useEffect, useRef, useState } from 'react'

type CanvasProps = {
  gameId: string
}

export const Canvas = (props: CanvasProps) => {
  const { gameId } = props
  const height = 400
  const width = 600

  const isDrawingRef = useRef<boolean>(false)
  const mousePositionRef = useRef<Coordinate>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawLine = (originalPosition: Coordinate, newPosition: Coordinate) => {
    if (!canvasRef.current) {
      return
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (context) {
      context.strokeStyle = 'red'
      context.lineJoin = 'round'
      context.lineWidth = 5

      context.beginPath()
      context.moveTo(originalPosition.x, originalPosition.y)
      context.lineTo(newPosition.x, newPosition.y)

      context.closePath()
      context.stroke()
    }
  }

  const paint = useCallback(
    (e: MouseEvent | Touch) => {
      if (!canvasRef.current) {
        return
      }

      const canvas = canvasRef.current
      const isDrawing = isDrawingRef.current
      const mousePosition = mousePositionRef.current
      if (!isDrawing) {
        return
      }
      const x = e.pageX - canvas.offsetLeft
      const y = e.pageY - canvas.offsetTop
      const next = { x, y }

      if (mousePosition) {
        drawLine(mousePosition, next)
        socket.emit('draw-send', { current: mousePosition, next, gameId })
        mousePositionRef.current = next
      }
    },
    [gameId]
  )

  const paintStart = (e: MouseEvent | Touch) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const x = e.pageX - canvas.offsetLeft
    const y = e.pageY - canvas.offsetTop

    isDrawingRef.current = true
    mousePositionRef.current = { x, y }
  }

  const paintStop = () => {
    isDrawingRef.current = false
  }

  const wrapTouch = (handler: (touch: Touch) => void) => (e: TouchEvent) => {
    const touch = e.touches[0]
    handler(touch)
  }

  useEffect(() => {
    socket.on('draw-receive', (event) => {
      const { current, next } = event
      drawLine(current, next)
    })
  }, [])

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    const canvas = canvasRef.current

    console.log('setup effect')
    const touchPaintStart = wrapTouch(paintStart)
    const touchPaint = wrapTouch(paint)
    const touchPaintStop = wrapTouch(paintStop)

    canvas.addEventListener('mousedown', paintStart)
    canvas.addEventListener('mousemove', paint)
    canvas.addEventListener('mouseup', paintStop)
    canvas.addEventListener('touchstart', touchPaintStart)
    canvas.addEventListener('touchmove', touchPaint)
    canvas.addEventListener('touchend', touchPaintStop)
    return () => {
      console.log('tear down!')
      canvas.removeEventListener('mousedown', paintStart)
      canvas.removeEventListener('mousemove', paint)
      canvas.removeEventListener('mouseup', paintStop)
      canvas.removeEventListener('touchstart', touchPaintStart)
      canvas.removeEventListener('touchmove', touchPaint)
      canvas.removeEventListener('touchend', touchPaintStop)
    }
  }, [paint])

  return (
    <canvas
      css={css`
        border: 1px solid black;
        width: ${width}px;
        height: ${height}px;
      `}
      ref={canvasRef}
      width={width}
      height={height}
    />
  )
}

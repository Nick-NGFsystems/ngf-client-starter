'use client'
import { useEffect } from 'react'

/**
 * NgfEditBridge — enables the NGF portal's live preview and click-to-edit.
 * Must be included in app/layout.tsx. Do not remove.
 */
export default function NgfEditBridge() {
  useEffect(() => {
    let editMode = false

    const style = document.createElement('style')
    style.id = 'ngf-edit-styles'
    style.textContent = `
      [data-ngf-edit="true"] [data-ngf-field] {
        outline: 1.5px dashed rgba(59,130,246,0.45) !important;
        border-radius: 3px;
        cursor: pointer !important;
      }
      [data-ngf-edit="true"] [data-ngf-field]:hover {
        outline-color: #3b82f6 !important;
        background-color: rgba(59,130,246,0.06) !important;
      }
      [data-ngf-edit="true"] a,
      [data-ngf-edit="true"] button {
        pointer-events: none;
      }
    `
    document.head.appendChild(style)

    window.parent.postMessage({ type: 'ngfReady' }, '*')

    const messageHandler = (e: MessageEvent) => {
      if (e.data?.type === 'setEditMode') {
        editMode = !!e.data.enabled
        document.documentElement.setAttribute('data-ngf-edit', editMode ? 'true' : 'false')
      }

      if (e.data?.type === 'contentUpdate' && e.data.content) {
        function applyFlat(obj: Record<string, unknown>, prefix: string) {
          for (const [key, value] of Object.entries(obj)) {
            const path = prefix ? `${prefix}.${key}` : key
            if (typeof value === 'string') {
              const el = document.querySelector<HTMLElement>(`[data-ngf-field="${path}"]`)
              if (el) el.textContent = value
            } else if (Array.isArray(value)) {
              value.forEach((item, i) => {
                if (item && typeof item === 'object') {
                  applyFlat(item as Record<string, unknown>, `${path}.${i}`)
                }
              })
            } else if (value && typeof value === 'object') {
              applyFlat(value as Record<string, unknown>, path)
            }
          }
        }
        applyFlat(e.data.content as Record<string, unknown>, '')
      }
    }

    const clickHandler = (e: MouseEvent) => {
      if (!editMode) return
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      let target = e.target as HTMLElement | null
      while (target && target !== document.documentElement) {
        const attr = target.getAttribute('data-ngf-field')
        if (attr) {
          const dot = attr.indexOf('.')
          if (dot > -1) {
            window.parent.postMessage(
              {
                type: 'fieldClick',
                section: attr.substring(0, dot),
                field: attr.substring(dot + 1),
                currentValue: target.textContent?.trim() ?? '',
              },
              '*'
            )
          }
          return
        }
        target = target.parentElement
      }
    }

    window.addEventListener('message', messageHandler)
    document.addEventListener('click', clickHandler, true)

    return () => {
      window.removeEventListener('message', messageHandler)
      document.removeEventListener('click', clickHandler, true)
      document.getElementById('ngf-edit-styles')?.remove()
      document.documentElement.removeAttribute('data-ngf-edit')
    }
  }, [])

  return null
}
